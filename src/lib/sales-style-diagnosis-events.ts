import { deviceTypeFromUserAgent } from "@/lib/admin-user-activity";
import { isSalesStyleType } from "@/lib/sales-style-diagnosis";
import { createSupabaseAdmin } from "@/lib/supabase";

export function isSalesStyleTableMissing(error: {
  message?: string;
  code?: string;
} | null): boolean {
  if (!error) return false;
  return /sales_style_diagnos|schema cache|does not exist/i.test(error.message ?? "");
}

export type SalesStyleDiagnosisCompletedInput = {
  sessionId: string;
  completionKey: string;
  mainType?: string | null;
  subType?: string | null;
  userAgent?: string | null;
};

/**
 * 営業スタイル診断の結果画面到達を1回として記録する。
 * completion_key 重複は無視（二重計測防止）。テーブル未作成時は記録しない。
 */
export async function recordSalesStyleDiagnosisCompleted(
  input: SalesStyleDiagnosisCompletedInput,
): Promise<{ inserted: boolean }> {
  const sessionId = input.sessionId.trim();
  const completionKey = input.completionKey.trim();
  if (!sessionId || !completionKey) {
    throw new Error("sessionId and completionKey are required");
  }

  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("sales_style_diagnosis_events").insert({
    occurred_at: new Date().toISOString(),
    session_id: sessionId.slice(0, 120),
    completion_key: completionKey.slice(0, 120),
    device_type: deviceTypeFromUserAgent(input.userAgent),
    main_type: isSalesStyleType(input.mainType) ? input.mainType : null,
    sub_type: isSalesStyleType(input.subType) ? input.subType : null,
    user_agent: input.userAgent?.trim().slice(0, 500) || null,
  });

  if (error) {
    if (error.code === "23505") return { inserted: false };
    if (isSalesStyleTableMissing(error)) {
      console.warn("[sales-style-diagnosis] events table missing; skipped");
      return { inserted: false };
    }
    throw error;
  }

  return { inserted: true };
}
