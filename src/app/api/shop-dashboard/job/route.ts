import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api-error";
import { rowToJob } from "@/lib/job-db";
import { runAutoNotificationsAfterJobChange } from "@/lib/line-auto-notify";
import {
  listingPriorityToRow,
  parseListingPriorityFromBody,
} from "@/lib/listing-priority";
import { getAuthenticatedShopJobId } from "@/lib/shop-auth";
import {
  normalizeShopJobPayload,
  shopPayloadToRow,
  validateShopJobPayload,
} from "@/lib/shop-job-db";
import { createSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const jobId = await getAuthenticatedShopJobId();
  if (!jobId) {
    return NextResponse.json({ message: "ログインしてください。" }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (body && typeof body === "object" && "jobId" in body) {
      const requestedJobId = String((body as { jobId?: unknown }).jobId ?? "");
      if (requestedJobId && requestedJobId !== jobId) {
        return NextResponse.json(
          { message: "他店舗の情報は編集できません。" },
          { status: 403 },
        );
      }
    }

    const payload = normalizeShopJobPayload(body);
    const validationError = validateShopJobPayload(payload);
    if (validationError) {
      return NextResponse.json({ message: validationError }, { status: 400 });
    }

    const listingPriorityRow = listingPriorityToRow(
      parseListingPriorityFromBody(body as Record<string, unknown>),
    );

    const supabase = createSupabaseAdmin();
    const { data: previous } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .maybeSingle();

    const { data, error } = await supabase
      .from("jobs")
      .update({
        ...shopPayloadToRow(payload),
        ...listingPriorityRow,
      })
      .eq("id", jobId)
      .select("*")
      .single();

    if (error) throw error;

    const before = previous ? rowToJob(previous) : null;
    const after = rowToJob(data);
    void runAutoNotificationsAfterJobChange({ before, after });

    return NextResponse.json({ job: after });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "求人の更新に失敗しました。") },
      { status: 500 },
    );
  }
}
