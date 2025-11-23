"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  fetchRoutines,
  addRoutine,
  updateRoutine,
  Routine,
} from "@/lib/routineApi";
import { DateTime } from "luxon";
import { getSmartWakeup, EMOTION } from "@/lib/smart-wakeup";
import { startMorningAlerts } from "../lib/morning-alerts";
import { getTodayWakeupTime } from "../lib/smart-wakeup";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Travel multiplier (how travel mode affects duration in minutes)
const travelMultiplier: Record<string, number> = {
  Walk: 1.0,
  Bike: 0.6,
  Car: 0.5,
};

// Individual draggable routine item
function SortableRoutine({
  routine,
  onChange,
}: {
  routine: Routine & { duration?: number; travel?: string };
  onChange: (id: string, field: string, value: any) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: routine.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    padding: "8px",
    border: "1px solid gray",
    borderRadius: "4px",
    marginBottom: "4px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    backgroundColor: routine.priority === "high" ? "#f87171" :
      routine.priority === "medium" ? "#fbbf24" :
        routine.priority === "low" ? "#4ade80" : "#d1d5db",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>{routine.title}</span>
        <select
          value={routine.priority}
          onChange={(e) => onChange(routine.id, "priority", e.target.value)}
        >
          {["high", "medium", "low", "normal"].map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div style={{ display: "flex", gap: "4px" }}>
        <input
          type="number"
          placeholder="Duration (min)"
          value={routine.duration || ""}
          onChange={(e) =>
            onChange(routine.id, "duration", Number(e.target.value))
          }
          className="border p-1 rounded flex-1"
        />
        <select
          value={routine.travel || "Walk"}
          onChange={(e) =>
            onChange(routine.id, "travel", e.target.value)
          }
        >
          {["Walk", "Bike", "Car"].map((mode) => (
            <option key={mode} value={mode}>{mode}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default function RoutineManager() {
  const { user } = useAuth();
  const [routines, setRoutines] = useState<
    (Routine & { duration?: number; travel?: string })[]
  >([]);
  const [newRoutine, setNewRoutine] = useState<Partial<Routine & { duration?: number; travel?: string }>>({
    title: "",
    priority: "normal",
    duration: 10,
    travel: "Walk",
  });

  const [smartData, setSmartData] = useState<any>(null);

  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    if (!user) return;
    loadRoutines();
  }, [user]);

  const loadRoutines = async () => {
    if (!user) return;
    try {
      const data = await fetchRoutines(user.id);
      // Map durations & travel defaults
      setRoutines(
        data.map(r => ({
          ...r,
          duration: r.duration ?? 10,
          travel: r.travel ?? "Walk",
          priority: r.priority ?? "normal",
        }))
      );
    } catch (err: any) {
      console.error("Failed to fetch routines:", err);
    }
  };

  const handleAdd = async () => {
    if (!newRoutine.title || !user) return;

    try {
      const position = routines.length;

      const item = await addRoutine({
        user_id: user.id,
        title: newRoutine.title,
        day_of_week: new Date().toLocaleDateString("en-US", { weekday: "long" }),
        priority: newRoutine.priority!,
        position,
      });

      setRoutines((prev) => [...prev, { ...item, duration: newRoutine.duration, travel: newRoutine.travel }]);
      setNewRoutine({ title: "", priority: "normal", duration: 10, travel: "Walk" });
    } catch (err: any) {
      console.error("Failed to add routine:", err);
      alert("Failed to add routine. Check console for details.");
    }
  };

  const handleChange = (id: string, field: string, value: any) => {
    setRoutines((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = routines.findIndex((r) => r.id === active.id);
    const newIndex = routines.findIndex((r) => r.id === over.id);

    const newRoutines = arrayMove(routines, oldIndex, newIndex);
    setRoutines(newRoutines);

    try {
      await Promise.all(
        newRoutines.map((item, idx) => updateRoutine(item.id, { position: idx }))
      );
    } catch (err: any) {
      console.error("Failed to update routine positions:", err);
    }
  };

  const calculateTimeline = () => {
    if (!routines.length) return null;

    let totalMinutes = 0;
    const today = new Date();
    const timeline: { label: string; time: string; mochi: string }[] = [];

    // Sum prep durations + travel multipliers
    routines.forEach(r => {
      const duration = r.duration || 10;
      const travel = r.travel || "Walk";
      totalMinutes += duration * (travelMultiplier[travel] || 1);
    });
    totalMinutes += 5; // buffer

    // Calculate earliest wakeup
    const firstClassTime = routines[0].start_time ? DateTime.fromFormat(routines[0].start_time!, "HH:mm") : DateTime.now().plus({ minutes: 60 });
    const wakeTime = firstClassTime.minus({ minutes: totalMinutes });

    // Timeline
    let currentTime = wakeTime;
    routines.forEach(r => {
      timeline.push({
        label: r.title,
        time: currentTime.toFormat("HH:mm"),
        mochi: r.priority === "high" ? EMOTION.WORRIED : EMOTION.ON_TIME,
      });
      const duration = r.duration || 10;
      const travel = r.travel || "Walk";
      currentTime = currentTime.plus({ minutes: duration * (travelMultiplier[travel] || 1) });
    });

    setSmartData({ wakeTime: wakeTime.toFormat("HH:mm"), timeline });
  };

  useEffect(() => {
    calculateTimeline();
  }, [routines]);

  const [wakeTime, setWakeTime] = useState<string | null>(null);

  useEffect(() => {
    async function loadWakeTime() {
      if (!user) return;
      const time = await getTodayWakeupTime(user.id);
      setWakeTime(time);
    }
    loadWakeTime();
  }, []);


  return (
    <div className="p-4 space-y-4">
      {/* Add new routine */}
      <div className="flex flex-col sm:flex-row gap-2 items-center">
        <input
          value={newRoutine.title}
          onChange={(e) =>
            setNewRoutine((prev) => ({ ...prev, title: e.target.value }))
          }
          placeholder="Task title"
          className="p-2 border rounded flex-1"
        />
        <input
          type="number"
          placeholder="Duration (min)"
          value={newRoutine.duration}
          onChange={(e) =>
            setNewRoutine((prev) => ({ ...prev, duration: Number(e.target.value) }))
          }
          className="p-2 border rounded w-28"
        />
        // Priority select
        <select
          value={newRoutine.priority}
          onChange={(e) =>
            setNewRoutine((prev) => ({
              ...prev,
              priority: e.target.value as "high" | "medium" | "low" | "normal",
            }))
          }
        >
          {["high", "medium", "low", "normal"].map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

// Travel select
        <select
          value={newRoutine.travel}
          onChange={(e) =>
            setNewRoutine((prev) => ({
              ...prev,
              travel: e.target.value as "Walk" | "Bike" | "Car",
            }))
          }
        >
          {["Walk", "Bike", "Car"].map(mode => (
            <option key={mode} value={mode}>{mode}</option>
          ))}
        </select>

        <button onClick={handleAdd} className="p-2 bg-indigo-600 text-white rounded">
          Add
        </button>
      </div>

      {/* Drag-and-drop list */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={routines.map((r) => r.id)} strategy={verticalListSortingStrategy}>
          {routines.map((routine) => (
            <SortableRoutine key={routine.id} routine={routine} onChange={handleChange} />
          ))}
        </SortableContext>
      </DndContext>

      {/* Smart Wakeup Timeline */}
      {wakeTime ? (
        <p className="text-lg font-semibold">
          ⏰ You should wake up at <span className="text-blue-600">{wakeTime}</span>
        </p>
      ) : (
        <p className="text-gray-500">No classes today 🎉</p>
      )}

      {smartData && (
        <div className="mt-6 p-4 border rounded space-y-2">
          <h3 className="text-lg font-bold">Smart Wakeup: {smartData.wakeTime}</h3>
          {smartData.timeline.map((t: any, idx: number) => (
            <div key={idx} className="flex justify-between items-center">
              <span>{t.time} → {t.label}</span>
              <span>{t.mochi}</span>
            </div>
          ))}
        </div>
      )}

      {/* morning alerts */}
      <button
        onClick={async () => {
          if (!user) return;

          if (Notification.permission !== "granted") {
            await Notification.requestPermission();
          }

          startMorningAlerts(user.id);
          alert("Morning assistant activated. Your reminders are set!");
        }}
        className="p-3 bg-blue-600 text-white rounded-lg w-full"
      >
        Activate Morning Assistant
      </button>

    </div>
  );
}
