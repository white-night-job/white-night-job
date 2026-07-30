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
  created_at?: string;
  shop_name: string;
  shop_address?: string | null;
  area?: string | null;
  business_type?: string | null;
  business_hours?: string | null;
  shop_phone?: string | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  website_url?: string | null;
  instagram_url?: string | null;
  x_url?: string | null;
  tiktok_url?: string | null;
  line_official_url?: string | null;
  youtube_url?: string | null;
  other_sns?: string | null;
  open_date?: string | null;
  listing_reason?: string | null;
  shop_features?: string | null;
  notes?: string | null;
  requested_plan?: JobPlan | null;
  confirmed_plan?: JobPlan | null;
  requestedPlanLabel?: string;
  confirmedPlanLabel?: string;
  onboardingUrl?: string | null;
  shop_exterior_images?: Array<{
    storagePath: string;
    fileName: string;
    kind: "exterior" | "interior";
    signedUrl?: string;
  }> | null;
  shop_interior_images?: Array<{
    storagePath: string;
    fileName: string;
    kind: "exterior" | "interior";
    signedUrl?: string;
  }> | null;
  business_license_document?: {
    fileName?: string;
    mimeType?: string;
    signedUrl?: string;
  } | null;
  entertainment_license_document?: {
    fileName?: string;
    mimeType?: string;
    signedUrl?: string;
  } | null;
  late_night_alcohol_notification_document?: {
    fileName?: string;
    mimeType?: string;
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

function displayText(value: unknown): string {
  if (value == null) return "—";
  const text = String(value).trim();
  return text || "—";
}

function statusBadgeLabel(status: ListingApplicationStatus): string {
  if (status === "pending") return "未審査";
  if (status === "approved") return "承認";
  if (status === "rejected") return "却下";
  return LISTING_APPLICATION_STATUS_LABELS[status];
}

function DocumentCard({
  label,
  doc,
}: {
  label: string;
  doc:
    | { fileName?: string; mimeType?: string; signedUrl?: string }
    | null
    | undefined;
}) {
  const isImage = Boolean(doc?.mimeType?.startsWith("image/") && doc.signedUrl);
  return (
    <div className="rounded-lg border border-gold/20 px-3 py-2">
      <p className="text-xs text-muted">{label}</p>
      {doc?.signedUrl ? (
        <div className="mt-2 space-y-2">
          {isImage ? (
            <a href={doc.signedUrl} target="_blank" rel="noopener noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={doc.signedUrl}
                alt={doc.fileName ?? label}
                className="max-h-40 w-full rounded-md object-contain bg-ivory"
              />
            </a>
          ) : null}
          <a
            href={doc.signedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-sm text-gold-dark underline break-all"
          >
            {doc.fileName ?? "書類を開く"}
          </a>
        </div>
      ) : (
        <p className="mt-1 text-sm text-muted">未提出</p>
      )}
    </div>
  );
}

function ImageGallery({
  label,
  images,
}: {
  label: string;
  images:
    | Array<{
        storagePath: string;
        fileName: string;
        kind: "exterior" | "interior";
        signedUrl?: string;
      }>
    | null
    | undefined;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium">
        {label}
        {Array.isArray(images) && images.length > 0
          ? `（${images.length}枚）`
          : ""}
      </p>
      {Array.isArray(images) && images.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {images.map((img) => (
            <div
              key={img.storagePath}
              className="overflow-hidden rounded-lg border border-gold/20 bg-ivory/40"
            >
              {img.signedUrl ? (
                <a
                  href={img.signedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.signedUrl}
                    alt={img.fileName}
                    className="aspect-square w-full object-cover"
                  />
                </a>
              ) : (
                <div className="flex aspect-square items-center justify-center text-xs text-muted">
                  プレビュー不可
                </div>
              )}
              <div className="space-y-1 p-2">
                <p className="truncate text-xs">{img.fileName}</p>
                {img.signedUrl ? (
                  <a
                    href={img.signedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gold-dark underline"
                  >
                    拡大・ダウンロード
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted">未提出</p>
      )}
    </div>
  );
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
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="listing-review-detail-title"
          onClick={() => {
            setSelectedId(null);
            setDetail(null);
          }}
        >
          <div
            className="my-4 w-full max-w-4xl space-y-4 rounded-2xl border border-gold/25 bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2
                  id="listing-review-detail-title"
                  className="font-serif text-xl text-charcoal"
                >
                  {displayText(detail.shop_name)}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  申請番号: {displayText(detail.application_number)}
                </p>
                <p className="mt-2 inline-flex rounded-full border border-gold/30 bg-ivory px-3 py-1 text-xs font-medium text-charcoal">
                  審査ステータス: {statusBadgeLabel(detail.status)}
                  {detail.statusLabel !== statusBadgeLabel(detail.status)
                    ? `（${detail.statusLabel}）`
                    : ""}
                </p>
              </div>
              <button
                type="button"
                className="rounded-full border border-gold/30 px-3 py-1.5 text-sm text-muted"
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
                  ["申請番号", detail.application_number],
                  ["申請日時", formatDate(detail.created_at)],
                  ["店舗名", detail.shop_name],
                  ["担当者", detail.contact_name],
                  ["電話番号", detail.contact_phone],
                  ["メールアドレス", detail.contact_email],
                  ["所在地", detail.shop_address],
                  ["エリア", detail.area],
                  ["業種", detail.business_type],
                  ["営業時間", detail.business_hours],
                  ["オープン日", detail.open_date],
                  [
                    "選択プラン",
                    detail.requestedPlanLabel ??
                      (detail.requested_plan
                        ? planLabel(detail.requested_plan)
                        : null),
                  ],
                  [
                    "確定プラン",
                    detail.confirmedPlanLabel ??
                      (detail.confirmed_plan
                        ? planLabel(detail.confirmed_plan)
                        : null),
                  ],
                ] as Array<[string, unknown]>
              ).map(([label, value]) => (
                <div key={label} className="rounded-lg bg-ivory/70 px-3 py-2">
                  <p className="text-xs text-muted">{label}</p>
                  <p className="mt-0.5 whitespace-pre-wrap break-all">
                    {label === "申請日時"
                      ? String(value || "—")
                      : displayText(value)}
                  </p>
                </div>
              ))}
            </div>

            <div className="space-y-3 text-sm">
              <div className="rounded-lg bg-ivory/70 px-3 py-2">
                <p className="text-xs text-muted">店舗紹介</p>
                <p className="mt-0.5 whitespace-pre-wrap break-all">
                  {displayText(
                    detail.listing_reason ||
                      detail.shop_features ||
                      detail.notes,
                  )}
                </p>
              </div>
              <div className="rounded-lg bg-ivory/70 px-3 py-2">
                <p className="text-xs text-muted">キャスト情報</p>
                <p className="mt-0.5 text-muted">
                  （掲載申請時点では未登録。承認後の求人登録で入力されます）
                </p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">SNS</p>
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                {(
                  [
                    ["Web", detail.website_url],
                    ["Instagram", detail.instagram_url],
                    ["X", detail.x_url],
                    ["TikTok", detail.tiktok_url],
                    ["LINE公式", detail.line_official_url],
                    ["YouTube", detail.youtube_url],
                    ["その他SNS", detail.other_sns],
                  ] as Array<[string, unknown]>
                ).map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-ivory/70 px-3 py-2">
                    <p className="text-xs text-muted">{label}</p>
                    {value && String(value).trim() ? (
                      String(value).startsWith("http") ? (
                        <a
                          href={String(value)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-0.5 block break-all text-gold-dark underline"
                        >
                          {String(value)}
                        </a>
                      ) : (
                        <p className="mt-0.5 whitespace-pre-wrap break-all">
                          {String(value)}
                        </p>
                      )
                    ) : (
                      <p className="mt-0.5 text-muted">—</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">提出書類</p>
              <div className="grid gap-3 text-sm sm:grid-cols-3">
                <DocumentCard
                  label="営業許可証"
                  doc={detail.business_license_document}
                />
                <DocumentCard
                  label="風営許可証"
                  doc={detail.entertainment_license_document}
                />
                <DocumentCard
                  label="深夜酒類提供届"
                  doc={detail.late_night_alcohol_notification_document}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <ImageGallery
                label="店舗外観画像"
                images={detail.shop_exterior_images}
              />
              <ImageGallery
                label="店内画像"
                images={detail.shop_interior_images}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-muted">操作者名</label>
                <input
                  className={inputClass}
                  value={actor}
                  onChange={(e) => setActor(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">担当管理者</label>
                <input
                  className={inputClass}
                  value={assignedAdmin}
                  onChange={(e) => setAssignedAdmin(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs text-muted">
                  管理者メモ（申請者非公開）
                </label>
                <textarea
                  className={inputClass}
                  rows={3}
                  value={adminMemo}
                  onChange={(e) => setAdminMemo(e.target.value)}
                />
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
                <label className="mb-1 block text-xs text-muted">
                  却下理由（申請者へ通知可）
                </label>
                <textarea
                  className={inputClass}
                  rows={2}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs text-muted">
                  追加確認・不足内容
                </label>
                <textarea
                  className={inputClass}
                  rows={3}
                  value={needsInfoMessage}
                  onChange={(e) => setNeedsInfoMessage(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">提出期限</label>
                <input
                  className={inputClass}
                  type="date"
                  value={needsInfoDeadline}
                  onChange={(e) => setNeedsInfoDeadline(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-gold/15 pt-4">
              <button
                type="button"
                disabled={busy}
                onClick={() => void runAction("approve")}
                className="rounded-full bg-gradient-to-r from-gold to-gold-dark px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                承認する
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void runAction("reject")}
                className="rounded-full border border-red-300 px-5 py-2.5 text-sm text-red-700 disabled:opacity-60"
              >
                却下する
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void runAction("set_status", { status: "reviewing" })}
                className="rounded-full border border-gold/40 px-4 py-2 text-xs disabled:opacity-60"
              >
                審査中へ
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void runAction("needs_info")}
                className="rounded-full border border-gold/40 px-4 py-2 text-xs disabled:opacity-60"
              >
                追加確認を送る
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void runAction("confirm_plan")}
                className="rounded-full border border-gold/40 px-4 py-2 text-xs disabled:opacity-60"
              >
                プラン確定
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void runAction("save_memo")}
                className="rounded-full border border-gold/40 px-4 py-2 text-xs disabled:opacity-60"
              >
                メモ保存
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void runAction("assign")}
                className="rounded-full border border-gold/40 px-4 py-2 text-xs disabled:opacity-60"
              >
                担当設定
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void runAction("withdraw")}
                className="rounded-full border border-gold/40 px-4 py-2 text-xs disabled:opacity-60"
              >
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
                    <li
                      key={event.id}
                      className="rounded-lg border border-gold/15 px-3 py-2"
                    >
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
        </div>
      )}
    </div>
  );
}
