import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getErrorMessage } from "@/lib/api-error";
import {
  LISTING_APPLICATION_STATUS_LABELS,
  planLabel,
  type ListingApplicationRow,
} from "@/lib/listing-application";
import { createSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const q = searchParams.get("q")?.trim();
    const shopName = searchParams.get("shopName")?.trim();
    const contactName = searchParams.get("contactName")?.trim();
    const applicationNumber = searchParams.get("applicationNumber")?.trim();
    const dateFrom = searchParams.get("dateFrom")?.trim();
    const dateTo = searchParams.get("dateTo")?.trim();

    const supabase = createSupabaseAdmin();
    let query = supabase
      .from("listing_applications")
      .select(
        "id, application_number, status, shop_name, area, business_type, contact_name, contact_email, requested_plan, confirmed_plan, assigned_admin, created_at, updated_at, approved_at",
      )
      .order("created_at", { ascending: false })
      .limit(300);

    if (status && status !== "all") {
      query = query.eq("status", status);
    }
    if (shopName) {
      query = query.ilike("shop_name", `%${shopName}%`);
    }
    if (contactName) {
      query = query.ilike("contact_name", `%${contactName}%`);
    }
    if (applicationNumber) {
      query = query.ilike("application_number", `%${applicationNumber}%`);
    }
    if (dateFrom) {
      query = query.gte("created_at", `${dateFrom}T00:00:00.000+09:00`);
    }
    if (dateTo) {
      query = query.lte("created_at", `${dateTo}T23:59:59.999+09:00`);
    }

    const { data, error } = await query;
    if (error) throw error;

    let rows = (data ?? []) as ListingApplicationRow[];
    if (q) {
      const needle = q.toLowerCase();
      rows = rows.filter((row) =>
        [
          row.application_number,
          row.shop_name,
          row.contact_name,
          row.contact_email,
          row.area ?? "",
          row.business_type,
        ]
          .join(" ")
          .toLowerCase()
          .includes(needle),
      );
    }

    return NextResponse.json({
      ok: true,
      items: rows.map((row) => ({
        id: row.id,
        applicationNumber: row.application_number,
        status: row.status,
        statusLabel: LISTING_APPLICATION_STATUS_LABELS[row.status],
        shopName: row.shop_name,
        area: row.area,
        businessType: row.business_type,
        contactName: row.contact_name,
        contactEmail: row.contact_email,
        requestedPlan: row.requested_plan,
        requestedPlanLabel: planLabel(row.requested_plan),
        confirmedPlan: row.confirmed_plan,
        assignedAdmin: row.assigned_admin,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        approvedAt: row.approved_at,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "一覧の取得に失敗しました。") },
      { status: 500 },
    );
  }
}
