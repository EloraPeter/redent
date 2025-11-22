"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  fetchRoutines,
  addRoutine,
  updateRoutine,
  Routine,
} from "@/lib/routineApi";
import { getSmartWakeup } from "@/lib/smart-wakeup";

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

// Priority colors
const priorityColors: Record<string, string> = {
  high: "red",
  medium: "orange",
  low: "green",
  normal: "gray",
};

// Draggable routine item
function SortableRoutine({ routine, onUpdate }: { routine: Routine, onUpdate: (r: Routine) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: routine.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    padding: "8px",
    border: "1px solid gray",
    borderRadius: "4px",
    marginBottom: "4px",
    backgroundColor: priorityColors[routine.priority || "normal"],
    display: "flex",
    flexDirection: "column" as const,
    gap: "4px",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div className="flex justify-between items-center">
        <strong>{routine.title}</strong>
        <span className="text-sm">{routine.priority}</span>
      </div>
      <div className="flex gap-2">
        <input
          type="time"
          value={routine.start_time || ""}
          onChange={(e) => onUpdate({ ...routine, start_time: e.target.value })}
          className="p-1 border rounded flex-1"
        />
        <input
          type="time"
          value={routine.end_time || ""}
          onChange={(e) => onUpdate({ ...routine, end_time: e.target.value })}
          className="p-1 border rounded flex-1"
        />
      </div>
    </div>
  );
}

export default function RoutineManager() {
  const { user } = useAuth();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [newRoutine, setNewRoutine] = useState<Partial<Routine>>({
    title: "",
    day_of_week: "Monday",
    priority: "normal",
  });
  const [wakeupData, setWakeupData] = useState<any>(null);

  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    if (!user) return;
    loadRoutines();
  }, [user]);

  const loadRoutines = async () => {
    if (!user) return;
    try {
      const data = await fetchRoutines(user.id);
      setRoutines(data);
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
        day_of_week: newRoutine.day_of_week!,
        priority: newRoutine.priority!,
        position,
        location: newRoutine.location ?? "",
        notes: newRoutine.notes ?? "",
        start_time: newRoutine.start_time ?? null,
        end_time: newRoutine.end_time ?? null,
      });
      setRoutines((prev) => [...prev, item]);
      setNewRoutine({ title: "", day_of_week: "Monday", priority: "normal" });
    } catch (err: any) {
      console.error("Failed to add routine:", err);
      alert("Failed to add routine. Check console for details.");
    }
  };

  const handleUpdate = async (routine: Routine) => {
    try {
      const updated = await updateRoutine(routine.id, routine);
      setRoutines((prev) => prev.map((r) => (r.id === routine.id ? updated : r)));
    } catch (err: any) {
      console.error("Failed to update routine:", err);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = routines.findIndex((r) => r.id === active.id);
    const newIndex = routines.findIndex((r) => r.id === over.id);

    const newRoutines = arrayMove(routines, oldIndex, newIndex);
    setRoutines(newRoutines);

    try {
      await Promise.all(newRoutines.map((item, idx) => updateRoutine(item.id, { position: idx })));
    } catch (err: any) {
      console.error("Failed to update routine positions:", err);
    }
  };

  const handleCalculateWakeup = async () => {
    if (!user) return;
    const data = await getSmartWakeup(user.id);
    setWakeupData(data);
  };

  return (
    <div className="p-4 space-y-4">
      {/* Add routine */}
      <div className="flex flex-col sm:flex-row gap-2 items-center">
        <input
          value={newRoutine.title}
          onChange={(e) => setNewRoutine((prev) => ({ ...prev, title: e.target.value }))}
          placeholder="Title"
          className="p-2 border rounded flex-1"
        />
        <select
          value={newRoutine.day_of_week}
          onChange={(e) => setNewRoutine((prev) => ({ ...prev, day_of_week: e.target.value }))}
          className="p-2 border rounded"
        >
          {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map((day) => (
            <option key={day} value={day}>{day}</option>
          ))}
        </select>
        <select
          value={newRoutine.priority}
          onChange={(e) => setNewRoutine((prev) => ({ ...prev, priority: e.target.value as "high"|"medium"|"low"|"normal" }))}
          className="p-2 border rounded"
        >
          {["high","medium","low","normal"].map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <button onClick={handleAdd} className="p-2 bg-indigo-600 text-white rounded">
          Add
        </button>
      </div>

      {/* Routines list */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={routines.map((r) => r.id)} strategy={verticalListSortingStrategy}>
          {routines.map((routine) => (
            <SortableRoutine key={routine.id} routine={routine} onUpdate={handleUpdate} />
          ))}
        </SortableContext>
      </DndContext>

      {/* Smart Wakeup */}
      <div className="mt-4 p-4 border rounded space-y-2">
        <button
          onClick={handleCalculateWakeup}
          className="p-2 bg-green-600 text-white rounded"
        >
          Calculate Smart Wakeup
        </button>

        {wakeupData && (
          <div className="mt-2">
            <div><strong>Wake Time:</strong> {wakeupData.wake_time}</div>
            <div><strong>Total Prep Minutes:</strong> {wakeupData.total_prep}</div>
            <div><strong>Earliest Routine:</strong> {wakeupData.earliest?.title}</div>
            <div className="mt-2">
              <strong>Timeline:</strong>
              <ul className="list-disc ml-5">
                {wakeupData.timeline.map((step: any, idx: number) => (
                  <li key={idx}>{step.time} - {step.label} ({step.mochi})</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
