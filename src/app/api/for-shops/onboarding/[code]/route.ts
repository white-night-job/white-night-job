import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api-error";
import { assertApprovedInviteAccess } from "@/lib/listing-application-access";
import {
  LISTING_APPLICATION_STATUS_LABELS,
  planLabel,
} from "@/lib/listing-application";
import { parseJobPlan, type JobPlan } from "@/lib/job-plan";
import { createSupabaseAdmin } from "@/lib/supabase";

type RouteContext = { params: Promise<{ code: string }> };

const DISTRICTS = ["すすきの", "琴似", "24条", "手稲"] as const;
const JOB_TYPES = [
  "ガールズバー",
  "コンカフェ",
  "ラウンジ",
  "ニュークラ",
  "クラブ",
  "スナック",
] as const;

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { code } = await context.params;
    const access = await assertApprovedInviteAccess(code);
    if (!access.ok) {
      return NextResponse.json(
        { message: access.message },
        { status: access.status },
      );
    }
    if (!access.application) {
      return NextResponse.json(
        { message: "申請データが見つかりません。" },
        { status: 404 },
      );
    }

    const row = access.application;
    return NextResponse.json({
      ok: true,
      application: {
        id: row.id,
        applicationNumber: row.application_number,
        shopName: row.shop_name,
        shopAddress: row.shop_address,
        area: row.area,
        businessType: row.business_type,
        businessHours: row.business_hours,
        shopPhone: row.shop_phone,
        websiteUrl: row.website_url,
        instagramUrl: row.instagram_url,
        xUrl: row.x_url,
        tiktokUrl: row.tiktok_url,
        youtubeUrl: row.youtube_url,
        lineOfficialUrl: row.line_official_url,
        openDate: row.open_date,
        requestedPlan: row.requested_plan,
        confirmedPlan: row.confirmed_plan,
        planLabel: planLabel(row.confirmed_plan ?? row.requested_plan),
        status: row.status,
        statusLabel: LISTING_APPLICATION_STATUS_LABELS[row.status],
        onboardingCompleted: Boolean(row.onboarding_completed_at),
        linkedJobId: row.linked_job_id,
      },
      districts: DISTRICTS,
      jobTypes: JOB_TYPES,
    });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "確認に失敗しました。") },
      { status: 500 },
    );
  }
}

type OnboardingBody = {
  district?: string;
  jobType?: string;
  salary?: string;
  title?: string;
  lineUrl?: string;
  shopLoginId?: string;
  shopLoginPassword?: string;
  confirmedPlan?: string;
  workHours?: string;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { code } = await context.params;
    const access = await assertApprovedInviteAccess(code);
    if (!access.ok) {
      return NextResponse.json(
        { message: access.message },
        { status: access.status },
      );
    }
    const application = access.application;
    if (!application) {
      return NextResponse.json(
        { message: "申請データが見つかりません。" },
        { status: 404 },
      );
    }
    if (application.linked_job_id || application.onboarding_completed_at) {
      return NextResponse.json(
        {
          message:
            "すでに登録手続き済みです。店舗ログインからダッシュボードをご利用ください。",
          linkedJobId: application.linked_job_id,
        },
        { status: 409 },
      );
    }

    const body = (await request.json()) as OnboardingBody;
    const district = body.district?.trim();
    const jobType = body.jobType?.trim();
    const salary = body.salary?.trim();
    const lineUrl = body.lineUrl?.trim();
    const shopLoginId = body.shopLoginId?.trim();
    const shopLoginPassword = body.shopLoginPassword?.trim();
    const title = body.title?.trim() || `${application.shop_name}の求人`;
    const workHours =
      body.workHours?.trim() || application.business_hours || "20:00〜LAST";
    const plan =
      parseJobPlan(body.confirmedPlan) ||
      application.confirmed_plan ||
      application.requested_plan;

    if (!district || !(DISTRICTS as readonly string[]).includes(district)) {
      return NextResponse.json(
        { message: "地区を選択してください。" },
        { status: 400 },
      );
    }
    if (!jobType || !(JOB_TYPES as readonly string[]).includes(jobType)) {
      return NextResponse.json(
        { message: "職種を選択してください。" },
        { status: 400 },
      );
    }
    if (!salary) {
      return NextResponse.json(
        { message: "時給を入力してください。" },
        { status: 400 },
      );
    }
    if (!lineUrl || !/^https?:\/\//i.test(lineUrl)) {
      return NextResponse.json(
        { message: "LINE応募URLを https:// 形式で入力してください。" },
        { status: 400 },
      );
    }
    if (!shopLoginId || shopLoginId.length < 4) {
      return NextResponse.json(
        { message: "店舗ログインIDは4文字以上で入力してください。" },
        { status: 400 },
      );
    }
    if (!shopLoginPassword || shopLoginPassword.length < 6) {
      return NextResponse.json(
        { message: "店舗ログインパスワードは6文字以上で入力してください。" },
        { status: 400 },
      );
    }

    const supabase = createSupabaseAdmin();

    const { data: existingLogin } = await supabase
      .from("jobs")
      .select("id")
      .eq("shop_login_id", shopLoginId)
      .maybeSingle();
    if (existingLogin) {
      return NextResponse.json(
        { message: "この店舗ログインIDは既に使われています。" },
        { status: 409 },
      );
    }

    // 未公開の下書き求人を作成（審査承認店舗のみ）。公開は管理者が行う。
    const jobInsert = {
      shop_name: application.shop_name,
      area: application.area || "札幌",
      district,
      job_type: jobType,
      title,
      salary,
      work_hours: workHours,
      business_hours: application.business_hours,
      phone: application.shop_phone,
      address: application.shop_address,
      website_url: application.website_url,
      instagram_url: application.instagram_url,
      x_url: application.x_url,
      tiktok_url: application.tiktok_url,
      youtube_url: application.youtube_url,
      line_url: lineUrl,
      published: false,
      listing_status: "draft",
      plan: plan as JobPlan,
      shop_login_id: shopLoginId,
      shop_login_password: shopLoginPassword,
      open_date: application.open_date,
      is_verified: true,
      requirements: ["20歳以上"],
      benefits: [],
      other_benefits: [],
    };

    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .insert(jobInsert)
      .select("id")
      .single();

    if (jobError || !job) {
      console.error("[onboarding] job insert failed:", jobError);
      throw jobError ?? new Error("job insert failed");
    }

    const { error: appError } = await supabase
      .from("listing_applications")
      .update({
        linked_job_id: job.id,
        onboarding_completed_at: new Date().toISOString(),
        confirmed_plan: plan,
      })
      .eq("id", application.id);

    if (appError) {
      console.error("[onboarding] link failed:", appError);
      throw appError;
    }

    await supabase.from("listing_application_events").insert({
      application_id: application.id,
      event_type: "onboarding_completed",
      to_status: "approved",
      message: `下書き求人作成 job=${job.id}`,
      actor: "applicant",
    });

    return NextResponse.json({
      ok: true,
      jobId: job.id,
      message:
        "店舗・求人の下書きを作成しました。店舗ログイン後に内容を編集できます。公開は審査・管理者確認後に行われます。",
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "登録に失敗しました。時間をおいて再度お試しください。",
        ),
      },
      { status: 500 },
    );
  }
}
