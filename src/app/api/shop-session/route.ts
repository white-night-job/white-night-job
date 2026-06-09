import { NextResponse } from "next/server";
import { getAuthenticatedShopJobId } from "@/lib/shop-auth";
import { rowToJob } from "@/lib/job-db";
import { createSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const jobId = await getAuthenticatedShopJobId();
  if (!jobId) {
    return NextResponse.json({ authenticated: false });
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ authenticated: false });
  }

  const job = rowToJob(data);
  return NextResponse.json({
    authenticated: true,
    jobId: job.id,
    shopName: job.shopName,
  });
}
