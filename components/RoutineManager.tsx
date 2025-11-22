"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { useAuth } from "@/context/AuthContext";
import {
    fetchRoutines,
    addRoutine,
    updateRoutine,
    deleteRoutine,
} from "@/lib/routineApi";

export default function RoutineManager() {
    const { user } = useAuth();
    const [routines, setRoutines] = useState<any[]>([]);
    const [newTitle, setNewTitle] = useState("");

    useEffect(() => {
        if (!user) return;
        load();
    }, [user]);

    const load = async () => {
        if (!user) return;
        const data = await fetchRoutines(user.id);
        setRoutines(data);
    };

    const handleAdd = async () => {
        if (!newTitle || !user) return;

        const position = routines.length; // next index

        const item = await addRoutine({
            user_id: user.id,
            title: newTitle,
            position,
        });

        setRoutines(prev => [...prev, item]);
        setNewTitle("");
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this routine item?")) return;

        await deleteRoutine(id);
        setRoutines(prev => prev.filter(r => r.id !== id));
    };

    // DRAG END
    const handleDragEnd = async (result: any) => {
        if (!result.destination) return;

        const from = result.source.index;
        const to = result.destination.index;

        const items = Array.from(routines);
        const [moved] = items.splice(from, 1);
        items.splice(to, 0, moved);

        // Update UI
        setRoutines(items);

        // Persist new order
        await Promise.all(
            items.map((item, idx) =>
                updateRoutine(item.id, { position: idx })
            )
        );
    };

    return (
        <div className="p-4 space-y-4">
            <div className="flex gap-2">
                <input
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="New routine item"
                    className="p-2 border rounded flex-1"
                />
                <button onClick={handleAdd} className="p-2 bg-indigo-600 text-white rounded">
                    Add
                </button>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="routine-list">
                    {(provided: import("react-beautiful-dnd").DroppableProvided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                            {routines.map((r, index) => (
                                <Draggable key={r.id} draggableId={r.id} index={index}>
                                    {(provided: import("react-beautiful-dnd").DraggableProvided) => (
                                        <div
                                            className="p-3 border rounded flex justify-between items-center bg-white"
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                        >
                                            <span>{r.title}</span>
                                            <button onClick={() => handleDelete(r.id)} className="text-red-600">
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>

            </DragDropContext>
        </div>
    );
}
