// lib/assignmentApi.ts
import { supabase } from "./supabase";

export type Assignment = {
  id: string;
  course_id: string;
  user_id: string;
  title: string;
  description?: string;
  due_date: string; // ISO string / timestamp
  file_url?: string; // storage path
  status?: string;
  created_at?: string;
};

// bucket name you'll create in Supabase UI
const BUCKET = "assignments";

export const fetchAssignments = async (userId: string): Promise<Assignment[]> => {
  const { data, error } = await supabase
    .from("assignments")
    .select("*")
    .eq("user_id", userId)
    .order("due_date", { ascending: true });

  if (error) throw error;
  // null-safe cast
  return (data ?? []) as Assignment[];
};

export const addAssignment = async (
  assignment: Partial<Assignment>,
  file?: File
): Promise<Assignment[]> => {
  let file_url: string | undefined;

  if (file) {
    // name the file uniquely (timestamp + original name)
    const path = `${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file);

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      throw uploadError;
    }

    file_url = uploadData?.path;
  }

  const payload = { ...assignment, file_url };
  const { data, error } = await supabase.from("assignments").insert([payload]);

  if (error) {
    console.error("DB insert error (addAssignment):", error);
    throw error;
  }

  return (data ?? []) as Assignment[];
};

export const updateAssignment = async (
  id: string,
  updates: Partial<Assignment>,
  file?: File
): Promise<Assignment[]> => {
  let file_url = updates.file_url;

  if (file) {
    const path = `${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: true });

    if (uploadError) {
      console.error("Storage upload error (update):", uploadError);
      throw uploadError;
    }
    file_url = uploadData?.path;
  }

  const { data, error } = await supabase
    .from("assignments")
    .update({ ...updates, file_url })
    .eq("id", id);

  if (error) {
    console.error("DB update error (updateAssignment):", error);
    throw error;
  }

  return (data ?? []) as Assignment[];
};

export const deleteAssignment = async (id: string) => {
  const { data, error } = await supabase.from("assignments").delete().eq("id", id);
  if (error) {
    console.error("DB delete error (deleteAssignment):", error);
    throw error;
  }
  return data;
};

// helper: get public URL for a stored file (if your bucket is public)
// returns string URL or undefined
export const getAssignmentFilePublicUrl = (path?: string) => {
  if (!path) return undefined;
  // supabase-js v2: use .getPublicUrl
const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
return data.publicUrl ?? undefined;
};
