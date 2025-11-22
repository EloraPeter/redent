"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  fetchAssignments,
  addAssignment,
  updateAssignment,
  deleteAssignment,
  Assignment,
} from "@/lib/assignmentApi";
import { fetchCourses } from "@/lib/courseApi";
import { getPriorityColor } from "@/lib/utils/priority";

export default function AssignmentsManager() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseId, setCourseId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"pending" | "in progress" | "done">("pending");

  useEffect(() => {
    if (!user) return;
    load();
    loadCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const load = async () => {
    if (!user) return;
    try {
      const data = await fetchAssignments(user.id);
      setAssignments(data ?? []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadCourses = async () => {
    try {
      const data = await fetchCourses();
      setCourses(data ?? []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (editingId) {
      await updateAssignment(
        editingId,
        { title, description, course_id: courseId, due_date: dueDate, status },
        file || undefined
      );
      setEditingId(null);
    } else {
      await addAssignment(
        { title, description, course_id: courseId, due_date: dueDate, user_id: user.id, status },
        file || undefined
      );
    }

    // reset
    setTitle("");
    setDescription("");
    setCourseId("");
    setDueDate("");
    setFile(null);
    setStatus("pending");

    await load();
  };

  const handleEdit = (a: Assignment) => {
    setEditingId(a.id);
    setTitle(a.title);
    setDescription(a.description ?? "");
    setCourseId(a.course_id);
    setDueDate(a.due_date?.slice(0, 10) ?? "");
    setFile(null);
    setStatus((a as any).status ?? "pending");
  };

  // alias to match your previous button name; prevents the 'beginEdit' error
  const beginEdit = (a: Assignment) => handleEdit(a);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this assignment?")) return;
    await deleteAssignment(id);
    setAssignments(prev => prev.filter(a => a.id !== id));
  };

  // percent progress: fraction of time elapsed from created_at to due_date
  const computeProgressPercent = (a: Assignment) => {
    const created = a.created_at ? new Date(a.created_at).getTime() : null;
    const due = a.due_date ? new Date(a.due_date).getTime() : null;
    if (!due) return 0;
    const now = Date.now();

    // if we don't have created, assume a 7-day window (or clamp)
    const start = created ?? (due - 7 * 24 * 60 * 60 * 1000);
    if (now <= start) return 0;
    const total = Math.max(due - start, 1);
    const elapsed = Math.min(Math.max(now - start, 0), total);
    return Math.round((elapsed / total) * 100);
  };

  return (
    <div className="p-4">
      <form onSubmit={handleSubmit} className="grid gap-2 sm:grid-cols-2 mb-6">
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" required className="p-2 border rounded" />
        <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" className="p-2 border rounded" />
        <select value={courseId} onChange={e => setCourseId(e.target.value)} className="p-2 border rounded" required>
          <option value="">Select course</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="p-2 border rounded" required />
        <input type="file" onChange={e => setFile(e.target.files?.[0] ?? null)} className="p-2 border rounded" />
        <select value={status} onChange={e => setStatus(e.target.value as any)} className="p-2 border rounded">
          <option value="pending">Pending</option>
          <option value="in progress">In progress</option>
          <option value="done">Done</option>
        </select>

        <button type="submit" className="p-2 bg-indigo-600 text-white rounded">{editingId ? "Update" : "Add"} Assignment</button>
      </form>

      <div className="grid gap-2">
        {assignments.map(a => {
          const color = getPriorityColor(a.due_date);
          const percent = computeProgressPercent(a);

          return (
            <div
              key={a.id}
              className="p-3 border rounded flex justify-between items-center"
              style={{ borderLeft: `6px solid ${color}` }}
            >
              <div>
                <div className="font-semibold">{a.title}</div>
                <div className="text-sm text-gray-600">
                  Due: {new Date(a.due_date).toLocaleString()}
                </div>
                <div className="text-sm mt-1">
                  Status: <span className="font-medium">{(a as any).status ?? "pending"}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* circular progress ring */}
                <div style={{ width: 56, height: 56, position: "relative" }}>
                  <div
                    aria-hidden
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 9999,
                      background: `conic-gradient(${color} ${percent * 3.6}deg, #e5e7eb 0deg)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  />
                  <div style={{
                      position: "absolute",
                      inset: 6,
                      borderRadius: 9999,
                      background: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 600,
                    }}>
                    {percent}%
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => beginEdit(a)} className="text-blue-600">Edit</button>
                  <button onClick={() => handleDelete(a.id)} className="text-red-600">Delete</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
