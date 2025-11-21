// lib/courseApi.ts
import { supabase } from "./supabase";

export type Course = {
  id: string;
  title: string;
  code: string;
  lecturer?: string;
  description?: string;
  course_unit?: number;
  scheme_of_work?: string;
  created_at?: string;
};

export type CourseSchedule = {
  id: string;
  course_id: string;
  user_id: string;
  day: string;
  start_time: string;
  end_time: string;
  location?: string;
  created_at?: string;
  courses?: Course;
};

// Fetch schedules + join course metadata
export const fetchSchedules = async (userId: string) => {
  const { data, error } = await supabase
    .from("course_schedule")                // ⛔ removed <CourseSchedule>
    .select("*, courses(*)")                // join works normally
    .eq("user_id", userId)
    .order("day", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) throw error;
  return data as CourseSchedule[];
};

export const addSchedule = async (schedule: Partial<CourseSchedule>) => {
  const { data, error } = await supabase
    .from("course_schedule")
    .insert([schedule]);

  if (error) throw error;
  return data;
};

export const updateSchedule = async (id: string, updates: Partial<CourseSchedule>) => {
  const { data, error } = await supabase
    .from("course_schedule")
    .update(updates)
    .eq("id", id);

  if (error) throw error;
  return data;
};

export const deleteSchedule = async (id: string) => {
  const { data, error } = await supabase
    .from("course_schedule")
    .delete()
    .eq("id", id);

  if (error) throw error;
  return data;
};

// ===== Courses =====

export const fetchCourses = async () => {
  const { data, error } = await supabase
    .from("courses")                       // ⛔ removed <Course>
    .select("*")
    .order("title", { ascending: true });

  if (error) throw error;
  return data as Course[];
};

export const addCourse = async (course: Partial<Course>): Promise<Course[]> => {
  const { data, error } = await supabase
    .from("courses")
    .insert([course]);

  if (error) {
    console.error("Supabase insert error:", error);
    throw error;
  }
  // handle possible null safely
  if (!data) return [];

  return data as Course[];
};

