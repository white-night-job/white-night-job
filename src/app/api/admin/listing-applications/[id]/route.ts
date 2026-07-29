import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getErrorMessage } from "@/lib/api-error";
import {
  buildOnboardingUrl,
  generateInviteCode,
  isListingApplicationStatus,
  LISTING_APPLICATION_STATUS_LABELS,
  planLabel,
  type ListingApplicationRow,
  type ListingApplicationStatus,
} from "@/lib/listing-application";
import {
  notifyApplicantApproved,
  notifyApplicantNeedsInfo,
  notifyApplicantRejected,
} from "@/lib/listing-application-email";
import { isJobPlan } from "@/lib/job-plan";
import { createSupabaseAdmin } from "@/lib/supabase";

type RouteContext = { params: Promise<{ id: string }> };

type PatchBody = {
  action?:
    | "set_status"
    | "approve"
    | "reject"
    | "needs_info"
    | "save_memo"
    | "assign"
    | "confirm_plan"
    | "withdraw";
  status?: string;
  adminMemo?: string;
  assignedAdmin?: string;
  rejectionReason?: string;
  needsInfoMessage?: string;
  needsInfoDeadline?: string;
  confirmedPlan?: string;
  actor?: string;
  notifyApplicant?: boolean;
};

async function loadApplication(id: string) {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("listing_applications")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as ListingApplicationRow | null;
}

async function loadEvents(applicationId: string) {
  const supabase = createSupabaseAdmin();
  const { data } = await supabase
    .from("listing_application_events")
    .select("*")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: false })
    .limit(100);
  return data ?? [];
}

async function appendEvent(options: {
  applicationId: string;
  eventType: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  message?: string;
  actor?: string;
}) {
  const supabase = createSupabaseAdmin();
  await supabase.from("listing_application_events").insert({
    application_id: options.applicationId,
    event_type: options.eventType,
    from_status: options.fromStatus ?? null,
    to_status: options.toStatus ?? null,
    message: options.message ?? null,
    actor: options.actor ?? "admin",
  });
}

