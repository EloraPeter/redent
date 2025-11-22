"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  fetchRoutines,
  addRoutine,
  updateRoutine,
  Routine,
} from "@/lib/routineApi";

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

// Individual draggable routine item
function SortableRoutine({ routine }: { routine: Routine }) {
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
    justifyContent: "space-between",
    alignItems: "center",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {routine.title}
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
      console.error("Failed to add routine:", JSON.stringify(err, null, 2));
      alert("Failed to add routine. Check console for details.");
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = routines.findIndex((r) => r.id === active.id);
    const newIndex = routines.findIndex((r) => r.id === over.id);

    const newRoutines = arrayMove(routines, oldIndex, newIndex);
    setRoutines(newRoutines);

    // Update positions in the database
    try {
      await Promise.all(
        newRoutines.map((item, idx) => updateRoutine(item.id, { position: idx }))
      );
    } catch (err: any) {
      console.error("Failed to update routine positions:", err);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Add new routine */}
      <div className="flex flex-col sm:flex-row gap-2 items-center">
        <input
          value={newRoutine.title}
          onChange={(e) =>
            setNewRoutine((prev) => ({ ...prev, title: e.target.value }))
          }
          placeholder="Title"
          className="p-2 border rounded flex-1"
        />
        <select
          value={newRoutine.day_of_week}
          onChange={(e) =>
            setNewRoutine((prev) => ({ ...prev, day_of_week: e.target.value }))
          }
          className="p-2 border rounded"
        >
          {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map((day) => (
            <option key={day} value={day}>{day}</option>
          ))}
        </select>
        <select
          value={newRoutine.priority}
          onChange={(e) =>
            setNewRoutine((prev) => ({
              ...prev,
              priority: e.target.value as "high"|"medium"|"low"|"normal"
            }))
          }
          className="p-2 border rounded"
        >
          {["high","medium","low","normal"].map((p) => (
            <option key={p} value={p}>{p}</option>
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
            <SortableRoutine key={routine.id} routine={routine} />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}
