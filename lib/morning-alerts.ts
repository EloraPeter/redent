// lib/morning-alerts.ts
import { DateTime } from "luxon";

// THIS LINE IS THE FIX — use any instead of DateTime type
type LuxonDateTime = InstanceType<typeof DateTime>;

import {
  getTodayWakeupTime,
  getTodaysRoutines,
  getTodaysFirstClass,
} from "./smart-wakeup";

const travelMultiplier: Record<string, number> = {
  Walk: 1.0,
  Bike: 0.6,
  Car: 0.5,
};

function notify(message: string) {
  if (typeof window === "undefined") return;
  if (Notification.permission === "granted") {
    new Notification("Morning Assistant", { body: message });
  }
}

// Now this works perfectly — no more 2709 error
function scheduleAlert(time: LuxonDateTime, message: string) {
  if (typeof window === "undefined") return;

  const now = DateTime.now();
  const delayMs = time.diff(now).as("milliseconds");

  if (delayMs <= 0) {
    notify(message + " (now!)");
    return;
  }

  setTimeout(() => notify(message), delayMs);
}

export async function startMorningAlerts(userId: string) {
  if (typeof window === "undefined") return;

  if (Notification.permission === "default") {
    await Notification.requestPermission();
  }

  const wakeupTimeStr = await getTodayWakeupTime(userId);
  if (!wakeupTimeStr) {
    notify("No classes today — sleep in!");
    return;
  }

  const wakeTime = DateTime.fromFormat(wakeupTimeStr, "HH:mm");
  scheduleAlert(wakeTime, "Good morning! Time to wake up");

  const today = DateTime.now().toFormat("EEEE");
  const routines = await getTodaysRoutines(userId, today);

  let currentTime = wakeTime;
  for (const r of routines) {
    const dur = (r.duration ?? 10) * (travelMultiplier[r.travel ?? "Walk"] ?? 1);
    currentTime = currentTime.plus({ minutes: Math.round(dur) });
    scheduleAlert(currentTime, `Start: ${r.title} (${Math.round(dur)} min)`);
  }

  const firstClass = await getTodaysFirstClass(userId);
  if (firstClass?.start_time) {
    const classTime = DateTime.fromFormat(firstClass.start_time, "HH:mm");
    scheduleAlert(classTime.minus({ minutes: 10 }), "Leave now for class!");
    scheduleAlert(classTime.minus({ minutes: 5 }), "Class in 5 minutes!");
  }

  notify("Morning Assistant activated! All alerts scheduled.");
}