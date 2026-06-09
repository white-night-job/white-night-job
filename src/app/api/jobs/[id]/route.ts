import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getErrorMessage } from "@/lib/api-error";
import {
  normalizeJobPayload,
  payloadToRow,
  rowToJob,
  validateJobPayload,
} from "@/lib/job-db";
import { insertJobViewRow } from "@/lib/insert-job-view";
import { createSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const shouldRecordView =
      new URL(request.url).searchParams.get("recordView") === "1";

    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", id)
      .eq("published", true)
      .single();

    if (error) {
      return NextResponse.json({ message: "求人が見つかりません。" }, { status: 404 });
    }

    if (shouldRecordView) {
      try {
        await insertJobViewRow(supabase, {
          jobId: id,
          userAgent: request.headers.get("user-agent"),
          referrer: request.headers.get("referer"),
        });
      } catch (viewError) {
        console.error("job_views insert on GET failed:", viewError);
      }
    }

    return NextResponse.json({ job: rowToJob(data) });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "求人の取得に失敗しました。") },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "ログインしてください。" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const payload = normalizeJobPayload(await request.json());
    const validationError = validateJobPayload(payload);
    if (validationError) {
      return NextResponse.json({ message: validationError }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("jobs")
      .update(payloadToRow(payload))
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ job: rowToJob(data) });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "求人の更新に失敗しました。") },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "ログインしてください。" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const supabase = createSupabaseAdmin();
    const { error } = await supabase.from("jobs").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "求人の削除に失敗しました。") },
      { status: 500 },
    );
  }
}
