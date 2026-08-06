"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { type JobPlan } from "@/lib/job-plan";
import {
  LISTING_APPLICANT_TYPE_LABELS,
  LISTING_APPLICATION_STATUS_LABELS,
  isListingApplicantType,
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
  applicant_type?: string | null;
  corporate_name?: string | null;
  corporate_name_kana?: string | null;
  corporate_number?: string | null;
  representative_name?: string | null;
  identity_document_front?: {
    fileName?: string;
    mimeType?: string;
    signedUrl?: string;
  } | null;
  identity_document_back?: {
    fileName?: string;
    mimeType?: string;
    signedUrl?: string;
  } | null;
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
  approved_at?: string | null;
  rejection_reason?: string | null;
  updated_at?: string | null;
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
  if (status === "reviewing") return "保留";
  if (status === "approved") return "承認";
  if (status === "rejected") return "却下";
  return LISTING_APPLICATION_STATUS_LABELS[status];
}

const ADMIN_STATUS_FILTER_OPTIONS: Array<{
  value: string;
  label: string;
}> = [
  { value: "all", label: "すべて" },
  { value: "pending", label: "未審査" },
  { value: "reviewing", label: "保留" },
  { value: "needs_info", label: "追加確認" },
  { value: "approved", label: "承認" },
  { value: "rejected", label: "却下" },
  { value: "withdrawn", label: "取り下げ" },
];

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
          <div className="flex flex-wrap gap-2">
            <a
              href={doc.signedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-full border border-gold/40 px-3 py-1.5 text-xs font-medium text-gold-dark hover:bg-ivory"
            >
              安全に閲覧
            </a>
            <a
              href={doc.signedUrl}
              target="_blank"
              rel="noopener noreferrer"
              download={doc.fileName ?? undefined}
              className="inline-flex rounded-full border border-gold/40 px-3 py-1.5 text-xs font-medium text-gold-dark hover:bg-ivory"
            >
              ダウンロード
            </a>
          </div>
          <p className="text-[11px] text-muted break-all">
            {doc.fileName ?? "書類"}
          </p>
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
  const searchParams = useSearchParams();
  const [items, setItems] = useState<ListItem[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [shopNameQuery, setShopNameQuery] = useState("");
  const [contactNameQuery, setContactNameQuery] = useState("");
  const [applicationNumberQuery, setApplicationNumberQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<DetailApplication | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [actor, setActor] = useState("admin");
  const [busy, setBusy] = useState(false);
  const [confirmModal, setConfirmModal] = useState<"approve" | "reject" | null>(
    null,
  );
  const [modalRejectionReason, setModalRejectionReason] = useState("");
  const [modalError, setModalError] = useState("");
  const actionLockRef = useRef(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const hasActiveFilters =
    statusFilter !== "all" ||
    Boolean(shopNameQuery.trim()) ||
    Boolean(contactNameQuery.trim()) ||
    Boolean(applicationNumberQuery.trim()) ||
    Boolean(dateFrom) ||
    Boolean(dateTo);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (shopNameQuery.trim()) params.set("shopName", shopNameQuery.trim());
      if (contactNameQuery.trim()) {
        params.set("contactName", contactNameQuery.trim());
      }
      if (applicationNumberQuery.trim()) {
        params.set("applicationNumber", applicationNumberQuery.trim());
      }
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
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
  }, [
    applicationNumberQuery,
    contactNameQuery,
    dateFrom,
    dateTo,
    shopNameQuery,
    statusFilter,
  ]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    const id = searchParams.get("id")?.trim();
    if (id) void openDetail(id);
    // open once from deep link
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function openDetail(id: string) {
    setSelectedId(id);
    setMessage("");
    setConfirmModal(null);
    setModalRejectionReason("");
    setModalError("");
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
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "詳細の取得に失敗しました。");
    }
  }

  async function runAction(
    action: "approve" | "reject",
    extra: Record<string, unknown> = {},
  ) {
    if (!selectedId || actionLockRef.current) return;
    actionLockRef.current = true;
    setBusy(true);
    setMessage("");
    setModalError("");
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
      setConfirmModal(null);
      setModalRejectionReason("");
      setMessage(
        action === "approve"
          ? "承認し、申請者へメールを送信しました。"
          : "却下し、申請者へメールを送信しました。",
      );
      await loadList();
    } catch (error) {
      const errMessage =
        error instanceof Error ? error.message : "更新に失敗しました。";
      setModalError(errMessage);
      setMessage(errMessage);
    } finally {
      setBusy(false);
      actionLockRef.current = false;
    }
  }

  function closeConfirmModal() {
    if (busy) return;
    setConfirmModal(null);
    setModalError("");
    setModalRejectionReason("");
  }

  function openApproveConfirm() {
    if (busy) return;
    setModalError("");
    setConfirmModal("approve");
  }

  function openRejectConfirm() {
    if (busy) return;
    setModalError("");
    setModalRejectionReason("");
    setConfirmModal("reject");
  }

  function confirmApprove() {
    void runAction("approve");
  }

  function confirmReject() {
    if (!modalRejectionReason.trim()) {
      setModalError("却下理由を入力してください。");
      return;
    }
    void runAction("reject", {
      rejectionReason: modalRejectionReason.trim(),
    });
  }

  function closeDetail() {
    if (busy) return;
    setSelectedId(null);
    setDetail(null);
    setConfirmModal(null);
    setModalError("");
    setModalRejectionReason("");
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gold/20 bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setIsSearchOpen((open) => !open)}
            aria-expanded={isSearchOpen}
            aria-controls="listing-reviews-search-panel"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-gold/40 bg-ivory px-5 py-3 text-sm font-semibold text-gold-dark transition hover:bg-ivory/80 sm:w-auto sm:min-w-[12rem]"
          >
            {isSearchOpen ? "検索条件を閉じる" : "検索条件を開く"}
          </button>
          {hasActiveFilters ? (
            <span className="inline-flex items-center rounded-full border border-gold/30 bg-ivory px-3 py-1.5 text-xs font-medium text-charcoal">
              条件設定中
            </span>
          ) : null}
        </div>

        {isSearchOpen ? (
          <div
            id="listing-reviews-search-panel"
            className="mt-4 grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            <div>
              <label className="mb-1 block text-xs text-muted">店舗名</label>
              <input
                className={inputClass}
                value={shopNameQuery}
                onChange={(e) => setShopNameQuery(e.target.value)}
                placeholder="店舗名"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">担当者</label>
              <input
                className={inputClass}
                value={contactNameQuery}
                onChange={(e) => setContactNameQuery(e.target.value)}
                placeholder="担当者名"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">申請番号</label>
              <input
                className={inputClass}
                value={applicationNumberQuery}
                onChange={(e) => setApplicationNumberQuery(e.target.value)}
                placeholder="申請番号"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">ステータス</label>
              <select
                className={inputClass}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {ADMIN_STATUS_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">申請日（開始）</label>
              <input
                className={inputClass}
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">申請日（終了）</label>
              <input
                className={inputClass}
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-3">
              <button
                type="button"
                onClick={() => void loadList()}
                className="min-h-11 rounded-full bg-gradient-to-r from-gold to-gold-dark px-5 py-2.5 text-sm font-semibold text-white"
              >
                検索
              </button>
              <button
                type="button"
                onClick={() => {
                  setShopNameQuery("");
                  setContactNameQuery("");
                  setApplicationNumberQuery("");
                  setStatusFilter("all");
                  setDateFrom("");
                  setDateTo("");
                }}
                className="min-h-11 rounded-full border border-gold/40 px-5 py-2.5 text-sm text-gold-dark"
              >
                条件クリア
              </button>
            </div>
          </div>
        ) : null}
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
              <th className="px-3 py-2">申請番号</th>
              <th className="px-3 py-2">申請日</th>
              <th className="px-3 py-2">店舗名</th>
              <th className="px-3 py-2">担当者</th>
              <th className="px-3 py-2">エリア</th>
              <th className="px-3 py-2">業種</th>
              <th className="px-3 py-2">選択プラン</th>
              <th className="px-3 py-2">審査ステータス</th>
              <th className="px-3 py-2">詳細</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-3 py-4 text-muted" colSpan={9}>
                  読み込み中...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td className="px-3 py-4 text-muted" colSpan={9}>
                  申請はまだありません。
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item.id}
                  className={`border-t border-gold/10 hover:bg-ivory/60 ${
                    selectedId === item.id ? "bg-ivory" : ""
                  }`}
                >
                  <td className="px-3 py-2 whitespace-nowrap font-mono text-xs">
                    {item.applicationNumber}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {formatDate(item.createdAt)}
                  </td>
                  <td className="px-3 py-2 font-medium">{item.shopName}</td>
                  <td className="px-3 py-2">{item.contactName}</td>
                  <td className="px-3 py-2">{item.area || "—"}</td>
                  <td className="px-3 py-2">{item.businessType}</td>
                  <td className="px-3 py-2">{item.requestedPlanLabel}</td>
                  <td className="px-3 py-2">
                    <span className="inline-flex rounded-full border border-gold/30 bg-ivory px-2 py-0.5 text-xs">
                      {statusBadgeLabel(item.status)}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => void openDetail(item.id)}
                      className="rounded-full border border-gold/40 px-3 py-1 text-xs font-medium text-gold-dark hover:bg-ivory"
                    >
                      詳細
                    </button>
                  </td>
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
          onClick={closeDetail}
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
                disabled={busy}
                className="rounded-full border border-gold/30 px-3 py-1.5 text-sm text-muted disabled:opacity-50"
                onClick={closeDetail}
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
                  [
                    "申請者区分",
                    isListingApplicantType(detail.applicant_type)
                      ? LISTING_APPLICANT_TYPE_LABELS[detail.applicant_type]
                      : detail.applicant_type || null,
                  ],
                  ...(detail.applicant_type === "corporation"
                    ? ([
                        ["法人名", detail.corporate_name],
                        ["法人名フリガナ", detail.corporate_name_kana],
                        ["代表者名", detail.representative_name],
                      ] as Array<[string, unknown]>)
                    : []),
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
                  （掲載申請時点では未登録。承認後に管理者が求人管理から作成します）
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

            <div>
              <p className="mb-2 text-sm font-medium">
                顔写真付き身分証明書
              </p>
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <DocumentCard
                  label="表面"
                  doc={detail.identity_document_front}
                />
                <DocumentCard
                  label="裏面"
                  doc={detail.identity_document_back}
                />
              </div>
              <p className="mt-2 text-xs text-muted">
                閲覧URLは短時間のみ有効です。期限切れの場合は詳細を開き直してください。
              </p>
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

            <div className="space-y-3 border-t border-gold/15 pt-4">
              <p className="text-sm font-medium">審査操作</p>

              {detail.status === "approved" ? (
                <div className="rounded-xl bg-ivory px-4 py-3 text-sm">
                  <p className="font-medium text-gold-dark">承認済み</p>
                  <p className="mt-1 text-muted">
                    承認日時: {formatDate(detail.approved_at)}
                  </p>
                </div>
              ) : null}

              {detail.status === "rejected" ? (
                <div className="rounded-xl bg-ivory px-4 py-3 text-sm">
                  <p className="font-medium text-red-700">却下済み</p>
                  <p className="mt-1 text-muted">
                    却下日時:{" "}
                    {formatDate(
                      events.find((e) => e.event_type === "rejected")
                        ?.created_at ?? detail.updated_at,
                    )}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap break-all">
                    却下理由:{" "}
                    {displayText(detail.rejection_reason)}
                  </p>
                </div>
              ) : null}

              {detail.status !== "approved" && detail.status !== "rejected" ? (
                <>
                  <div>
                    <label className="mb-1 block text-xs text-muted">
                      操作者名
                    </label>
                    <input
                      className={inputClass}
                      value={actor}
                      onChange={(e) => setActor(e.target.value)}
                      disabled={busy}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={openApproveConfirm}
                      className="rounded-full bg-gradient-to-r from-gold to-gold-dark px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      承認
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={openRejectConfirm}
                      className="rounded-full border border-red-300 px-5 py-2.5 text-sm text-red-700 disabled:opacity-60"
                    >
                      却下
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled
                    className="rounded-full bg-gradient-to-r from-gold to-gold-dark px-5 py-2.5 text-sm font-semibold text-white opacity-40"
                  >
                    承認
                  </button>
                  <button
                    type="button"
                    disabled
                    className="rounded-full border border-red-300 px-5 py-2.5 text-sm text-red-700 opacity-40"
                  >
                    却下
                  </button>
                </div>
              )}
            </div>

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

      {detail && confirmModal ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/70 p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="listing-review-confirm-title"
          onClick={closeConfirmModal}
        >
          <div
            className="my-auto w-full max-w-md max-h-[min(90vh,40rem)] overflow-y-auto rounded-2xl border border-gold/30 bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              id="listing-review-confirm-title"
              className="font-serif text-lg text-charcoal"
            >
              {confirmModal === "approve" ? "承認の確認" : "却下の確認"}
            </h3>

            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 text-muted">店舗名</dt>
                <dd className="break-all font-medium text-charcoal">
                  {displayText(detail.shop_name)}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 text-muted">担当者名</dt>
                <dd className="break-all font-medium text-charcoal">
                  {displayText(detail.contact_name)}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 text-muted">申請番号</dt>
                <dd className="break-all font-medium text-charcoal">
                  {displayText(detail.application_number)}
                </dd>
              </div>
              {confirmModal === "approve" ? (
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0 text-muted">現在のステータス</dt>
                  <dd className="font-medium text-charcoal">
                    {statusBadgeLabel(detail.status)}
                  </dd>
                </div>
              ) : null}
            </dl>

            {confirmModal === "approve" ? (
              <div className="mt-4 space-y-2 text-sm">
                <p className="font-medium text-charcoal">
                  この申請を承認しますか？
                </p>
                <p className="text-muted">
                  承認結果は申請者のメールアドレスへ自動送信されます
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3 text-sm">
                <p className="font-medium text-charcoal">
                  この申請を却下しますか？
                </p>
                <div>
                  <label
                    htmlFor="listing-reject-reason"
                    className="mb-1 block text-xs text-muted"
                  >
                    却下理由（必須）
                  </label>
                  <textarea
                    id="listing-reject-reason"
                    className={inputClass}
                    rows={4}
                    value={modalRejectionReason}
                    disabled={busy}
                    onChange={(e) => {
                      setModalRejectionReason(e.target.value);
                      if (modalError) setModalError("");
                    }}
                    placeholder="運営内部用の却下理由を入力してください"
                  />
                </div>
                <p className="text-muted">
                  却下理由は運営のみが閲覧でき、申請者には送信されません
                </p>
              </div>
            )}

            {modalError ? (
              <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {modalError}
              </p>
            ) : null}

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={busy}
                onClick={closeConfirmModal}
                className="rounded-full border border-gold/30 px-5 py-2.5 text-sm text-charcoal disabled:opacity-50"
              >
                キャンセル
              </button>
              {confirmModal === "approve" ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={confirmApprove}
                  className="rounded-full bg-gradient-to-r from-gold to-gold-dark px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {busy ? "処理中..." : "承認を確定する"}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={busy || !modalRejectionReason.trim()}
                  onClick={confirmReject}
                  className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {busy ? "処理中..." : "却下を確定する"}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
