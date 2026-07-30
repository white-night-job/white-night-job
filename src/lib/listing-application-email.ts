import {
  buildNeedsInfoUploadUrl,
  buildOnboardingUrl,
  planLabel,
  type ListingApplicationRow,
  type ListingDocumentMeta,
  type ListingShopImage,
} from "@/lib/listing-application";
import { getAdminNotifyEmail, hasMailConfig, sendMail } from "@/lib/mail";
import {
  createSupabaseAdmin,
  LISTING_APPLICATION_DOCUMENT_BUCKET,
  LISTING_APPLICATION_IMAGE_BUCKET,
} from "@/lib/supabase";

/** メール内リンク用（7日） */
const EMAIL_SIGNED_URL_TTL_SEC = 60 * 60 * 24 * 7;

async function safeSend(options: {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}): Promise<{ sent: boolean; error?: string }> {
  if (!hasMailConfig()) {
    console.warn("[listing-application-email] mail config missing, skip");
    return { sent: false, error: "mail_config_missing" };
  }
  try {
    await sendMail(options);
    return { sent: true };
  } catch (error) {
    console.error("[listing-application-email] send failed:", error);
    return {
      sent: false,
      error: error instanceof Error ? error.message : "send_failed",
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
  if (doc.signedUrl) return doc.signedUrl;
  try {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase.storage
      .from(LISTING_APPLICATION_DOCUMENT_BUCKET)
      .createSignedUrl(doc.storagePath, EMAIL_SIGNED_URL_TTL_SEC);
    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  } catch (error) {
    console.error("[listing-application-email] sign document failed:", error);
    return null;
  }
}

async function formatDocumentLine(
  label: string,
  doc: ListingDocumentMeta | null | undefined,
): Promise<string> {
  if (!doc?.storagePath) return `${label}: 未提出`;
  const url = await signDocumentUrl(doc);
  const name = doc.fileName || doc.storagePath;
  if (url) return `${label}: ${name}\n  ${url}`;
  return `${label}: ${name}（URL生成に失敗。管理画面で確認してください）`;
}

async function formatImageSection(
  title: string,
  images: ListingShopImage[] | null | undefined,
): Promise<string> {
  const list = Array.isArray(images) ? images : [];
  if (list.length === 0) return `${title}: なし`;

  const lines: string[] = [`${title}: ${list.length}枚`];
  try {
    const supabase = createSupabaseAdmin();
    for (let i = 0; i < list.length; i++) {
      const img = list[i];
      const name = img.fileName || img.storagePath || `画像${i + 1}`;
      let url = img.signedUrl;
      if (!url && img.storagePath) {
        const { data, error } = await supabase.storage
          .from(LISTING_APPLICATION_IMAGE_BUCKET)
          .createSignedUrl(img.storagePath, EMAIL_SIGNED_URL_TTL_SEC);
        if (!error) url = data?.signedUrl;
      }
      lines.push(`  ${i + 1}. ${name}`);
      lines.push(
        url
          ? `     ${url}`
          : "     （URL生成に失敗。管理画面で確認してください）",
      );
    }
  } catch (error) {
    console.error("[listing-application-email] sign images failed:", error);
    lines.push(
      "  （署名URLの生成に失敗しました。管理画面で確認してください）",
    );
  }
  return lines.join("\n");
}

function buildAdminSiteUrl(applicationId: string): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    process.env.SITE_URL?.replace(/\/$/, "") ||
    "";
  if (!base) return "管理画面の「掲載審査管理」から確認してください。";
  return `${base}/admin?tab=listing-reviews&id=${encodeURIComponent(applicationId)}`;
}

export async function notifyAdminNewApplication(
  row: ListingApplicationRow,
): Promise<void> {
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
    to: getAdminNotifyEmail(),
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
    console.warn(
      "[listing-application-email] admin notify skipped/failed:",
      result.error,
      row.application_number,
    );
  }
}

export async function notifyApplicantReceived(
  row: ListingApplicationRow,
): Promise<void> {
  await safeSend({
    to: row.contact_email,
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
      `${process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || ""}/for-shops/review-status`,
      "",
      "White Night Job",
    ].join("\n"),
  });
}

export async function notifyApplicantApproved(
  row: ListingApplicationRow,
): Promise<void> {
  if (!row.invite_code) return;
  const url = buildOnboardingUrl(row.invite_code);
  await safeSend({
    to: row.contact_email,
    subject: `【White Night Job】掲載審査に通過しました（${row.application_number}）`,
    text: [
      `${row.contact_name} 様`,
      "",
      "掲載審査に通過しました。",
      "以下のURLから店舗情報・求人情報の登録へお進みください。",
      "",
      url,
      "",
      `申請番号: ${row.application_number}`,
      `確定プラン（仮）: ${planLabel(row.confirmed_plan ?? row.requested_plan)}`,
      "",
      "※このURLは承認された店舗専用です。第三者へ共有しないでください。",
      "",
      "White Night Job",
    ].join("\n"),
  });
}

export async function notifyApplicantRejected(
  row: ListingApplicationRow,
): Promise<void> {
  await safeSend({
    to: row.contact_email,
    subject: `【White Night Job】掲載審査の結果について（${row.application_number}）`,
    text: [
      `${row.contact_name} 様`,
      "",
      "このたびは掲載審査へお申し込みいただきありがとうございました。",
      "審査の結果、今回は掲載をお見送りさせていただくこととなりました。",
      "",
      `申請番号: ${row.application_number}`,
      row.rejection_reason
        ? `\n理由:\n${row.rejection_reason}\n`
        : "",
      "",
      "ご不明点がございましたらお問い合わせください。",
      "",
      "White Night Job",
    ].join("\n"),
  });
}

export async function notifyApplicantNeedsInfo(
  row: ListingApplicationRow,
): Promise<void> {
  const uploadUrl = row.needs_info_upload_token
    ? buildNeedsInfoUploadUrl(row.needs_info_upload_token)
    : null;

  await safeSend({
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
