import {
  buildNeedsInfoUploadUrl,
  getSiteOrigin,
  planLabel,
  type ListingApplicationRow,
  type ListingDocumentMeta,
  type ListingShopImage,
} from "@/lib/listing-application";
import { getAdminNotifyEmail, getMailConfigSnapshot, hasMailConfig, sendMail } from "@/lib/mail";
import {
  createSupabaseAdmin,
  LISTING_APPLICATION_DOCUMENT_BUCKET,
  LISTING_APPLICATION_IMAGE_BUCKET,
} from "@/lib/supabase";

/** メール内リンク用（7日） */
const EMAIL_SIGNED_URL_TTL_SEC = 60 * 60 * 24 * 7;

const bucketPublicCache = new Map<string, boolean>();

async function isBucketPublic(bucket: string): Promise<boolean> {
  if (bucketPublicCache.has(bucket)) {
    return bucketPublicCache.get(bucket)!;
  }
  try {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase.storage.listBuckets();
    if (error || !data) {
      bucketPublicCache.set(bucket, false);
      return false;
    }
    const found = data.find((b) => b.id === bucket || b.name === bucket);
    const isPublic = Boolean(found?.public);
    bucketPublicCache.set(bucket, isPublic);
    return isPublic;
  } catch {
    bucketPublicCache.set(bucket, false);
    return false;
  }
}

async function storageObjectExists(
  bucket: string,
  storagePath: string,
): Promise<boolean> {
  const supabase = createSupabaseAdmin();
  const lastSlash = storagePath.lastIndexOf("/");
  const folder = lastSlash >= 0 ? storagePath.slice(0, lastSlash) : "";
  const name = lastSlash >= 0 ? storagePath.slice(lastSlash + 1) : storagePath;
  if (!name) return false;

  const { data, error } = await supabase.storage.from(bucket).list(folder, {
    limit: 100,
    search: name,
  });
  if (error || !data) {
    console.warn(
      "[listing-application-email] object list failed:",
      bucket,
      storagePath,
      error,
    );
    return false;
  }
  return data.some((item) => item.name === name);
}

/**
 * Resolve a usable URL for email. Never reuses DB/client signedUrl
 * (those often point at draft/ paths after files were moved).
 */
async function resolveEmailStorageUrl(
  bucket: string,
  storagePath: string | undefined | null,
): Promise<string | null> {
  const path = typeof storagePath === "string" ? storagePath.trim() : "";
  if (!path) return null;

  const exists = await storageObjectExists(bucket, path);
  if (!exists) {
    console.warn(
      "[listing-application-email] object missing, skip URL:",
      bucket,
      path,
    );
    return null;
  }

  try {
    const supabase = createSupabaseAdmin();
    if (await isBucketPublic(bucket)) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return data?.publicUrl || null;
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, EMAIL_SIGNED_URL_TTL_SEC);
    if (error || !data?.signedUrl) {
      console.warn(
        "[listing-application-email] createSignedUrl failed:",
        bucket,
        path,
        error,
      );
      return null;
    }
    return data.signedUrl;
  } catch (error) {
    console.error(
      "[listing-application-email] resolve URL failed:",
      bucket,
      path,
      error,
    );
    return null;
  }
}

export type NotifyMailResult = {
  sent: boolean;
  error?: string;
  to: string;
  provider?: "resend" | "smtp";
  messageId?: string;
};

