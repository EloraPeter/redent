"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { fetchCourses, addCourse, updateCourse, deleteCourse } from "@/lib/courseApi";
import { useAuth } from "@/context/AuthContext";

export default function CoursesManager() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [day, setDay] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchCourses(user.id).then(setCourses).catch(console.error);
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const course = { title, day, start_time: startTime, end_time: endTime, location, user_id: user.id };

    try {
      if (editingId) {
        await updateCourse(editingId, course);
        setEditingId(null);
      } else {
        await addCourse(course);
      }
      const updated = await fetchCourses(user.id);
      setCourses(updated);
      setTitle(""); setDay(""); setStartTime(""); setEndTime(""); setLocation("");
    } catch (err: any) {
      console.error(err.message);
    }
  };

  const handleEdit = (course: any) => {
    setEditingId(course.id);
    setTitle(course.title);
    setDay(course.day);
    setStartTime(course.start_time);
    setEndTime(course.end_time);
    setLocation(course.location);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return;
    try {
      await deleteCourse(id);
      setCourses(courses.filter(c => c.id !== id));
    } catch (err: any) {
      console.error(err.message);
    }
  };

  return (
    <div className="p-4">
      <form onSubmit={handleSubmit} className="mb-6 grid gap-2 sm:grid-cols-2">
        <input type="text" placeholder="Course Title" value={title} onChange={e => setTitle(e.target.value)} className="p-2 border rounded"/>
        <input type="text" placeholder="Day" value={day} onChange={e => setDay(e.target.value)} className="p-2 border rounded"/>
        <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="p-2 border rounded"/>
        <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="p-2 border rounded"/>
        <input type="text" placeholder="Location" value={location} onChange={e => setLocation(e.target.value)} className="p-2 border rounded"/>
        <button type="submit" className="p-2 bg-indigo-600 text-white rounded">
          {editingId ? "Update Course" : "Add Course"}
        </button>
      </form>

      <div className="grid gap-2">
        {courses.map(course => (
          <div key={course.id} className="p-2 border rounded flex justify-between items-center">
            <div>
              <strong>{course.title}</strong> — {course.day} {course.start_time}–{course.end_time} @ {course.location}
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleEdit(course)} className="text-blue-600">Edit</button>
              <button onClick={() => handleDelete(course.id)} className="text-red-600">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
