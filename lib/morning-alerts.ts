// lib/morning-alerts.ts
import { DateTime } from "luxon";
import { supabase } from "./supabase";
import { getTodayWakeupTime, getTotalPreparationTime } from "./smart-wakeup";

function notify(message: string) {
  if (typeof window === "undefined") return;

  if (Notification.permission === "granted") {
    new Notification("Smart Morning", { body: message });
  }
}

export async function startMorningAlerts(userId: string) {
  if (typeof window === "undefined") return;

  // 1. Get wake-up time
  const wakeup = await getTodayWakeupTime(userId);
  if (!wakeup) return console.error("No wakeup time");

  const wakeTime = DateTime.fromISO(wakeup);

  // 2. Get routine durations
  const { data: routines } = await supabase
    .from("routine")
    .select("*")
    .eq("user_id", userId)
    .order("id");

  if (!routines) return;

  // Build sequential alerts
  let currentTime = wakeTime;

  // 0 — Wake-up alert
  scheduleAlert(currentTime, "Good morning! Time to wake up 🌞");

  // Each routine step gets a follow-up alert
  routines.forEach((step) => {
    currentTime = currentTime.plus({ minutes: step.duration });

    scheduleAlert(
      currentTime,
      `Start: ${step.title} (${step.duration} mins)`
    );
  });

  // Final arrival reminder
  const classTime = routines.find((r) => r.title.toLowerCase() === "class_time")?.time;

  if (classTime) {
    const classStart = DateTime.fromISO(classTime);
    scheduleAlert(
      classStart.minus({ minutes: 5 }),
      "⏳ Class is about to start in 5 minutes!"
    );
  }

  console.log("Morning alerts scheduled.");
}

function scheduleAlert(time: any, message: string) {
  if (typeof window === "undefined") return;

  const now = DateTime.now();
  const diff = time.diff(now, "milliseconds").milliseconds;

  if (diff <= 0) return; // skip past events

  setTimeout(() => notify(message), diff);
}
