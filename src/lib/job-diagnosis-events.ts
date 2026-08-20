import { createSupabaseAdmin } from "@/lib/supabase";
import { deviceTypeFromUserAgent } from "@/lib/admin-user-activity";
import {
  buildUserActivityMetadata,
  insertUserActivityEvent,
} from "@/lib/user-activity-events";

export const JOB_DIAGNOSIS_COMPLETED = "job_diagnosis_completed" as const;

export type JobDiagnosisCompletedInput = {
  sessionId: string;
  completionKey: string;
  resultJobType?: string | null;
  area?: string | null;
  userAgent?: string | null;
  occurredAt?: string | null;
  anonymousId?: string | null;
  pagePath?: string | null;
};

/**
 * 診断結果画面到達を1回として記録する。
 * completion_key 重複は無視（二重計測防止）。
 */
export async function recordJobDiagnosisCompleted(
  input: JobDiagnosisCompletedInput,
): Promise<{ inserted: boolean }> {
  const sessionId = input.sessionId.trim();
  const completionKey = input.completionKey.trim();
  if (!sessionId || !completionKey) {
    throw new Error("sessionId and completionKey are required");
  }

  const supabase = createSupabaseAdmin();
  // event_type は常に job_diagnosis_completed 固定（クライアント指定不可）
  const { error } = await supabase.from("job_diagnosis_events").insert({
    event_type: JOB_DIAGNOSIS_COMPLETED,
    occurred_at: input.occurredAt?.trim() || new Date().toISOString(),
    session_id: sessionId.slice(0, 120),
    completion_key: completionKey.slice(0, 120),
    device_type: deviceTypeFromUserAgent(input.userAgent),
    result_job_type: input.resultJobType?.trim().slice(0, 80) || null,
    area: input.area?.trim().slice(0, 80) || null,
    user_agent: input.userAgent?.trim().slice(0, 500) || null,
  });

  if (error) {
    if (error.code === "23505") {
      return { inserted: false };
    }
    throw error;
  }

  try {
    await insertUserActivityEvent(supabase, {
      eventType: "job_diagnosis_complete",
      anonymousId: input.anonymousId?.trim() || sessionId.slice(0, 120),
      pagePath: input.pagePath ?? "/diagnosis",
      dedupeWindowMs: null,
      metadata: buildUserActivityMetadata({
        extra: {
          completion_key: completionKey.slice(0, 120),
          result_job_type: input.resultJobType?.trim().slice(0, 80) || null,
          area: input.area?.trim().slice(0, 80) || null,
        },
      }),
    });
  } catch {
    // Table may be missing until SQL migration.
  }

  return { inserted: true };
}
