import { supabase } from "./supabase";
import { Routine } from "./routineApi";
import { DateTime } from "luxon";

// -----------------------------
// CONFIG
// -----------------------------
const DEFAULT_BUFFER_MINUTES = 5;

export const EMOTION = {
  EARLY: "sparkle_happy",
  ON_TIME: "normal_smile",
  LATE: "worried_clock",
  VERY_LATE: "cry_teary",
  SNOOZE_HEAVY: "sleepy_pajamas",
  WORRIED: "worried_face",
};

// Travel multipliers
const travelMultiplier: Record<string, number> = {
  Walk: 1.0,
  Bike: 0.6,
  Car: 0.5,
};

// -----------------------------
// Fetch today's routines
// -----------------------------
export async function getTodaysRoutines(userId: string, day: string) {
  const { data, error } = await supabase
    .from("routines")
    .select("*")
    .eq("user_id", userId)
    .eq("day_of_week", day)
    .order("position", { ascending: true });

  if (error) throw error;
  return (data as Routine[]).map(r => ({ ...r, duration: r.duration || 10, travel: r.travel || "Walk" }));
}

export async function getTodaysFirstClass(userId: string) {
  const today = DateTime.local().toFormat("EEEE"); // Monday, Tuesday, etc.

  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("user_id", userId)
    .eq("day", today)
    .order("start_time", { ascending: true })
    .limit(1);

  if (error) return null;

  return data?.[0] || null;
}

export function calculateWakeupTime(classStart: string, prepMinutes: number) {
  const start = DateTime.fromFormat(classStart, "HH:mm");

  const wake = start.minus({ minutes: prepMinutes });

  return wake.toFormat("HH:mm");
}

export async function getTotalPreparationTime(userId: string) {
  const { data, error } = await supabase
    .from("routine")
    .select("duration")
    .eq("user_id", userId);

  if (error || !data) return 0;

  const total = data.reduce((sum, item) => sum + (item.duration || 0), 0);

  return total;
}



export async function getTodayWakeupTime(userId: string) {
  const firstClass = await getTodaysFirstClass(userId);

  if (!firstClass) return null; // No class today

  // Sum all routine durations
  const prepMinutes = await getTotalPreparationTime(userId);

  return calculateWakeupTime(firstClass.start_time, prepMinutes);
}


// -----------------------------
// Calculate smart wakeup
// -----------------------------
export function calculateSmartWakeup(routines: (Routine & { duration?: number; travel?: string })[]) {
  if (!routines.length) return null;

  // Total prep time including travel
  let totalPrepMinutes = routines.reduce((sum, r) => {
    const dur = r.duration || 10;
    const travel = r.travel || "Walk";
    return sum + dur * (travelMultiplier[travel] || 1);
  }, 0);

  totalPrepMinutes += DEFAULT_BUFFER_MINUTES;

  // Determine earliest routine with start_time if exists
  const firstRoutineTime = routines[0].start_time
    ? DateTime.fromFormat(routines[0].start_time!, "HH:mm")
    : DateTime.now().plus({ minutes: 60 });

  const wakeTime = firstRoutineTime.minus({ minutes: totalPrepMinutes });

  // Build timeline
  let currentTime = wakeTime;
  const timeline = routines.map(r => {
    const entry = {
      label: r.title,
      time: currentTime.toFormat("HH:mm"),
      mochi: r.priority === "high" ? EMOTION.WORRIED : EMOTION.ON_TIME,
    };
    const dur = r.duration || 10;
    const travel = r.travel || "Walk";
    currentTime = currentTime.plus({ minutes: dur * (travelMultiplier[travel] || 1) });
    return entry;
  });

  return {
    wakeTime,
    wakeTimeString: wakeTime.toFormat("HH:mm"),
    totalPrepMinutes,
    timeline,
  };
}

// -----------------------------
// Main helper
// -----------------------------
export async function getSmartWakeup(userId: string) {
  const today = DateTime.now().toFormat("cccc");
  const routines = await getTodaysRoutines(userId, today);
  const calc = calculateSmartWakeup(routines);
  return {
    routines,
    ...calc,
  };
}
