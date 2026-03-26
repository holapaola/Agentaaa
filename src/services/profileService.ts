import { supabase } from "@/integrations/supabase/client";

export async function getProfileForUser<T>(userId: string, columns: string): Promise<T | null> {
  const selection = `id, user_id, ${columns}`;

  const { data, error } = await supabase
    .from("profiles")
    .select(selection)
    .or(`id.eq.${userId},user_id.eq.${userId}`)
    .limit(10);

  if (error) throw error;

  const rows = (data ?? []) as Array<T & { id?: string | null; user_id?: string | null }>;
  if (rows.length === 0) return null;

  const exactIdMatch = rows.find((row) => row.id === userId);
  if (exactIdMatch) return exactIdMatch as T;

  const exactUserIdMatch = rows.find((row) => row.user_id === userId);
  if (exactUserIdMatch) return exactUserIdMatch as T;

  return rows[0] as T;
}
