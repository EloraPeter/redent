"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchAssignments, addAssignment, updateAssignment, deleteAssignment, Assignment } from "@/lib/assignmentApi";
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

  useEffect(() => {
    if (!user) return;
    load();
    loadCourses();
  }, [user]);

  const load = async () => {
    if (!user) return;
    const data = await fetchAssignments(user.id);
    setAssignments(data);
  };

  const loadCourses = async () => {
    const data = await fetchCourses();
    setCourses(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (editingId) {
      await updateAssignment(editingId, { title, description, course_id: courseId, due_date: dueDate }, file || undefined);
      setEditingId(null);
    } else {
      await addAssignment({ title, description, course_id: courseId, due_date: dueDate, user_id: user.id }, file || undefined);
    }

    // reset
    setTitle("");
    setDescription("");
    setCourseId("");
    setDueDate("");
    setFile(null);

    await load();
  };

  const handleEdit = (a: Assignment) => {
    setEditingId(a.id);
    setTitle(a.title);
    setDescription(a.description ?? "");
    setCourseId(a.course_id);
    setDueDate(a.due_date.slice(0, 10));
    setFile(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this assignment?")) return;
    await deleteAssignment(id);
    setAssignments(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="p-4">
      <form onSubmit={handleSubmit} className="grid gap-2 sm:grid-cols-2 mb-6">
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" required className="p-2 border rounded"/>
        <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" className="p-2 border rounded"/>
        <select value={courseId} onChange={e => setCourseId(e.target.value)} className="p-2 border rounded" required>
          <option value="">Select course</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="p-2 border rounded" required/>
        <input type="file" onChange={e => setFile(e.target.files?.[0] ?? null)} className="p-2 border rounded"/>
        <button type="submit" className="p-2 bg-indigo-600 text-white rounded">{editingId ? "Update" : "Add"} Assignment</button>
      </form>

      <div className="grid gap-2">
        {assignments.map(a => (
          <div key={a.id} className="p-2 border rounded flex justify-between items-center">
            <div>
              <strong>{a.title}</strong> — {a.due_date.slice(0,10)} {a.description && `| ${a.description}`}
              {a.file_url && <a className="ml-2 text-blue-600" href={`https://your-supabase-url/storage/v1/object/public/assignments/${a.file_url}`} target="_blank">Download</a>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleEdit(a)} className="text-blue-600">Edit</button>
              <button onClick={() => handleDelete(a.id)} className="text-red-600">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
