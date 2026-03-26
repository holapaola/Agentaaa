import { supabase } from "@/integrations/supabase/client";

function isMissingClientLifecycleColumn(error: { message?: string; code?: string } | null) {
  if (!error) return false;

  return (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    error.message?.includes("deleted_at") === true ||
    error.message?.includes("slot_locked_until") === true
  );
}

export async function selectAgencyClients<T>(
  agencyId: string,
  columns: string,
  options?: {
    orderBy?: string;
    ascending?: boolean;
    includeArchived?: boolean;
  },
): Promise<{ data: T[] | null; error: { message?: string; code?: string } | null; archivedFilterApplied: boolean }> {
  const { orderBy = "created_at", ascending = false, includeArchived = false } = options ?? {};

  const baseQuery = () =>
    supabase
      .from("clients")
      .select(columns)
      .eq("agency_id", agencyId)
      .order(orderBy, { ascending });

  if (includeArchived) {
    const { data, error } = await baseQuery();
    return { data: (data as T[] | null) ?? null, error, archivedFilterApplied: false };
  }

  const filteredQuery = await baseQuery().is("deleted_at", null);
  if (!isMissingClientLifecycleColumn(filteredQuery.error)) {
    return {
      data: (filteredQuery.data as T[] | null) ?? null,
      error: filteredQuery.error,
      archivedFilterApplied: true,
    };
  }

  const fallbackQuery = await baseQuery();
  return {
    data: (fallbackQuery.data as T[] | null) ?? null,
    error: fallbackQuery.error,
    archivedFilterApplied: false,
  };
}

export async function removeAgencyClient(
  clientId: string,
  options?: {
    slotLockedUntil?: string | null;
  },
): Promise<{ slotLocked: boolean }> {
  const slotLockedUntil = options?.slotLockedUntil ?? null;

  try {
    const { data, error } = await supabase.functions.invoke<{ slotLocked: boolean }>("delete-client", {
      body: { clientId, slotLockedUntil },
    });

    if (error) throw error;
    if (data) return data;
  } catch (error) {
    console.warn("Falling back to direct client deletion:", error);
  }

  if (!slotLockedUntil) {
    const { error: deleteError } = await supabase.from("clients").delete().eq("id", clientId);
    if (deleteError) throw deleteError;
    return { slotLocked: false };
  }

  const [{ error: postsError }, { error: socialError }, { error: credentialsError }] = await Promise.all([
    supabase.from("posts").delete().eq("client_id", clientId),
    supabase.from("client_social_accounts").delete().eq("client_id", clientId),
    supabase.from("client_credentials").delete().eq("client_id", clientId),
  ]);

  if (postsError) throw postsError;
  if (socialError) throw socialError;
  if (credentialsError) throw credentialsError;

  if (slotLockedUntil) {
    const deletedAt = new Date().toISOString();
    const { error: lifecycleError } = await supabase
      .from("clients")
      .update({
        deleted_at: deletedAt,
        slot_locked_until: slotLockedUntil,
        ai_summary: null,
        pipeline_status: null,
        research_notes: null,
        content_strategy: null,
      })
      .eq("id", clientId);

    if (!isMissingClientLifecycleColumn(lifecycleError)) {
      if (lifecycleError) throw lifecycleError;
      return { slotLocked: true };
    }
  }

  const { error: deleteError } = await supabase.from("clients").delete().eq("id", clientId);
  if (deleteError) throw deleteError;

  return { slotLocked: false };
}

export async function countVisibleAgencyClients(agencyId: string): Promise<number> {
  const filtered = await supabase
    .from("clients")
    .select("id", { count: "exact", head: true })
    .eq("agency_id", agencyId)
    .is("deleted_at", null);

  if (!isMissingClientLifecycleColumn(filtered.error)) {
    return filtered.count ?? 0;
  }

  const fallback = await supabase
    .from("clients")
    .select("id", { count: "exact", head: true })
    .eq("agency_id", agencyId);

  if (fallback.error) throw fallback.error;
  return fallback.count ?? 0;
}

export async function countCooldownClients(agencyId: string, nowIso: string): Promise<number> {
  const query = await supabase
    .from("clients")
    .select("id", { count: "exact", head: true })
    .eq("agency_id", agencyId)
    .not("deleted_at", "is", null)
    .gt("slot_locked_until", nowIso);

  if (isMissingClientLifecycleColumn(query.error)) {
    return 0;
  }

  if (query.error) throw query.error;
  return query.count ?? 0;
}

export async function selectLatestAgencyClient<T>(agencyId: string, columns = "*"): Promise<T | null> {
  const { data, error } = await selectAgencyClients<T>(agencyId, columns, {
    orderBy: "created_at",
    ascending: false,
  });

  if (error) throw error;
  return data?.[0] ?? null;
}