export async function GET(_request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const row = await loadApplication(id);
    if (!row) {
      return NextResponse.json({ message: "申請が見つかりません。" }, { status: 404 });
    }
    const events = await loadEvents(id);

    return NextResponse.json({
      ok: true,
      application: {
        ...row,
        statusLabel: LISTING_APPLICATION_STATUS_LABELS[row.status],
        requestedPlanLabel: planLabel(row.requested_plan),
        confirmedPlanLabel: planLabel(row.confirmed_plan),
        onboardingUrl: row.invite_code
          ? buildOnboardingUrl(row.invite_code)
          : null,
      },
      events,
    });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "詳細の取得に失敗しました。") },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = (await request.json()) as PatchBody;
    const current = await loadApplication(id);
    if (!current) {
      return NextResponse.json({ message: "申請が見つかりません。" }, { status: 404 });
    }

    const supabase = createSupabaseAdmin();
    const actor = body.actor?.trim() || "admin";
    const notify = body.notifyApplicant !== false;
    let patch: Record<string, unknown> = {};
    let eventType = "updated";
    let toStatus: ListingApplicationStatus | null = null;
    let eventMessage = "";

    switch (body.action) {
      case "save_memo": {
        patch = { admin_memo: body.adminMemo?.trim() || null };
        eventType = "memo";
        eventMessage = "管理者メモを更新";
        break;
      }
      case "assign": {
        patch = { assigned_admin: body.assignedAdmin?.trim() || null };
        eventType = "assign";
        eventMessage = `担当: ${body.assignedAdmin?.trim() || "未設定"}`;
        break;
      }
      case "confirm_plan": {
        if (!isJobPlan(body.confirmedPlan)) {
          return NextResponse.json(
            { message: "プランを選択してください。" },
            { status: 400 },
          );
        }
        const plan = body.confirmedPlan;
        patch = { confirmed_plan: plan };
        eventType = "confirm_plan";
        eventMessage = `確定プラン: ${planLabel(plan)}`;
        break;
      }
      case "set_status": {
        if (!isListingApplicationStatus(body.status)) {
          return NextResponse.json(
            { message: "不正なステータスです。" },
            { status: 400 },
          );
        }
        toStatus = body.status;
        patch = { status: body.status };
        if (body.status === "reviewing" && !current.assigned_admin && body.assignedAdmin) {
          patch.assigned_admin = body.assignedAdmin.trim();
        }
        eventType = "status_change";
        eventMessage = LISTING_APPLICATION_STATUS_LABELS[body.status];
        break;
      }
      case "approve": {
        const inviteCode = current.invite_code || generateInviteCode();
        const confirmed = isJobPlan(body.confirmedPlan)
          ? body.confirmedPlan
          : current.confirmed_plan || current.requested_plan;
        const expires = new Date();
        expires.setDate(expires.getDate() + 30);
        toStatus = "approved";
        patch = {
          status: "approved",
          approved_at: new Date().toISOString(),
          approved_by: actor,
          assigned_admin: current.assigned_admin || actor,
          invite_code: inviteCode,
          invite_expires_at: expires.toISOString(),
          confirmed_plan: confirmed,
          rejection_reason: null,
        };
        eventType = "approved";
        eventMessage = `承認・招待コード発行 / プラン ${planLabel(confirmed)}`;
        break;
      }
      case "reject": {
        const reason = body.rejectionReason?.trim();
        if (!reason) {
          return NextResponse.json(
            { message: "否認理由を入力してください。" },
            { status: 400 },
          );
        }
        toStatus = "rejected";
        patch = {
          status: "rejected",
          rejection_reason: reason,
          assigned_admin: current.assigned_admin || actor,
        };
        eventType = "rejected";
        eventMessage = "否認";
        break;
      }
      case "needs_info": {
        const message = body.needsInfoMessage?.trim();
        if (!message) {
          return NextResponse.json(
            { message: "不足内容を入力してください。" },
            { status: 400 },
          );
        }
        const uploadToken =
          current.needs_info_upload_token || randomBytes(16).toString("hex");
        toStatus = "needs_info";
        patch = {
          status: "needs_info",
          needs_info_message: message,
          needs_info_deadline: body.needsInfoDeadline?.trim() || null,
          needs_info_upload_token: uploadToken,
          assigned_admin: current.assigned_admin || actor,
        };
        eventType = "needs_info";
        eventMessage = message;
        break;
      }
      case "withdraw": {
        toStatus = "withdrawn";
        patch = { status: "withdrawn" };
        eventType = "withdrawn";
        eventMessage = "取り下げ";
        break;
      }
      default:
        return NextResponse.json(
          { message: "action を指定してください。" },
          { status: 400 },
        );
    }

    const { data, error } = await supabase
      .from("listing_applications")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();

    if (error || !data) throw error ?? new Error("update failed");
    const updated = data as ListingApplicationRow;

    await appendEvent({
      applicationId: id,
      eventType,
      fromStatus: current.status,
      toStatus: toStatus ?? current.status,
      message: eventMessage,
      actor,
    });

    if (notify) {
      if (body.action === "approve") {
        void notifyApplicantApproved(updated);
      } else if (body.action === "reject") {
        void notifyApplicantRejected(updated);
      } else if (body.action === "needs_info") {
        void notifyApplicantNeedsInfo(updated);
      }
    }

    const events = await loadEvents(id);
    return NextResponse.json({
      ok: true,
      application: {
        ...updated,
        statusLabel: LISTING_APPLICATION_STATUS_LABELS[updated.status],
        requestedPlanLabel: planLabel(updated.requested_plan),
        confirmedPlanLabel: planLabel(updated.confirmed_plan),
        onboardingUrl: updated.invite_code
          ? buildOnboardingUrl(updated.invite_code)
          : null,
      },
      events,
    });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "更新に失敗しました。") },
      { status: 500 },
    );
  }
}
