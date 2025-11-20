// lib/courseApi.ts
import { supabase } from "./supabase";
export const fetchCourses = async (userId: string) => {
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("user_id", userId)
    .order("day", { ascending: true });
  if (error) throw error;
  
  return data;
};

export const addCourse = async (course: any) => {
  const { data, error } = await supabase.from("courses").insert([course]);
  if (error) throw error;
  return data;
};

export const updateCourse = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from("courses")
    .update(updates)
    .eq("id", id);
  if (error) throw error;
  return data;
};

export const deleteCourse = async (id: string) => {
  const { data, error } = await supabase.from("courses").delete().eq("id", id);
  if (error) throw error;
  return data;
};
