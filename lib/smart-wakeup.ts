import { supabase } from "./supabase";
import { Routine } from "./routineApi";
import { DateTime } from "luxon";

// -----------------------------
// CONFIG (defaults)
// -----------------------------
const DEFAULT_BUFFER_MINUTES = 5;

const EMOTION = {
    EARLY: "sparkle_happy",
    ON_TIME: "normal_smile",
    LATE: "worried_clock",
    VERY_LATE: "cry_teary",
    SNOOZE_HEAVY: "sleepy_pajamas",
    WORRIED: "WORRIED"

};

// -----------------------------
// 1. Fetch today's routines
// -----------------------------
export async function getTodaysRoutines(userId: string, day: string) {
    const { data, error } = await supabase
        .from("routines")
        .select("*")
        .eq("user_id", userId)
        .eq("day_of_week", day)
        .order("position", { ascending: true });

    if (error) throw error;
    return data as Routine[];
}

// -----------------------------
// 2. Compute smart wake-up time
// -----------------------------
export function calculateSmartWakeTime(routines: Routine[]) {
    if (!routines.length) return null;

    // Find earliest routine with valid start time
    const morningRoutines = routines.filter(r => r.start_time !== null);
    if (!morningRoutines.length) return null;

    const earliest = morningRoutines.reduce((a, b) =>
        a.start_time! < b.start_time! ? a : b
    );

    // Convert times to Luxon
    const classStart = DateTime.fromFormat(earliest.start_time!, "HH:mm");

    // Calculate total prep time using duration of each routine
    let totalPrepMinutes = 0;

    for (const r of routines) {
        if (r.start_time && r.end_time) {
            const s = DateTime.fromFormat(r.start_time, "HH:mm");
            const e = DateTime.fromFormat(r.end_time, "HH:mm");
            const diff = e.diff(s, "minutes").minutes;

            totalPrepMinutes += diff;
        }
    }

    totalPrepMinutes += DEFAULT_BUFFER_MINUTES;

    const wakeTime = classStart.minus({ minutes: totalPrepMinutes });

    return {
        earliestRoutine: earliest,
        totalPrepMinutes,
        wakeTime,
        wakeTimeString: wakeTime.toFormat("HH:mm"),
    };
}

// -----------------------------
// 3. Generate morning alert timeline
// -----------------------------
export function generateMorningTimeline(routines: Routine[], wakeTime: InstanceType<typeof DateTime>) {
    const timeline = [];

    // 1. Wake alert
    timeline.push({
        label: "Wake Up",
        time: wakeTime.toFormat("HH:mm"),
        mochi: EMOTION.ON_TIME,
    });

    // 2. Steps in order
    for (const r of routines) {
        if (r.start_time) {
            timeline.push({
                label: r.title,
                time: r.start_time,
                mochi: r.priority === "high" ? EMOTION.WORRIED : EMOTION.ON_TIME,
            });
        }
    }

    return timeline;
}

// -----------------------------
// 4. Determine Mochi emotion
// -----------------------------
export function getMochiWakeEmotion(isLate: boolean, snoozes: number) {
    if (snoozes >= 3) return EMOTION.SNOOZE_HEAVY;
    if (isLate) return EMOTION.VERY_LATE;
    return EMOTION.EARLY;
}

// -----------------------------
// 5. Log wake event for streaks & weekly summary
// -----------------------------
export async function trackWakeEvent(userId: string, isLate: boolean, snoozes: number) {
    const { error } = await supabase
        .from("wake_logs")
        .insert({
            user_id: userId,
            date: new Date().toISOString().split("T")[0],
            late: isLate,
            snoozes,
        });

    if (error) throw error;
}

// -----------------------------
// MAIN FUNCTION USED BY APP
// -----------------------------
export async function getSmartWakeup(userId: string) {
    const today = DateTime.now().toFormat("cccc"); // Monday, Tuesday...
    const routines = await getTodaysRoutines(userId, today);

    const calc = calculateSmartWakeTime(routines);
    if (!calc) return { routines, wake_time: null };

    const timeline = generateMorningTimeline(routines, calc.wakeTime);

    return {
        routines,
        wake_time: calc.wakeTimeString,
        total_prep: calc.totalPrepMinutes,
        earliest: calc.earliestRoutine,
        timeline,
    };
}