async function safeSend(options: {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}): Promise<NotifyMailResult> {
  if (!hasMailConfig()) {
    const snapshot = getMailConfigSnapshot();
    console.error(
      "[listing-application-email] mail config missing, skip send",
      snapshot,
    );
    return {
      sent: false,
      error:
        "mail_config_missing: RESEND_API_KEY または SMTP_HOST/SMTP_USER/SMTP_PASS を本番環境に設定してください",
      to: options.to,
    };
  }
  try {
    console.info("[listing-application-email] send start", {
      to: options.to,
      subject: options.subject,
      textLength: options.text.length,
      config: getMailConfigSnapshot(),
    });
    const result = await sendMail(options);
    console.info("[listing-application-email] send ok", {
      to: result.to,
      provider: result.provider,
      messageId: result.id ?? null,
      subject: result.subject,
      from: result.from,
    });
    return {
      sent: true,
      to: options.to,
      provider: result.provider,
      messageId: result.id,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "send_failed";
    console.error("[listing-application-email] send failed:", {
      to: options.to,
      subject: options.subject,
      error: message,
      detail: error,
      config: getMailConfigSnapshot(),
    });
    return {
      sent: false,
      error: message,
      to: options.to,
    };
  }
}

function formatSubmittedAt(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(d);
}

function dash(value: string | null | undefined): string {
  const v = typeof value === "string" ? value.trim() : "";
  return v || "—";
}

async function signDocumentUrl(
  doc: ListingDocumentMeta | null | undefined,
): Promise<string | null> {
  if (!doc?.storagePath) return null;
  return resolveEmailStorageUrl(
    LISTING_APPLICATION_DOCUMENT_BUCKET,
    doc.storagePath,
  );
}

async function formatDocumentLine(
  label: string,
  doc: ListingDocumentMeta | null | undefined,
): Promise<string> {
  if (!doc?.storagePath) return `${label}: 未提出`;
  const url = await signDocumentUrl(doc);
  const name = doc.fileName || doc.storagePath;
  if (url) return `${label}: ${name}\n  ${url}`;
  return `${label}: ${name}（ファイル確認不可。管理画面で確認してください）`;
}

async function formatImageSection(
  title: string,
  images: ListingShopImage[] | null | undefined,
): Promise<string> {
  const list = Array.isArray(images) ? images : [];
  if (list.length === 0) return `${title}: なし`;

  const lines: string[] = [`${title}: ${list.length}枚`];
  for (let i = 0; i < list.length; i++) {
    const img = list[i];
    const name = img.fileName || img.storagePath || `画像${i + 1}`;
    const url = await resolveEmailStorageUrl(
      LISTING_APPLICATION_IMAGE_BUCKET,
      img.storagePath,
    );
    lines.push(`  ${i + 1}. ${name}`);
    lines.push(
      url
        ? `     ${url}`
        : "     （ファイル確認不可。管理画面で確認してください）",
    );
  }
  return lines.join("\n");
}

function buildAdminSiteUrl(applicationId: string): string {
  return `${getSiteOrigin()}/admin/listing-reviews?id=${encodeURIComponent(applicationId)}`;
}

export async function notifyAdminNewApplication(
  row: ListingApplicationRow,
): Promise<NotifyMailResult> {
  const to = getAdminNotifyEmail();
  try {
    console.info("[listing-application-email] admin notify begin", {
      applicationNumber: row.application_number,
      applicationId: row.id,
      to,
      hasMailConfig: hasMailConfig(),
      config: getMailConfigSnapshot(),
    });

    const intro =
      dash(row.listing_reason) !== "—"
        ? dash(row.listing_reason)
        : dash(row.shop_features) !== "—"
          ? dash(row.shop_features)
          : "—";

    const [
      businessLicenseLine,
      entertainmentLicenseLine,
      lateNightLine,
      exteriorSection,
      interiorSection,
    ] = await Promise.all([
      formatDocumentLine("営業許可証", row.business_license_document),
      formatDocumentLine("風営許可証", row.entertainment_license_document),
      formatDocumentLine(
        "深夜酒類提供届出",
        row.late_night_alcohol_notification_document,
      ),
      formatImageSection("店舗外観画像", row.shop_exterior_images),
      formatImageSection("店内画像", row.shop_interior_images),
    ]);

    const result = await safeSend({
      to,
      subject: "【White Night Job】新しい店舗掲載申請が届きました",
      text: [
        "新しい店舗掲載申請が届きました。",
        "",
        `申請番号: ${row.application_number}`,
        `申請日時: ${formatSubmittedAt(row.created_at)}`,
        `店舗名: ${dash(row.shop_name)}`,
        `担当者名: ${dash(row.contact_name)}`,
        `メールアドレス: ${dash(row.contact_email)}`,
        `電話番号: ${dash(row.contact_phone)}`,
        `住所: ${dash(row.shop_address)}`,
        `エリア: ${dash(row.area)}`,
        `業種: ${dash(row.business_type)}`,
        `営業時間: ${dash(row.business_hours)}`,
        `紹介文: ${intro}`,
        `選択プラン: ${planLabel(row.requested_plan)}`,
        "",
        businessLicenseLine,
        entertainmentLicenseLine,
        lateNightLine,
        "",
        exteriorSection,
        "",
        interiorSection,
        "",
        "管理画面:",
        buildAdminSiteUrl(row.id),
        "",
        "※画像・書類のURLは一定期間で期限切れになります。期限後は管理画面から確認してください。",
      ].join("\n"),
      replyTo: row.contact_email,
    });

    if (!result.sent) {
      console.error(
        "[listing-application-email] admin notify failed:",
        result.error,
        row.application_number,
        { to: result.to },
      );
    } else {
      console.info(
        "[listing-application-email] admin notify succeeded:",
        row.application_number,
        {
          to: result.to,
          provider: result.provider,
          messageId: result.messageId,
        },
      );
    }
    return result;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "admin_notify_failed";
    console.error("[listing-application-email] admin notify exception:", {
      applicationNumber: row.application_number,
      to,
      error: message,
      detail: error,
    });
    return { sent: false, error: message, to };
  }
}

export async function notifyApplicantReceived(
  row: ListingApplicationRow,
): Promise<NotifyMailResult> {
  const to = row.contact_email;
  try {
    const result = await safeSend({
      to,
      subject: `【White Night Job】掲載審査のお申し込みを受け付けました（${row.application_number}）`,
      text: [
        `${row.contact_name} 様`,
        "",
        "掲載審査のお申し込みを受け付けました。",
        "",
        `申請番号: ${row.application_number}`,
        `店舗名: ${row.shop_name}`,
        "",
        "審査結果は、ご登録いただいたメールアドレスまたは電話番号へご連絡します。",
        "確認には数営業日かかる場合があります。",
        "",
        "審査状況の確認:",
        `${getSiteOrigin()}/for-shops/review-status`,
        "",
        "White Night Job",
      ].join("\n"),
    });
    if (!result.sent) {
      console.error(
        "[listing-application-email] applicant received notify failed:",
        result.error,
        row.application_number,
      );
    }
    return result;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "applicant_notify_failed";
    console.error(
      "[listing-application-email] applicant received notify exception:",
      message,
      error,
    );
    return { sent: false, error: message, to };
  }
}

export async function notifyApplicantApproved(
  row: ListingApplicationRow,
): Promise<NotifyMailResult> {
  const to = row.contact_email;
  const name = row.contact_name?.trim() || "ご担当者";
  return safeSend({
    to,
    subject: "【White Night Job】掲載審査承認のお知らせ",
    text: [
      `${name}様`,
      "",
      "White Night Jobへの掲載審査にお申し込みいただき、ありがとうございます。",
      "",
      "審査の結果、掲載を承認いたしました。",
      "",
      "掲載内容の作成については、運営側で対応いたします。",
      "必要事項がある場合は、改めてご連絡いたします。",
      "",
      "White Night Job運営事務局",
    ].join("\n"),
  });
}

export async function notifyApplicantRejected(
  row: ListingApplicationRow,
): Promise<NotifyMailResult> {
  const name = row.contact_name?.trim() || "ご担当者";
  const reason = row.rejection_reason?.trim() || "（理由の記載なし）";
  return safeSend({
    to: row.contact_email,
    subject: "【White Night Job】掲載審査結果のお知らせ",
    text: [
      `${name}様`,
      "",
      "White Night Jobへの掲載審査にお申し込みいただき、ありがとうございます。",
      "",
      "審査の結果、今回は掲載を見送らせていただくこととなりました。",
      "",
      "理由：",
      reason,
      "",
      "内容をご確認のうえ、必要に応じて再度お申し込みください。",
      "",
      "White Night Job運営事務局",
    ].join("\n"),
  });
}

export async function notifyApplicantNeedsInfo(
  row: ListingApplicationRow,
): Promise<NotifyMailResult> {
  // Kept for compatibility with older admin actions; UI no longer calls this.
  const uploadUrl = row.needs_info_upload_token
    ? buildNeedsInfoUploadUrl(row.needs_info_upload_token)
    : null;

  return safeSend({
    to: row.contact_email,
    subject: `【White Night Job】掲載審査の追加確認のお願い（${row.application_number}）`,
    text: [
      `${row.contact_name} 様`,
      "",
      "掲載審査にあたり、追加の確認が必要です。",
      "",
      `申請番号: ${row.application_number}`,
      "",
      "不足内容:",
      row.needs_info_message || "（内容は管理画面でご確認ください）",
      "",
      row.needs_info_deadline
        ? `提出期限: ${row.needs_info_deadline}`
        : null,
      uploadUrl ? `\n追加資料の提出・状況確認:\n${uploadUrl}` : null,
      "",
      "White Night Job",
    ]
      .filter((line) => line !== null)
      .join("\n"),
  });
}
