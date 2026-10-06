import type { SupabaseClient } from "@supabase/supabase-js";
import { formatJstDateTime } from "@/lib/apply-button-notify";
import type { JobApplicationType } from "@/lib/job-applications";
import {
  fetchStoreLineProfile,
  hasStoreLineChannelAccessToken,
  sendStoreLinePushText,
} from "@/lib/store-line-messaging";

const CONTACTS_TABLE = "line_official_contacts";
const LINKS_TABLE = "shop_line_links";
const PROFILE_REFRESH_MS = 24 * 60 * 60 * 1000;
const CONTACT_LIST_LIMIT = 300;

export type LineContact = {
  lineUserId: string;
  displayName: string | null;
  pictureUrl: string | null;
  isFollowing: boolean;
  lastEventType: string | null;
  lastEventAt: string | null;
};

export type LineContactWithShops = LineContact & {
  linkedShops: { jobId: string; shopName: string }[];
};

export type ShopLineLink = {
  linked: boolean;
  linkedAt: string | null;
  contact: LineContact | null;
};

export class ShopLineLinkError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "ShopLineLinkError";
    this.status = status;
  }
}

type ContactRow = {
  line_user_id: string;
  display_name: string | null;
  picture_url: string | null;
  is_following: boolean;
  last_event_type: string | null;
  last_event_at: string | null;
  profile_fetched_at?: string | null;
};

const CONTACT_COLUMNS =
  "line_user_id, display_name, picture_url, is_following, last_event_type, last_event_at";

export function isShopLineTableMissing(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: string; message?: string };
  if (e.code === "42P01" || e.code === "PGRST205") return true;
  const message = e.message ?? "";
  return (
    (message.includes(CONTACTS_TABLE) || message.includes(LINKS_TABLE)) &&
    (message.includes("does not exist") || message.includes("Could not find"))
  );
}

function toContact(row: ContactRow): LineContact {
  return {
    lineUserId: row.line_user_id,
    displayName: row.display_name,
    pictureUrl: row.picture_url,
    isFollowing: row.is_following,
    lastEventType: row.last_event_type,
    lastEventAt: row.last_event_at,
  };
}

/**
 * Saves the sender of a signature-verified webhook event.
 * Profile is refreshed on follow, for new contacts, or when older than 24h.
 */
export async function recordLineContactEvent(
  supabase: SupabaseClient,
  params: { lineUserId: string; eventType: string; occurredAt: Date },
): Promise<void> {
  const { data: existing, error } = await supabase
    .from(CONTACTS_TABLE)
    .select("line_user_id, profile_fetched_at")
    .eq("line_user_id", params.lineUserId)
    .maybeSingle();
  if (error) {
    if (isShopLineTableMissing(error)) return;
    throw error;
  }

  const update: Record<string, unknown> = {
    line_user_id: params.lineUserId,
    last_event_type: params.eventType,
    last_event_at: params.occurredAt.toISOString(),
  };

  if (params.eventType === "unfollow") {
    update.is_following = false;
  } else {
    if (params.eventType === "follow") update.is_following = true;

    const fetchedAt = existing?.profile_fetched_at
      ? new Date(existing.profile_fetched_at as string).getTime()
      : 0;
    const needsProfile =
      params.eventType === "follow" ||
      !existing ||
      Date.now() - fetchedAt > PROFILE_REFRESH_MS;

    if (needsProfile && hasStoreLineChannelAccessToken()) {
      try {
        const profile = await fetchStoreLineProfile(params.lineUserId);
        update.profile_fetched_at = new Date().toISOString();
        if (profile) {
          update.display_name = profile.displayName || null;
          update.picture_url = profile.pictureUrl;
          update.is_following = true;
        } else {
          update.is_following = false;
        }
      } catch (profileError) {
        console.error("[line-contacts] profile fetch failed", {
          error: profileError instanceof Error ? profileError.message : profileError,
        });
      }
    }
  }

  const { error: upsertError } = await supabase
    .from(CONTACTS_TABLE)
    .upsert(update, { onConflict: "line_user_id" });
  if (upsertError) throw upsertError;
}

export async function listLineContactsWithShops(
  supabase: SupabaseClient,
): Promise<{ available: boolean; contacts: LineContactWithShops[] }> {
  const { data: rows, error } = await supabase
    .from(CONTACTS_TABLE)
    .select(CONTACT_COLUMNS)
    .order("last_event_at", { ascending: false, nullsFirst: false })
    .limit(CONTACT_LIST_LIMIT);
  if (error) {
    if (isShopLineTableMissing(error)) return { available: false, contacts: [] };
    throw error;
  }

  const contacts = (rows ?? []) as ContactRow[];
  const ids = contacts.map((row) => row.line_user_id);
  const shopsByUser = new Map<string, { jobId: string; shopName: string }[]>();

  if (ids.length > 0) {
    const { data: links, error: linksError } = await supabase
      .from(LINKS_TABLE)
      .select("job_id, line_user_id")
      .in("line_user_id", ids);
    if (linksError) throw linksError;

    const jobIds = [...new Set((links ?? []).map((link) => link.job_id as string))];
    const shopNames = new Map<string, string>();
    if (jobIds.length > 0) {
      const { data: jobs, error: jobsError } = await supabase
        .from("jobs")
        .select("id, shop_name")
        .in("id", jobIds);
      if (jobsError) throw jobsError;
      for (const job of jobs ?? []) {
        shopNames.set(job.id as string, (job.shop_name as string | null) ?? "");
      }
    }

    for (const link of links ?? []) {
      const list = shopsByUser.get(link.line_user_id as string) ?? [];
      list.push({
        jobId: link.job_id as string,
        shopName: shopNames.get(link.job_id as string) || "（店舗名未設定）",
      });
      shopsByUser.set(link.line_user_id as string, list);
    }
  }

  return {
    available: true,
    contacts: contacts.map((row) => ({
      ...toContact(row),
      linkedShops: shopsByUser.get(row.line_user_id) ?? [],
    })),
  };
}

