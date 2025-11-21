// app/components/CoursesManager.tsx (or wherever)
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  fetchSchedules,
  addSchedule,
  updateSchedule,
  deleteSchedule,
  fetchCourses as fetchCourseList,
  addCourse,
} from "@/lib/courseApi";

export default function CoursesManager() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);

  // form fields
  const [courseId, setCourseId] = useState<string | "">(""); // choose an existing course
  const [titleFreeText, setTitleFreeText] = useState(""); // optional: for quick create without courses table
  const [day, setDay] = useState("");
  const [courseCode, setCourseCode] = useState(""); // <-- Add this
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    load();
    loadCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const load = async () => {
    if (!user) return;
    try {
      const data = await fetchSchedules(user.id);
      setSchedules(data ?? []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadCourses = async () => {
    try {
      const c = await fetchCourseList();
      setCourses(c ?? []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    let finalCourseId = courseId;

    // If user typed a new course
    if (titleFreeText.trim()) {
      const existingCourse = courses.find(c => c.title.toLowerCase() === titleFreeText.trim().toLowerCase());
      if (existingCourse) {
        finalCourseId = existingCourse.id;
      } else {
        const newCourse = { title: titleFreeText.trim(), code: courseCode.trim() || "-", user_id: user.id };
        const createdCourse = await addCourse(newCourse);
        if (!createdCourse || createdCourse.length === 0) {
          alert("Failed to create course. Please try again.");
          return;
        }
        finalCourseId = createdCourse[0].id;
        // update courses state so the dropdown / display works correctly
        setCourses(prev => [...prev, createdCourse[0]]);
      }
    }

    if (!finalCourseId) {
      alert("Course is required.");
      return;
    }

    const schedulePayload = {
      course_id: finalCourseId,
      user_id: user.id,
      day,
      start_time: startTime,
      end_time: endTime,
      location,
    };

    if (editingId) {
      await updateSchedule(editingId, schedulePayload);
      setEditingId(null);
    } else {
      await addSchedule(schedulePayload);
    }

    await load();
    // Reset form
    setCourseId("");
    setTitleFreeText("");
    setCourseCode(""); // <-- reset here
    setDay("");
    setStartTime("");
    setEndTime("");
    setLocation("");
  };


  const handleEdit = (s: any) => {
    setEditingId(s.id);
    setCourseId(s.course_id);
    setTitleFreeText(""); // for when creating course on the fly
    setDay(s.day);
    setStartTime(s.start_time?.slice(0, 5) ?? ""); // if stored as "HH:MM:SS"
    setEndTime(s.end_time?.slice(0, 5) ?? "");
    setLocation(s.location ?? "");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return;
    try {
      await deleteSchedule(id);
      setSchedules(prev => prev.filter(x => x.id !== id));
    } catch (err: any) {
      console.error(err.message ?? err);
    }
  };

  return (
    <div className="p-4">
      <form onSubmit={handleSubmit} className="mb-6 grid gap-2 sm:grid-cols-2">
        {/* Course title (either select or type a new one) */}
        <input
          type="text"
          placeholder="Course title"
          value={titleFreeText}
          onChange={e => setTitleFreeText(e.target.value)}
          className="p-2 border rounded"
          required
        />

        <input
          type="text"
          placeholder="Course code (optional)"
          value={courseCode}        // create a new state: const [courseCode, setCourseCode] = useState("")
          onChange={e => setCourseCode(e.target.value)}
          className="p-2 border rounded"
        />


        {/* Schedule fields */}
        <input
          type="text"
          placeholder="Day"
          value={day}
          onChange={e => setDay(e.target.value)}
          className="p-2 border rounded"
          required
        />
        <input
          type="time"
          value={startTime}
          onChange={e => setStartTime(e.target.value)}
          className="p-2 border rounded"
          required
        />
        <input
          type="time"
          value={endTime}
          onChange={e => setEndTime(e.target.value)}
          className="p-2 border rounded"
          required
        />
        <input
          type="text"
          placeholder="Location"
          value={location}
          onChange={e => setLocation(e.target.value)}
          className="p-2 border rounded"
        />

        <button
          type="submit"
          className="p-2 bg-indigo-600 text-white rounded"
        >
          {editingId ? "Update Schedule" : "Add Course & Schedule"}
        </button>
      </form>


      <div className="grid gap-2">
        {schedules.map(s => (
          <div key={s.id} className="p-2 border rounded flex justify-between items-center">
            <div>
              <strong>{s.courses?.title ?? "Untitled course"}</strong> — {s.day} {s.start_time?.slice(0, 5) ?? ""}–{s.end_time?.slice(0, 5) ?? ""} @ {s.location}
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleEdit(s)} className="text-blue-600">Edit</button>
              <button onClick={() => handleDelete(s.id)} className="text-red-600">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
