"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import type { DraggableProvided, DroppableProvided } from "react-beautiful-dnd";
import { useAuth } from "@/context/AuthContext";
import {
    fetchRoutines,
    addRoutine,
    updateRoutine,
    deleteRoutine,
    Routine,
} from "@/lib/routineApi";


// Priority color mapping
const priorityColors: Record<string, string> = {
    high: "red",
    medium: "orange",
    low: "green",
    normal: "gray",
};

export default function RoutineManager() {
    const { user } = useAuth();
    const [routines, setRoutines] = useState<Routine[]>([]);
    const [newRoutine, setNewRoutine] = useState<Partial<Routine>>({ title: "", day_of_week: "Monday", priority: "normal" });

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

            setRoutines(prev => [...prev, item]);
            setNewRoutine({ title: "", day_of_week: "Monday", priority: "normal" });
        } catch (err: any) {
            console.error("Failed to add routine:", JSON.stringify(err, null, 2));
            alert("Failed to add routine. Check console for details.");
        }
    };

    const handleDragEnd = async (result: DropResult) => {
        if (!result.destination) return;

        const items = Array.from(routines);
        const [moved] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, moved);

        setRoutines(items);

        try {
            await Promise.all(
                items.map((item, idx) => updateRoutine(item.id, { position: idx }))
            );
        } catch (err: any) {
            console.error("Failed to update routine positions:", err);
        }
    };


    const handleEditField = (id: string, field: keyof Routine, value: any) => {
        setRoutines(prev =>
            prev.map(r => (r.id === id ? { ...r, [field]: value } : r))
        );
    };

    const handleUpdate = async (r: Routine) => {
        await updateRoutine(r.id, r);
        await loadRoutines();
    };

    return (
        <div className="p-4 space-y-4">
            {/* Add new routine */}
            <div className="flex flex-col sm:flex-row gap-2 items-center">
                <input
                    value={newRoutine.title}
                    onChange={e => setNewRoutine(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Title"
                    className="p-2 border rounded flex-1"
                />
                <select
                    value={newRoutine.day_of_week}
                    onChange={e => setNewRoutine(prev => ({ ...prev, day_of_week: e.target.value }))}
                    className="p-2 border rounded"
                >
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                        <option key={day} value={day}>{day}</option>
                    ))}
                </select>
                <select
                    value={newRoutine.priority}
                    onChange={e =>
                        setNewRoutine(prev => ({
                            ...prev,
                            priority: e.target.value as "high" | "medium" | "low" | "normal"
                        }))
                    }
                    className="p-2 border rounded"
                >
                    {["high", "medium", "low", "normal"].map(p => (
                        <option key={p} value={p}>{p}</option>
                    ))}
                </select>
                <button onClick={handleAdd} className="p-2 bg-indigo-600 text-white rounded">
                    Add
                </button>
            </div>

            {/* Drag-and-drop list */}
            <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="routine-list"
                    // @ts-expect-error react-beautiful-dnd types mismatch
                    isDropDisabled={false}>
                    {(provided: DroppableProvided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef}>
                            {routines.map((r, index) =>
                                r.id ? (
                                    <Draggable key={r.id} draggableId={r.id} index={index}>
                                        {(provided: DraggableProvided) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                            >
                                                {r.title}
                                            </div>
                                        )}
                                    </Draggable>
                                ) : null
                            )}

                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>

            </DragDropContext>
        </div>
    );
}
