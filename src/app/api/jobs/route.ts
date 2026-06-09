import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getErrorMessage } from "@/lib/api-error";
import {
  normalizeJobPayload,
  payloadToRow,
  rowToJob,
  validateJobPayload,
} from "@/lib/job-db";
import {
  emptyApplicationDetail,
  fetchApplicationDetails,
  fetchApplicationRows,
  fillApplicationDetailsForJobs,
  type ApplicationRow,
  type JobApplicationDetail,
} from "@/lib/job-applications";
import {
  aggregateViewCounts,
  fetchViewRows,
  fillViewCountsForJobs,
  type ViewRow,
} from "@/lib/job-views";
import { createSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const district = searchParams.get("district");
    const jobType = searchParams.get("jobType");
    const keyword = searchParams.get("q")?.trim().toLowerCase() ?? "";
    const minSalary = Number(searchParams.get("minSalary") ?? 0);
    const selectedBenefits = searchParams.getAll("benefit").filter(Boolean);
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
    const filteredJobs = jobs.filter((job) => {
      const searchableText = [
        job.shopName,
        job.jobType,
        job.area,
        job.district,
        job.access,
        job.introductionText,
        job.descriptionText,
        ...job.benefits,
        ...(job.otherBenefits ?? []),
      ]
        .join(" ")
        .toLowerCase();
      const hourlySalary = getHourlySalary(job.salary);

      if (keyword && !searchableText.includes(keyword)) return false;
      if (minSalary > 0 && (hourlySalary === null || hourlySalary < minSalary)) {
        return false;
      }
      if (
        selectedBenefits.length > 0 &&
        !selectedBenefits.every((benefit) => job.benefits.includes(benefit))
      ) {
        return false;
      }

      return true;
    });

    const isAdmin = await isAdminAuthenticated();
    let applicationDetails: Record<string, JobApplicationDetail> | undefined;
    let applicationRows: ApplicationRow[] | undefined;
    let viewRows: ViewRow[] | undefined;
    let viewCounts: Record<string, number> | undefined;

    if (isAdmin) {
      try {
        const [rows, details, views] = await Promise.all([
          fetchApplicationRows(supabase),
          fetchApplicationDetails(supabase),
          fetchViewRows(supabase),
        ]);
        applicationDetails = fillApplicationDetailsForJobs(filteredJobs, details);
        applicationRows = rows;
        viewRows = views;
        viewCounts = fillViewCountsForJobs(
          filteredJobs,
          aggregateViewCounts(views),
        );
      } catch {
        applicationDetails = Object.fromEntries(
          filteredJobs.map((job) => [job.id, emptyApplicationDetail()]),
        );
        applicationRows = [];
        viewRows = [];
        viewCounts = Object.fromEntries(
          filteredJobs.map((job) => [job.id, 0]),
        );
      }
    }

    return NextResponse.json({
      jobs: filteredJobs,
      ...(applicationDetails
        ? {
            applicationDetails,
            applicationStats: applicationDetails,
            applicationRows,
            viewRows,
            viewCounts,
          }
        : {}),
    });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "求人の取得に失敗しました。") },
      { status: 500 },
    );
  }
}

function getHourlySalary(salary: string): number | null {
  if (/日給|月給|年収/.test(salary)) return null;

  const match = salary.replace(/,/g, "").match(/\d+/);
  return match ? Number(match[0]) : null;
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