export async function getShopLineLink(
  supabase: SupabaseClient,
  jobId: string,
): Promise<ShopLineLink & { available: boolean }> {
  const { data: link, error } = await supabase
    .from(LINKS_TABLE)
    .select("line_user_id, linked_at")
    .eq("job_id", jobId)
    .maybeSingle();
  if (error) {
    if (isShopLineTableMissing(error)) {
      return { available: false, linked: false, linkedAt: null, contact: null };
    }
    throw error;
  }
  if (!link?.line_user_id) {
    return { available: true, linked: false, linkedAt: null, contact: null };
  }

  const { data: contact, error: contactError } = await supabase
    .from(CONTACTS_TABLE)
    .select(CONTACT_COLUMNS)
    .eq("line_user_id", link.line_user_id)
    .maybeSingle();
  if (contactError) throw contactError;

  return {
    available: true,
    linked: true,
    linkedAt: (link.linked_at as string | null) ?? null,
    contact: contact ? toContact(contact as ContactRow) : null,
  };
}

export async function linkShopLine(
  supabase: SupabaseClient,
  jobId: string,
  lineUserId: string,
): Promise<void> {
  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("id")
    .eq("id", jobId)
    .maybeSingle();
  if (jobError) throw jobError;
  if (!job) throw new ShopLineLinkError("店舗が見つかりません。", 404);

  const { data: contact, error: contactError } = await supabase
    .from(CONTACTS_TABLE)
    .select("line_user_id, is_following")
    .eq("line_user_id", lineUserId)
    .maybeSingle();
  if (contactError) throw contactError;
  if (!contact) {
    throw new ShopLineLinkError(
      "選択されたLINEユーザーが見つかりません。一覧を更新して選び直してください。",
      400,
    );
  }
  if (!contact.is_following) {
    throw new ShopLineLinkError(
      "このLINEユーザーは店舗サポート公式LINEを友だち解除（またはブロック）しているため紐付けできません。",
      400,
    );
  }

  const { error } = await supabase.from(LINKS_TABLE).upsert(
    {
      job_id: jobId,
      line_user_id: lineUserId,
      linked_at: new Date().toISOString(),
    },
    { onConflict: "job_id" },
  );
  if (error) throw error;
}

export async function unlinkShopLine(
  supabase: SupabaseClient,
  jobId: string,
): Promise<void> {
  const { error } = await supabase.from(LINKS_TABLE).delete().eq("job_id", jobId);
  if (error) throw error;
}

export function buildShopApplyLineMessage(
  type: JobApplicationType,
  shopName: string,
  pressedAt: Date,
): string {
  const isLine = type === "line";
  return [
    "【White Night Job 応募通知】",
    "",
    `求人ページから${isLine ? "LINE" : "電話"}応募ボタンが押されました。`,
    "",
    `応募方法：${isLine ? "LINE" : "電話"}`,
    `店舗名：${shopName}`,
    `日時：${formatJstDateTime(pressedAt)}`,
    "",
    isLine
      ? "応募者からLINEが届く可能性がありますので、ご確認ください。"
      : "応募者から電話が入る可能性がありますので、ご確認ください。",
    "",
    "※応募ボタンが押された時点での通知です。",
    isLine
      ? "実際の応募完了を保証するものではありません。"
      : "実際に通話が成立したことを保証するものではありません。",
  ].join("\n");
}

/** Never throws; unlinked shops are skipped and failures are only logged. */
export async function sendShopApplyLineNotification(
  supabase: SupabaseClient,
  jobId: string,
  type: JobApplicationType,
  pressedAt: Date,
): Promise<void> {
  try {
    const { data: link, error } = await supabase
      .from(LINKS_TABLE)
      .select("line_user_id")
      .eq("job_id", jobId)
      .maybeSingle();
    if (error) {
      if (isShopLineTableMissing(error)) return;
      throw error;
    }

    const lineUserId = (link?.line_user_id as string | null | undefined)?.trim();
    if (!lineUserId) return;

    if (!hasStoreLineChannelAccessToken()) {
      console.warn(
        "[shop-line-notify] skip: STORE_LINE_MESSAGING_CHANNEL_ACCESS_TOKEN missing",
        { jobId },
      );
      return;
    }

    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("shop_name")
      .eq("id", jobId)
      .maybeSingle();
    if (jobError) throw jobError;
    if (!job) throw new Error(`job not found: ${jobId}`);

    await sendStoreLinePushText(
      lineUserId,
      buildShopApplyLineMessage(type, job.shop_name?.trim() || "未設定", pressedAt),
    );
  } catch (error) {
    console.error("[shop-line-notify] send failed", {
      jobId,
      type,
      error: error instanceof Error ? error.message : error,
    });
  }
}
