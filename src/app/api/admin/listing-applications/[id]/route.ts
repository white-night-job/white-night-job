import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getErrorMessage } from "@/lib/api-error";
import {
  LISTING_APPLICATION_STATUS_LABELS,
  planLabel,
  type ListingApplicationRow,
  type ListingApplicationStatus,
} from "@/lib/listing-application";
import {
  notifyApplicantApproved,
  notifyApplicantRejected,
} from "@/lib/listing-application-email";
import {
  createSupabaseAdmin,
  LISTING_APPLICATION_DOCUMENT_BUCKET,
  LISTING_APPLICATION_IDENTITY_BUCKET,
  LISTING_APPLICATION_IMAGE_BUCKET,
} from "@/lib/supabase";
import type { ListingShopImage } from "@/lib/listing-application";

type RouteContext = { params: Promise<{ id: string }> };

type PatchBody = {
  action?: "approve" | "reject";
  rejectionReason?: string;
  actor?: string;
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

async function attachSignedDocumentUrls(row: ListingApplicationRow) {
  const supabase = createSupabaseAdmin();
  const signDoc = async (doc: unknown, bucket: string) => {
    if (!doc || typeof doc !== "object") return doc ?? null;
    const storagePath = (doc as { storagePath?: string }).storagePath;
    if (!storagePath) return doc;
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(storagePath, 60 * 10);
    if (error) return doc;
    return { ...(doc as Record<string, unknown>), signedUrl: data.signedUrl };
  };
  const signImages = async (images: unknown) => {
    if (!Array.isArray(images)) return [];
    const out: ListingShopImage[] = [];
    for (const img of images) {
      if (!img || typeof img !== "object") continue;
      const storagePath = (img as ListingShopImage).storagePath;
      if (!storagePath) {
        out.push(img as ListingShopImage);
        continue;
      }
      const { data, error } = await supabase.storage
        .from(LISTING_APPLICATION_IMAGE_BUCKET)
        .createSignedUrl(storagePath, 60 * 10);
      out.push({
        ...(img as ListingShopImage),
        signedUrl: error ? undefined : data?.signedUrl,
      });
    }
    return out;
  };
  return {
    ...row,
    business_license_document: await signDoc(
      row.business_license_document,
      LISTING_APPLICATION_DOCUMENT_BUCKET,
    ),
    entertainment_license_document: await signDoc(
      row.entertainment_license_document,
      LISTING_APPLICATION_DOCUMENT_BUCKET,
    ),
    late_night_alcohol_notification_document: await signDoc(
      row.late_night_alcohol_notification_document,
      LISTING_APPLICATION_DOCUMENT_BUCKET,
    ),
    identity_document_front: await signDoc(
      row.identity_document_front,
      LISTING_APPLICATION_IDENTITY_BUCKET,
    ),
    identity_document_back: await signDoc(
      row.identity_document_back,
      LISTING_APPLICATION_IDENTITY_BUCKET,
    ),
    shop_exterior_images: await signImages(row.shop_exterior_images),
    shop_interior_images: await signImages(row.shop_interior_images),
  };
}

function toApplicationResponse(row: ListingApplicationRow) {
  return {
    ...row,
    statusLabel: LISTING_APPLICATION_STATUS_LABELS[row.status],
    requestedPlanLabel: planLabel(row.requested_plan),
    confirmedPlanLabel: planLabel(row.confirmed_plan),
    // Intentionally omit onboarding / invite URLs from admin UI
    onboardingUrl: null,
  };
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
    const rowWithSigned = await attachSignedDocumentUrls(row);

    return NextResponse.json({
      ok: true,
      application: toApplicationResponse(rowWithSigned as ListingApplicationRow),
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

    if (current.status === "approved" || current.status === "rejected") {
      return NextResponse.json(
        { message: "この申請は既に処理済みです。" },
        { status: 409 },
      );
    }

    if (body.action !== "approve" && body.action !== "reject") {
      return NextResponse.json(
        { message: "action は approve または reject のみ指定できます。" },
        { status: 400 },
      );
    }

    const supabase = createSupabaseAdmin();
    const actor = body.actor?.trim() || "admin";
    const nowIso = new Date().toISOString();

    let patch: Record<string, unknown>;
    let eventType: string;
    let toStatus: ListingApplicationStatus;
    let eventMessage: string;

    if (body.action === "approve") {
      toStatus = "approved";
      patch = {
        status: "approved",
        approved_at: nowIso,
        approved_by: actor,
        rejection_reason: null,
      };
      eventType = "approved";
      eventMessage = `承認（${nowIso}）`;
    } else {
      const reason = body.rejectionReason?.trim();
      if (!reason) {
        return NextResponse.json(
          { message: "却下理由を入力してください。" },
          { status: 400 },
        );
      }
      toStatus = "rejected";
      patch = {
        status: "rejected",
        rejection_reason: reason,
        approved_at: null,
        approved_by: null,
      };
      eventType = "rejected";
      eventMessage = `却下（${nowIso}）: ${reason}`;
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
      toStatus,
      message: eventMessage,
      actor,
    });

    const mailResult =
      body.action === "approve"
        ? await notifyApplicantApproved(updated)
        : await notifyApplicantRejected(updated);

    if (!mailResult.sent) {
      // Do not leave the application in a completed review state without notify.
      await supabase
        .from("listing_applications")
        .update({
          status: current.status,
          approved_at: current.approved_at,
          approved_by: current.approved_by,
          rejection_reason: current.rejection_reason,
        })
        .eq("id", id);

      await appendEvent({
        applicationId: id,
        eventType: "notify_failed",
        fromStatus: toStatus,
        toStatus: current.status,
        message: `メール送信失敗のため審査結果を取り消しました: ${mailResult.error ?? "unknown"}`,
        actor,
      });

      return NextResponse.json(
        {
          message: `審査結果メールの送信に失敗したため、ステータスは変更されていません。原因: ${mailResult.error ?? "send_failed"}`,
          mail: mailResult,
        },
        { status: 502 },
      );
    }

    const events = await loadEvents(id);
    const updatedWithSigned = await attachSignedDocumentUrls(updated);
    return NextResponse.json({
      ok: true,
      application: toApplicationResponse(
        updatedWithSigned as ListingApplicationRow,
      ),
      events,
      mail: mailResult,
    });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "更新に失敗しました。") },
      { status: 500 },
    );
  }
}
