import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getErrorMessage } from "@/lib/api-error";
import {
  normalizeJobPayload,
  payloadToRow,
  rowToJob,
  validateJobPayload,
} from "@/lib/job-db";
import { createSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const district = searchParams.get("district");
    const jobType = searchParams.get("jobType");
    const keyword = searchParams.get("q")?.trim().toLowerCase() ?? "";
    const supabase = createSupabaseAdmin();

    let query = supabase
      .from("jobs")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false });

    if (district && district !== "all") query = query.eq("district", district);
    if (jobType && jobType !== "all") query = query.eq("job_type", jobType);

    const { data, error } = await query;
    if (error) throw error;

    const jobs = (data ?? []).map(rowToJob);
    const filteredJobs = keyword
      ? jobs.filter((job) =>
          [
            job.shopName,
            job.jobType,
            job.area,
            job.district,
            ...job.benefits,
            ...(job.otherBenefits ?? []),
          ]
            .join(" ")
            .toLowerCase()
            .includes(keyword),
        )
      : jobs;

    return NextResponse.json({ jobs: filteredJobs });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "求人の取得に失敗しました。") },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "ログインしてください。" }, { status: 401 });
  }

  try {
    const payload = normalizeJobPayload(await request.json());
    const validationError = validateJobPayload(payload);
    if (validationError) {
      return NextResponse.json({ message: validationError }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("jobs")
      .insert(payloadToRow(payload))
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ job: rowToJob(data) }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "求人の保存に失敗しました。") },
      { status: 500 },
    );
  }
}
