import { supabase } from "./supabase";

export const fetchSchedules = async (userId: string) => {
  const { data, error } = await supabase
    .from("course_schedule")
    .select("*, courses(title, code)")
    .eq("user_id", userId)
    .order("day", { ascending: true });

  if (error) throw error;
  return data;
};

export const addSchedule = async (schedule: any) => {
  const { data, error } = await supabase
    .from("course_schedule")
    .insert([schedule]);

  if (error) throw error;
  return data;
};

export const updateSchedule = async (id: string, updates: any) => {
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
