// lib/smart-wakeup.ts
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

const travelMultiplier: Record<string, number> = {
  Walk: 1.0,
  Bike: 0.6,
  Car: 0.5,
};

// -----------------------------
// Fetch today's routines (plural!)
// -----------------------------
export async function getTodaysRoutines(userId: string, day: string) {
  const { data, error } = await supabase
    .from("routines")  // ← MUST BE "routines" (plural)
    .select("*")
    .eq("user_id", userId)
    .eq("day_of_week", day)
    .order("position", { ascending: true });

  if (error) {
    console.error("Error fetching routines:", error);
    return [];
  }

  return (data as Routine[]).map(r => ({
    ...r,
    duration: r.duration ?? 10,
    travel: r.travel ?? "Walk",
    priority: r.priority ?? "normal",
  }));
}

// -----------------------------
// First class today
// -----------------------------
export async function getTodaysFirstClass(userId: string) {
  const today = DateTime.now().toFormat("EEEE"); // Sunday, Monday...

  const { data, error } = await supabase
    .from("courses")
    .select("start_time")
    .eq("user_id", userId)
    .eq("day", today) // ← Supabase client quotes this properly → no more 400!
    .order("start_time", { ascending: true })
    .limit(1);

  if (error) {
    console.error("Error fetching first class:", error);
    return null;
  }

  return data?.[0] || null;
}

// -----------------------------
// Smart calculation (shared logic)
// -----------------------------
export function calculateSmartWakeup(
  routines: (Routine & { duration?: number; travel?: string })[]
) {
  if (routines.length === 0) return null;

  const totalPrepMinutes = routines.reduce((sum, r) => {
    const dur = r.duration ?? 10;
    const travel = r.travel ?? "Walk";
    return sum + dur * (travelMultiplier[travel] ?? 1);
  }, 0) + DEFAULT_BUFFER_MINUTES;

  // Base time: first routine with start_time, or fallback
  let baseTime = DateTime.now().plus({ hours: 2 });

  if (routines[0]?.start_time) {
    const parsed = DateTime.fromFormat(routines[0].start_time!, "HH:mm");
    if (parsed.isValid) baseTime = parsed;
  }

  const wakeTime = baseTime.minus({ minutes: Math.round(totalPrepMinutes) });

  // Build timeline
  let current = wakeTime;
  const timeline = routines.map(r => {
    const entry = {
      label: r.title,
      time: current.toFormat("HH:mm"),
      mochi: r.priority === "high" ? EMOTION.WORRIED : EMOTION.ON_TIME,
    };
    const dur = (r.duration ?? 10) * (travelMultiplier[r.travel ?? "Walk"] ?? 1);
    current = current.plus({ minutes: Math.round(dur) });
    return entry;
  });

  return {
    wakeTime,
    wakeTimeString: wakeTime.toFormat("HH:mm"),
    totalPrepMinutes: Math.round(totalPrepMinutes),
    timeline,
  };
}

// -----------------------------
// MAIN: Today's wake-up time (single source of truth!)
// -----------------------------
export async function getTodayWakeupTime(userId: string): Promise<string | null> {
  const todayStr = DateTime.now().toFormat("EEEE");
  const routines = await getTodaysRoutines(userId, todayStr);
  const firstClass = await getTodaysFirstClass(userId);

  // No class and no routines → sleep in!
  if (!firstClass && routines.length === 0) return null;

  // Priority: Class time > First routine with start_time > fallback
  let baseTime = DateTime.now().plus({ hours: 2 });
  if (firstClass?.start_time) {
    const parsed = DateTime.fromFormat(firstClass.start_time, "HH:mm");
    baseTime = parsed.isValid ? parsed : DateTime.now().plus({ hours: 2 });
  } else if (routines[0]?.start_time) {
    const parsed = DateTime.fromFormat(routines[0].start_time!, "HH:mm");
    baseTime = parsed.isValid ? parsed : DateTime.now().plus({ hours: 2 });
  } else {
    baseTime = DateTime.now().plus({ hours: 2 });
  }

  const smart = calculateSmartWakeup(routines);
  if (!smart) return null;

  const wakeTime = baseTime.minus({ minutes: smart.totalPrepMinutes });

  return wakeTime.toFormat("HH:mm");
}

// -----------------------------
// Bonus: Full smart data (for UI timeline)
// -----------------------------
export async function getSmartWakeup(userId: string) {
  const today = DateTime.now().toFormat("EEEE");
  const routines = await getTodaysRoutines(userId, today);
  const calc = calculateSmartWakeup(routines);
  const wakeTime = await getTodayWakeupTime(userId);

  return {
    routines,
    wakeTime,
    ...calc,
  };
}