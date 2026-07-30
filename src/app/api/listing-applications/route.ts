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
import {
  createSupabaseAdmin,
  LISTING_APPLICATION_DOCUMENT_BUCKET,
  LISTING_APPLICATION_IDENTITY_BUCKET,
  LISTING_APPLICATION_IMAGE_BUCKET,
} from "@/lib/supabase";
import type { ListingShopImage } from "@/lib/listing-application";

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

    const identityMappings = [
      [
        "identityDocumentFront",
        "identity_document_front",
        "identity-front",
      ],
      ["identityDocumentBack", "identity_document_back", "identity-back"],
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
        storagePath: targetPath,
        fileName: doc.fileName,
        mimeType: doc.mimeType,
        size: doc.size,
        uploadedAt: doc.uploadedAt,
      };
    }

    for (const [inputKey, dbKey, folder] of identityMappings) {
      const doc = input[inputKey];
      if (!doc?.storagePath) continue;
      const fileName = doc.storagePath.split("/").pop();
      if (!fileName) continue;
      const targetPath = `${saved.id}/${folder}/${fileName}`;
      if (doc.storagePath !== targetPath) {
        const { error: moveError } = await supabase.storage
          .from(LISTING_APPLICATION_IDENTITY_BUCKET)
          .move(doc.storagePath, targetPath);
        if (moveError) {
          console.error(
            "[listing-applications] identity document move failed:",
            moveError,
          );
          continue;
        }
      }
      updatePayload[dbKey] = {
        storagePath: targetPath,
        fileName: doc.fileName,
        mimeType: doc.mimeType,
        size: doc.size,
        uploadedAt: doc.uploadedAt,
      };
    }


    async function moveShopImages(
      images: ListingShopImage[] | undefined,
      kind: "exterior" | "interior",
    ): Promise<ListingShopImage[]> {
      const list = Array.isArray(images) ? images : [];
      const moved: ListingShopImage[] = [];
      for (let i = 0; i < list.length; i++) {
        const img = list[i];
        if (!img?.storagePath) continue;
        const fileName = img.storagePath.split("/").pop();
        if (!fileName) continue;
        const targetPath = `${saved.id}/${kind}/${fileName}`;
        if (img.storagePath !== targetPath) {
          const { error: moveError } = await supabase.storage
            .from(LISTING_APPLICATION_IMAGE_BUCKET)
            .move(img.storagePath, targetPath);
          if (moveError) {
            console.error("[listing-applications] image move failed:", moveError);
            // Keep the path that still exists; do not keep stale signedUrl
            moved.push({
              storagePath: img.storagePath,
              fileName: img.fileName,
              mimeType: img.mimeType,
              size: img.size,
              kind,
              sortOrder: i,
              uploadedAt: img.uploadedAt,
            });
            continue;
          }
        }
        moved.push({
          storagePath: targetPath,
          fileName: img.fileName,
          mimeType: img.mimeType,
          size: img.size,
          kind,
          sortOrder: i,
          uploadedAt: img.uploadedAt,
        });
      }
      return moved;
    }

    const exteriorMoved = await moveShopImages(input.shopExteriorImages, "exterior");
    const interiorMoved = await moveShopImages(input.shopInteriorImages, "interior");
    if (exteriorMoved.length > 0 || interiorMoved.length > 0) {
      updatePayload.shop_exterior_images = exteriorMoved;
      updatePayload.shop_interior_images = interiorMoved;
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

    // Await mail so Vercel serverless does not freeze/kill fire-and-forget work.
    // Application row is already saved; mail failure must not roll back or 500.
    console.info("[listing-applications] notify start", {
      id: saved.id,
      applicationNumber: saved.application_number,
    });
    const [adminMail, applicantMail] = await Promise.all([
      notifyAdminNewApplication(saved),
      notifyApplicantReceived(saved),
    ]);
    console.info("[listing-applications] notify finished", {
      id: saved.id,
      applicationNumber: saved.application_number,
      adminMail,
      applicantMail,
    });

    return NextResponse.json(
      {
        ok: true,
        applicationNumber: saved.application_number,
        id: saved.id,
        mail: {
          admin: adminMail,
          applicant: applicantMail,
        },
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
