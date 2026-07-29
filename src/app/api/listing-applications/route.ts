import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api-error";
import { getClientIp } from "@/lib/report-email";
import {
  generateApplicationNumber,
  inputToDbRow,
  normalizeListingApplicationInput,
  validateListingApplicationInput,
  type ListingApplicationInput,
  type ListingApplicationRow,
} from "@/lib/listing-application";
import {
  notifyAdminNewApplication,
  notifyApplicantReceived,
} from "@/lib/listing-application-email";
import { createSupabaseAdmin, LISTING_APPLICATION_DOCUMENT_BUCKET } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<ListingApplicationInput> & {
      confirmDuplicate?: boolean;
    };

    const validationError = validateListingApplicationInput(body);
    if (validationError) {
      return NextResponse.json({ message: validationError }, { status: 400 });
    }

    const input = normalizeListingApplicationInput(
      body as ListingApplicationInput,
    );
    const supabase = createSupabaseAdmin();

    const activeStatuses = ["pending", "reviewing", "needs_info", "approved"];
    const [{ data: byEmail }, { data: byName }] = await Promise.all([
      supabase
        .from("listing_applications")
        .select(
          "id, application_number, shop_name, contact_email, status, created_at",
        )
        .eq("contact_email", input.contactEmail)
        .in("status", activeStatuses)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("listing_applications")
        .select(
          "id, application_number, shop_name, contact_email, status, created_at",
        )
        .eq("shop_name", input.shopName)
        .in("status", activeStatuses)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    const duplicateMap = new Map<
      string,
      {
        application_number: string;
        shop_name: string;
        status: string;
        created_at: string;
      }
    >();
    for (const row of [...(byEmail ?? []), ...(byName ?? [])]) {
      duplicateMap.set(row.id, row);
    }
    const duplicates = [...duplicateMap.values()];

    if (duplicates.length > 0 && !body.confirmDuplicate) {
      return NextResponse.json(
        {
          message:
            "同じ店舗名または同じメールアドレスの申請が既にあります。内容をご確認のうえ、問題なければ再送信してください。",
          duplicateWarning: true,
          duplicates: duplicates.map((row) => ({
            applicationNumber: row.application_number,
            shopName: row.shop_name,
            status: row.status,
            createdAt: row.created_at,
          })),
        },
        { status: 409 },
      );
    }

    const applicationNumber = generateApplicationNumber();
    const row = inputToDbRow(input, {
      applicationNumber,
      clientIp: getClientIp(request),
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    const { data, error } = await supabase
      .from("listing_applications")
      .insert(row)
      .select("*")
      .single();

    if (error || !data) {
      console.error("[listing-applications] insert failed:", error);
      throw error ?? new Error("insert failed");
    }

    let saved = data as ListingApplicationRow;

    const documentMappings = [
      ["businessLicenseDocument", "business_license_document", "business-license"],
      [
        "entertainmentLicenseDocument",
        "entertainment_license_document",
        "entertainment-license",
      ],
      [
        "lateNightAlcoholNotificationDocument",
        "late_night_alcohol_notification_document",
        "late-night-alcohol-notification",
      ],
    ] as const;

    const updatePayload: Record<string, unknown> = {};
    for (const [inputKey, dbKey, folder] of documentMappings) {
      const doc = input[inputKey];
      if (!doc?.storagePath) continue;
      const fileName = doc.storagePath.split("/").pop();
      if (!fileName) continue;
      const targetPath = `${saved.id}/${folder}/${fileName}`;
      if (doc.storagePath !== targetPath) {
        const { error: moveError } = await supabase.storage
          .from(LISTING_APPLICATION_DOCUMENT_BUCKET)
          .move(doc.storagePath, targetPath);
        if (moveError) {
          console.error("[listing-applications] document move failed:", moveError);
          continue;
        }
      }
      updatePayload[dbKey] = {
        ...doc,
        storagePath: targetPath,
      };
    }

    if (Object.keys(updatePayload).length > 0) {
      const { data: moved, error: updateError } = await supabase
        .from("listing_applications")
        .update(updatePayload)
        .eq("id", saved.id)
        .select("*")
        .single();
      if (!updateError && moved) {
        saved = moved as ListingApplicationRow;
      }
    }

    await supabase.from("listing_application_events").insert({
      application_id: saved.id,
      event_type: "submitted",
      to_status: "pending",
      message: "申請を受付",
      actor: "applicant",
    });

    void notifyAdminNewApplication(saved);
    void notifyApplicantReceived(saved);

    return NextResponse.json(
      {
        ok: true,
        applicationNumber: saved.application_number,
        id: saved.id,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[listing-applications] POST failed:", error);
    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "掲載審査の申請に失敗しました。時間をおいて再度お試しください。",
        ),
      },
      { status: 500 },
    );
  }
}
