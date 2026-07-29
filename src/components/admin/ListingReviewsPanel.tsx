"use client";

import { useCallback, useEffect, useState } from "react";
import {
  JOB_PLANS,
  type JobPlan,
} from "@/lib/job-plan";
import {
  LISTING_APPLICATION_STATUSES,
  LISTING_APPLICATION_STATUS_LABELS,
  planLabel,
  type ListingApplicationStatus,
} from "@/lib/listing-application";

type ListItem = {
  id: string;
  applicationNumber: string;
  status: ListingApplicationStatus;
  statusLabel: string;
  shopName: string;
  area: string | null;
  businessType: string;
  contactName: string;
  contactEmail: string;
  requestedPlan: JobPlan;
  requestedPlanLabel: string;
  confirmedPlan: JobPlan | null;
  assignedAdmin: string | null;
  createdAt: string;
  approvedAt: string | null;
};

type DetailApplication = Record<string, unknown> & {
  id: string;
  application_number: string;
  status: ListingApplicationStatus;
  statusLabel: string;
  shop_name: string;
  requestedPlanLabel?: string;
  confirmedPlanLabel?: string;
  onboardingUrl?: string | null;
  attachments?: Array<{ url: string; name: string }> | null;
  business_license_document?: { fileName?: string; signedUrl?: string } | null;
  entertainment_license_document?: { fileName?: string; signedUrl?: string } | null;
  late_night_alcohol_notification_document?: {
    fileName?: string;
    signedUrl?: string;
  } | null;
};

type EventRow = {
  id: string;
  event_type: string;
  from_status: string | null;
  to_status: string | null;
  message: string | null;
  actor: string | null;
  created_at: string;
};

