import type { ListingApplicationRow } from "@/lib/listing-application";
import type { JobPlan } from "@/lib/job-plan";
import { createSupabaseAdmin } from "@/lib/supabase";

export type ShopRow = {
  id: string;
  listing_application_id: string | null;
  shop_name: string;
  listing_status: string;
  listing_started_at: string | null;
  linked_job_id: string | null;
};

/**
 * Register / update shop master data when a listing application is approved.
 * Sets listing_status to active (掲載開始状態).
 */
export async function upsertShopFromApprovedApplication(
  application: ListingApplicationRow,
  plan: JobPlan,
): Promise<ShopRow> {
  const supabase = createSupabaseAdmin();
  const now = new Date().toISOString();

  const payload = {
    listing_application_id: application.id,
    shop_name: application.shop_name,
    shop_address: application.shop_address,
    area: application.area,
    business_type: application.business_type,
    business_hours: application.business_hours,
    phone: application.shop_phone,
    contact_name: application.contact_name,
    contact_phone: application.contact_phone,
    contact_email: application.contact_email,
    website_url: application.website_url,
    instagram_url: application.instagram_url,
    x_url: application.x_url,
    tiktok_url: application.tiktok_url,
    line_official_url: application.line_official_url,
    youtube_url: application.youtube_url,
    other_sns: application.other_sns,
    open_date: application.open_date,
    plan,
    listing_status: "active",
    listing_started_at: now,
    linked_job_id: application.linked_job_id,
  };

  const { data: existing } = await supabase
    .from("shops")
    .select("id")
    .eq("listing_application_id", application.id)
    .maybeSingle();

  if (existing?.id) {
    const { data, error } = await supabase
      .from("shops")
      .update(payload)
      .eq("id", existing.id)
      .select("id, listing_application_id, shop_name, listing_status, listing_started_at, linked_job_id")
      .single();
    if (error || !data) {
      console.error("[shops] update failed:", error);
      throw error ?? new Error("shops update failed");
    }
    return data as ShopRow;
  }

  const { data, error } = await supabase
    .from("shops")
    .insert(payload)
    .select("id, listing_application_id, shop_name, listing_status, listing_started_at, linked_job_id")
    .single();

  if (error || !data) {
    console.error("[shops] insert failed:", error);
    throw error ?? new Error("shops insert failed");
  }
  return data as ShopRow;
}
