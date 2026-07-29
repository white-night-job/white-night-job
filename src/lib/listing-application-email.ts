import {
  buildNeedsInfoUploadUrl,
  buildOnboardingUrl,
  planLabel,
  type ListingApplicationRow,
} from "@/lib/listing-application";
import { getAdminNotifyEmail, hasMailConfig, sendMail } from "@/lib/mail";

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

export async function notifyAdminNewApplication(
  row: ListingApplicationRow,
): Promise<void> {
  await safeSend({
    to: getAdminNotifyEmail(),
    subject: `【掲載審査】新規申請 ${row.application_number} / ${row.shop_name}`,
    text: [
      "新しい掲載審査申請が届きました。",
      "",
      `申請番号: ${row.application_number}`,
      `店舗名: ${row.shop_name}`,
      `業種: ${row.business_type}`,
      `エリア: ${row.area || "—"}`,
      `担当者: ${row.contact_name}`,
      `メール: ${row.contact_email}`,
      `電話: ${row.contact_phone}`,
      `希望プラン: ${planLabel(row.requested_plan)}`,
      "",
      "管理画面の「掲載審査管理」から確認してください。",
    ].join("\n"),
    replyTo: row.contact_email,
  });
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
