import { supabase } from "./supabase";

export interface Routine {
  id: string;
  user_id: string;
  title: string;
  day_of_week: string;
  start_time?: string | null;
  end_time?: string | null;
  priority?: "high" | "medium" | "low" | "normal";
  position: number;
  location?: string;
  notes?: string;
  created_at: string;
}

export const addRoutine = async (data: Partial<Routine>) => {
  const { data: newRoutine, error } = await supabase
    .from('routines')
    .insert([data])
    .select()
    .single();

  if (error) throw error;
  return newRoutine as Routine;
};

export async function fetchRoutines(userId: string) {
  const { data, error } = await supabase
    .from("routines")
    .select("*")
    .eq("user_id", userId)
    .order("position", { ascending: true });

  if (error) throw error;
  return data;
}

// export async function addRoutine(item: { user_id: string; title: string; position: number }) {
//   const { data, error } = await supabase
//     .from("routines")
//     .insert(item)
//     .select()
//     .single();

//   if (error) throw error;
//   return data;
// }

export async function updateRoutine(id: string, update: any) {
  const { data, error } = await supabase
    .from("routines")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteRoutine(id: string) {
  const { error } = await supabase
    .from("routines")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