const inputClass =
  "w-full rounded-xl border border-gold/30 bg-ivory px-3 py-2 text-sm outline-none focus:border-gold";

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("ja-JP", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function ListingReviewsPanel() {
  const [items, setItems] = useState<ListItem[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<DetailApplication | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [actor, setActor] = useState("admin");
  const [adminMemo, setAdminMemo] = useState("");
  const [assignedAdmin, setAssignedAdmin] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [needsInfoMessage, setNeedsInfoMessage] = useState("");
  const [needsInfoDeadline, setNeedsInfoDeadline] = useState("");
  const [confirmedPlan, setConfirmedPlan] = useState<JobPlan>("standard");
  const [busy, setBusy] = useState(false);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (query.trim()) params.set("q", query.trim());
      const response = await fetch(
        `/api/admin/listing-applications?${params.toString()}`,
        { credentials: "include" },
      );
      const data = (await response.json()) as {
        message?: string;
        items?: ListItem[];
      };
      if (!response.ok) throw new Error(data.message ?? "取得に失敗しました。");
      setItems(data.items ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }, [query, statusFilter]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  async function openDetail(id: string) {
    setSelectedId(id);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/listing-applications/${id}`, {
        credentials: "include",
      });
      const data = (await response.json()) as {
        message?: string;
        application?: DetailApplication;
        events?: EventRow[];
      };
      if (!response.ok) throw new Error(data.message ?? "詳細の取得に失敗しました。");
      setDetail(data.application ?? null);
      setEvents(data.events ?? []);
      setAdminMemo(String(data.application?.admin_memo ?? ""));
      setAssignedAdmin(String(data.application?.assigned_admin ?? ""));
      setRejectionReason(String(data.application?.rejection_reason ?? ""));
      setNeedsInfoMessage(String(data.application?.needs_info_message ?? ""));
      setNeedsInfoDeadline(String(data.application?.needs_info_deadline ?? ""));
      const plan =
        (data.application?.confirmed_plan as JobPlan | null) ||
        (data.application?.requested_plan as JobPlan) ||
        "standard";
      setConfirmedPlan(plan);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "詳細の取得に失敗しました。");
    }
  }

  async function runAction(
    action: string,
    extra: Record<string, unknown> = {},
  ) {
    if (!selectedId) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(
        `/api/admin/listing-applications/${selectedId}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            actor,
            confirmedPlan,
            adminMemo,
            assignedAdmin,
            rejectionReason,
            needsInfoMessage,
            needsInfoDeadline,
            ...extra,
          }),
        },
      );
      const data = (await response.json()) as {
        message?: string;
        application?: DetailApplication;
        events?: EventRow[];
      };
      if (!response.ok) throw new Error(data.message ?? "更新に失敗しました。");
      setDetail(data.application ?? null);
      setEvents(data.events ?? []);
      setMessage("更新しました。");
      await loadList();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "更新に失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs text-muted">ステータス</label>
          <select
            className={inputClass}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">すべて</option>
            {LISTING_APPLICATION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {LISTING_APPLICATION_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[12rem] flex-1">
          <label className="mb-1 block text-xs text-muted">検索</label>
          <input
            className={inputClass}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="店舗名・申請番号・担当者など"
          />
        </div>
        <button
          type="button"
          onClick={() => void loadList()}
          className="rounded-full border border-gold/40 px-4 py-2 text-sm text-gold-dark"
        >
          再読み込み
        </button>
      </div>

      {message && (
        <p className="rounded-xl border border-gold/30 bg-white px-4 py-3 text-sm">
          {message}
        </p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-gold/20 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-ivory text-xs text-muted">
            <tr>
              <th className="px-3 py-2">申請日時</th>
              <th className="px-3 py-2">店舗名</th>
              <th className="px-3 py-2">業種</th>
              <th className="px-3 py-2">エリア</th>
              <th className="px-3 py-2">担当者</th>
              <th className="px-3 py-2">希望プラン</th>
              <th className="px-3 py-2">ステータス</th>
              <th className="px-3 py-2">担当管理者</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-3 py-4 text-muted" colSpan={8}>
                  読み込み中...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td className="px-3 py-4 text-muted" colSpan={8}>
                  申請はまだありません。
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item.id}
                  className={`cursor-pointer border-t border-gold/10 hover:bg-ivory/60 ${
                    selectedId === item.id ? "bg-ivory" : ""
                  }`}
                  onClick={() => void openDetail(item.id)}
                >
                  <td className="px-3 py-2 whitespace-nowrap">
                    {formatDate(item.createdAt)}
                  </td>
                  <td className="px-3 py-2 font-medium">{item.shopName}</td>
                  <td className="px-3 py-2">{item.businessType}</td>
                  <td className="px-3 py-2">{item.area || "—"}</td>
                  <td className="px-3 py-2">{item.contactName}</td>
                  <td className="px-3 py-2">{item.requestedPlanLabel}</td>
                  <td className="px-3 py-2">{item.statusLabel}</td>
                  <td className="px-3 py-2">{item.assignedAdmin || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {detail && (
        <div className="space-y-4 rounded-2xl border border-gold/25 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-serif text-xl text-charcoal">
                {String(detail.shop_name)}
              </h2>
              <p className="text-sm text-muted">
                {String(detail.application_number)} / {detail.statusLabel}
              </p>
            </div>
            <button
              type="button"
              className="text-sm text-muted"
              onClick={() => {
                setSelectedId(null);
                setDetail(null);
              }}
            >
              閉じる
            </button>
          </div>

          <div className="grid gap-3 text-sm sm:grid-cols-2">
            {(
              [
                ["所在地", detail.shop_address],
                ["業種", detail.business_type],
                ["営業時間", detail.business_hours],
                ["店舗電話", detail.shop_phone],
                ["担当者", detail.contact_name],
                ["担当電話", detail.contact_phone],
                ["メール", detail.contact_email],
                ["Web", detail.website_url],
                ["Instagram", detail.instagram_url],
                ["X", detail.x_url],
                ["TikTok", detail.tiktok_url],
                ["LINE公式", detail.line_official_url],
                ["YouTube", detail.youtube_url],
                ["その他SNS", detail.other_sns],
                ["オープン日", detail.open_date],
                [
                  "希望プラン",
                  detail.requestedPlanLabel ?? detail.requested_plan,
                ],
                [
                  "確定プラン",
                  detail.confirmedPlanLabel ?? detail.confirmed_plan,
                ],
                ["掲載希望理由", detail.listing_reason],
                ["店舗の特徴", detail.shop_features],
                ["補足", detail.notes],
              ] as Array<[string, unknown]>
            ).map(([label, value]) => (
              <div key={label} className="rounded-lg bg-ivory/70 px-3 py-2">
                <p className="text-xs text-muted">{label}</p>
                <p className="mt-0.5 whitespace-pre-wrap break-all">
                  {value ? String(value) : "—"}
                </p>
              </div>
            ))}
          </div>

          <div className="grid gap-3 text-sm sm:grid-cols-3">
            {([
              ["Business License", detail.business_license_document],
              ["Entertainment License", detail.entertainment_license_document],
              [
                "Late-night Alcohol Notification",
                detail.late_night_alcohol_notification_document,
              ],
            ] as Array<[string, unknown]>).map(([label, doc]) => {
              const value = doc as { fileName?: string; signedUrl?: string } | null;
              return (
                <div key={label} className="rounded-lg border border-gold/20 px-3 py-2">
                  <p className="text-xs text-muted">{label}</p>
                  {value?.signedUrl ? (
                    <a
                      href={value.signedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 block text-gold-dark underline"
                    >
                      {value.fileName ?? "View document"}
                    </a>
                  ) : (
                    <p className="mt-1 text-muted">Not submitted</p>
                  )}
                </div>
              );
            })}
          </div>

          {Array.isArray(detail.attachments) && detail.attachments.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium">添付資料</p>
              <ul className="space-y-1 text-sm">
                {detail.attachments.map((file) => (
                  <li key={file.url}>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gold-dark underline"
                    >
                      {file.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-muted">操作者名</label>
              <input className={inputClass} value={actor} onChange={(e) => setActor(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">担当管理者</label>
              <input className={inputClass} value={assignedAdmin} onChange={(e) => setAssignedAdmin(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-muted">管理者メモ（申請者非公開）</label>
              <textarea className={inputClass} rows={3} value={adminMemo} onChange={(e) => setAdminMemo(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">確定プラン</label>
              <select
                className={inputClass}
                value={confirmedPlan}
                onChange={(e) => setConfirmedPlan(e.target.value as JobPlan)}
              >
                {JOB_PLANS.map((plan) => (
                  <option key={plan} value={plan}>
                    {planLabel(plan)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">否認理由（申請者へ通知可）</label>
              <textarea className={inputClass} rows={2} value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-muted">追加確認・不足内容</label>
              <textarea className={inputClass} rows={3} value={needsInfoMessage} onChange={(e) => setNeedsInfoMessage(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">提出期限</label>
              <input className={inputClass} type="date" value={needsInfoDeadline} onChange={(e) => setNeedsInfoDeadline(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={() => void runAction("save_memo")} className="rounded-full border border-gold/40 px-4 py-2 text-xs">
              メモ保存
            </button>
            <button type="button" disabled={busy} onClick={() => void runAction("assign")} className="rounded-full border border-gold/40 px-4 py-2 text-xs">
              担当設定
            </button>
            <button type="button" disabled={busy} onClick={() => void runAction("confirm_plan")} className="rounded-full border border-gold/40 px-4 py-2 text-xs">
              プラン確定
            </button>
            <button type="button" disabled={busy} onClick={() => void runAction("set_status", { status: "reviewing" })} className="rounded-full border border-gold/40 px-4 py-2 text-xs">
              審査中へ
            </button>
            <button type="button" disabled={busy} onClick={() => void runAction("needs_info")} className="rounded-full border border-gold/40 px-4 py-2 text-xs">
              追加確認を送る
            </button>
            <button type="button" disabled={busy} onClick={() => void runAction("approve")} className="rounded-full bg-gradient-to-r from-gold to-gold-dark px-4 py-2 text-xs font-semibold text-white">
              承認する
            </button>
            <button type="button" disabled={busy} onClick={() => void runAction("reject")} className="rounded-full border border-red-300 px-4 py-2 text-xs text-red-700">
              否認する
            </button>
            <button type="button" disabled={busy} onClick={() => void runAction("withdraw")} className="rounded-full border border-gold/40 px-4 py-2 text-xs">
              取り下げ
            </button>
          </div>

          {detail.onboardingUrl && (
            <div className="rounded-xl bg-ivory px-4 py-3 text-sm">
              <p className="font-medium">承認後の登録URL</p>
              <a
                href={detail.onboardingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 block break-all text-gold-dark underline"
              >
                {detail.onboardingUrl}
              </a>
            </div>
          )}

          <div>
            <p className="mb-2 text-sm font-medium">審査履歴</p>
            <ul className="space-y-2 text-xs text-muted">
              {events.length === 0 ? (
                <li>履歴なし</li>
              ) : (
                events.map((event) => (
                  <li key={event.id} className="rounded-lg border border-gold/15 px-3 py-2">
                    <span>{formatDate(event.created_at)}</span>
                    {" · "}
                    <span>{event.event_type}</span>
                    {event.message ? ` — ${event.message}` : ""}
                    {event.actor ? `（${event.actor}）` : ""}
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
