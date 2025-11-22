import { supabase } from "./supabase";

export type Assignment = {
  id: string;
  course_id: string;
  user_id: string;
  title: string;
  description?: string;
  due_date: string;
  file_url?: string;
  created_at?: string;
};

// Fetch assignments
export const fetchAssignments = async (userId: string) => {
  const { data, error } = await supabase
    .from("assignments")
    .select("*")
    .eq("user_id", userId)
    .order("due_date", { ascending: true });
  if (error) throw error;
  return data as Assignment[];
};

// Add assignment
export const addAssignment = async (assignment: Partial<Assignment>, file?: File) => {
  let file_url;
  if (file) {
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from("assignments")
      .upload(`${Date.now()}_${file.name}`, file);
    if (uploadError) throw uploadError;
    file_url = uploadData?.path;
  }

  const { data, error } = await supabase
    .from("assignments")
    .insert([{ ...assignment, file_url }]);
  if (error) throw error;
return (data ?? []) as Assignment[];
};

// Update assignment
export const updateAssignment = async (id: string, updates: Partial<Assignment>, file?: File) => {
  let file_url = updates.file_url;
  if (file) {
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from("assignments")
      .upload(`${Date.now()}_${file.name}`, file, { upsert: true });
    if (uploadError) throw uploadError;
    file_url = uploadData?.path;
  }

  const { data, error } = await supabase
    .from("assignments")
    .update({ ...updates, file_url })
    .eq("id", id);
  if (error) throw error;
return (data ?? []) as Assignment[];
};

// Delete assignment
export const deleteAssignment = async (id: string) => {
  const { data, error } = await supabase
    .from("assignments")
    .delete()
    .eq("id", id);
  if (error) throw error;
  return data;
};
