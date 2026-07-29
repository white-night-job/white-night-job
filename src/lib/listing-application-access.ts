import { createSupabaseAdmin } from "@/lib/supabase";
import type { ListingApplicationRow } from "@/lib/listing-application";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getAuthenticatedShopJobId } from "@/lib/shop-auth";

export type ListingAccessOk = {
  ok: true;
  application: ListingApplicationRow | null;
  via: "invite" | "application" | "shop" | "admin";
};

export type ListingAccessDenied = {
  ok: false;
  message: string;
  status: number;
};

export type ListingAccessResult = ListingAccessOk | ListingAccessDenied;

/**
 * 承認後の店舗登録（オンボーディング）用。
 * 有効な招待コード、または管理者セッションが必要。
 */
export async function assertApprovedInviteAccess(
  inviteCode: string | null | undefined,
): Promise<ListingAccessResult> {
  if (await isAdminAuthenticated()) {
    if (!inviteCode?.trim()) {
      return { ok: true, application: null, via: "admin" };
    }
  }

  const code = inviteCode?.trim();
  if (!code) {
    return {
      ok: false,
      message: "招待コードが必要です。審査承認前は求人登録へ進めません。",
      status: 403,
    };
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("listing_applications")
    .select("*")
    .eq("invite_code", code)
    .maybeSingle();

  if (error) {
    console.error("[listing-access] invite lookup failed:", error);
    return {
      ok: false,
      message: "招待コードの確認に失敗しました。",
      status: 500,
    };
  }

  if (!data) {
    return { ok: false, message: "招待コードが無効です。", status: 403 };
  }

  const row = data as ListingApplicationRow;
  if (row.status !== "approved") {
    return {
      ok: false,
      message: "審査承認前のため、求人登録へ進めません。",
      status: 403,
    };
  }

  if (row.invite_expires_at && new Date(row.invite_expires_at) < new Date()) {
    return {
      ok: false,
      message:
        "招待コードの有効期限が切れています。管理者へご連絡ください。",
      status: 403,
    };
  }

  return { ok: true, application: row, via: "invite" };
}

/**
 * 新規求人作成APIなど向け。
 * 承認済み申請ID・招待コード・紐づく店舗アカウント・管理者のいずれかを確認。
 */
export async function assertCanCreateListingJob(options: {
  inviteCode?: string | null;
  applicationId?: string | null;
}): Promise<ListingAccessResult> {
  if (await isAdminAuthenticated()) {
    return { ok: true, application: null, via: "admin" };
  }

  if (options.inviteCode?.trim()) {
    return assertApprovedInviteAccess(options.inviteCode);
  }

  const supabase = createSupabaseAdmin();

  if (options.applicationId?.trim()) {
    const { data } = await supabase
      .from("listing_applications")
      .select("*")
      .eq("id", options.applicationId.trim())
      .maybeSingle();

    if (!data || (data as ListingApplicationRow).status !== "approved") {
      return {
        ok: false,
        message: "承認済みの申請が必要です。",
        status: 403,
      };
    }
    return {
      ok: true,
      application: data as ListingApplicationRow,
      via: "application",
    };
  }

  const shopJobId = await getAuthenticatedShopJobId();
  if (shopJobId) {
    const { data } = await supabase
      .from("listing_applications")
      .select("*")
      .eq("linked_job_id", shopJobId)
      .eq("status", "approved")
      .maybeSingle();

    if (data) {
      return {
        ok: true,
        application: data as ListingApplicationRow,
        via: "shop",
      };
    }
  }

  return {
    ok: false,
    message:
      "審査未承認のため求人を追加できません。承認済み申請・招待コード・店舗アカウントが必要です。",
    status: 403,
  };
}
