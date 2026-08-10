import { createSupabaseAdmin } from "@/lib/supabase";

export type AdminNotificationType =
  | "stripe_new_contract"
  | "stripe_invoice_paid"
  | "stripe_payment_failed"
  | "stripe_canceled"
  | string;

export type AdminNotificationRecord = {
  id: string;
  type: string;
  storeId: string | null;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  shopName?: string | null;
};

type DbRow = {
  id: string;
  type: string;
  store_id: string | null;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  jobs?: { shop_name?: string | null } | null;
};

function mapRow(row: DbRow): AdminNotificationRecord {
  return {
    id: row.id,
    type: row.type,
    storeId: row.store_id,
    title: row.title,
    message: row.message,
    createdAt: row.created_at,
    isRead: Boolean(row.is_read),
    shopName: row.jobs?.shop_name ?? null,
  };
}

export async function createAdminNotification(input: {
  type: AdminNotificationType;
  storeId?: string | null;
  title: string;
  message: string;
}): Promise<AdminNotificationRecord> {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("admin_notifications")
    .insert({
      type: input.type,
      store_id: input.storeId ?? null,
      title: input.title,
      message: input.message,
      is_read: false,
    })
    .select("id, type, store_id, title, message, created_at, is_read")
    .single();
  if (error) throw error;
  return mapRow(data as DbRow);
}

export async function listAdminNotifications(options?: {
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
}): Promise<{ items: AdminNotificationRecord[]; unreadCount: number }> {
  const supabase = createSupabaseAdmin();
  const limit = Math.min(Math.max(options?.limit ?? 50, 1), 200);
  const offset = Math.max(options?.offset ?? 0, 0);

  let query = supabase
    .from("admin_notifications")
    .select(
      "id, type, store_id, title, message, created_at, is_read, jobs:store_id (shop_name)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (options?.unreadOnly) {
    query = query.eq("is_read", false);
  }

  const { data, error } = await query;
  if (error) throw error;

  const { count: unreadCount, error: unreadError } = await supabase
    .from("admin_notifications")
    .select("id", { count: "exact", head: true })
    .eq("is_read", false);
  if (unreadError) throw unreadError;

  return {
    items: ((data ?? []) as DbRow[]).map(mapRow),
    unreadCount: unreadCount ?? 0,
  };
}

export async function markAdminNotificationRead(
  id: string,
  isRead = true,
): Promise<void> {
  const supabase = createSupabaseAdmin();
  const { error } = await supabase
    .from("admin_notifications")
    .update({ is_read: isRead })
    .eq("id", id);
  if (error) throw error;
}

export async function markAllAdminNotificationsRead(): Promise<number> {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("admin_notifications")
    .update({ is_read: true })
    .eq("is_read", false)
    .select("id");
  if (error) throw error;
  return data?.length ?? 0;
}

export async function getAdminNotificationSummary(): Promise<{
  unreadCount: number;
  newContract: number;
  paymentFailed: number;
  canceled: number;
  invoicePaid: number;
  system: number;
}> {
  const supabase = createSupabaseAdmin();

  const { count: unreadCount, error: unreadError } = await supabase
    .from("admin_notifications")
    .select("id", { count: "exact", head: true })
    .eq("is_read", false);
  if (unreadError) throw unreadError;

  async function countType(type: string): Promise<number> {
    const { count, error } = await supabase
      .from("admin_notifications")
      .select("id", { count: "exact", head: true })
      .eq("type", type)
      .eq("is_read", false);
    if (error) throw error;
    return count ?? 0;
  }

  const [newContract, paymentFailed, canceled, invoicePaid, system] =
    await Promise.all([
      countType("stripe_new_contract"),
      countType("stripe_payment_failed"),
      countType("stripe_canceled"),
      countType("stripe_invoice_paid"),
      countType("system"),
    ]);

  return {
    unreadCount: unreadCount ?? 0,
    newContract,
    paymentFailed,
    canceled,
    invoicePaid,
    system,
  };
}

/** 同一 store + type + 参照キーの重複通知防止 */
export async function hasRecentAdminNotification(input: {
  type: string;
  storeId: string | null;
  contains: string;
  withinMinutes?: number;
}): Promise<boolean> {
  const supabase = createSupabaseAdmin();
  const within = input.withinMinutes ?? 30;
  const since = new Date(Date.now() - within * 60_000).toISOString();
  let query = supabase
    .from("admin_notifications")
    .select("id, message")
    .eq("type", input.type)
    .gte("created_at", since)
    .limit(20);
  query = input.storeId
    ? query.eq("store_id", input.storeId)
    : query.is("store_id", null);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).some((row) =>
    String((row as { message?: string }).message ?? "").includes(input.contains),
  );
}
