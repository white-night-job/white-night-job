"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  formatPlanPriceLabel,
  JOB_PLANS,
  type JobPlan,
} from "@/lib/job-plan";
import type { ListingAttachment } from "@/lib/listing-application";

const DRAFT_KEY = "wnj-listing-application-draft-v1";

// エラー無し�E通常枠
const inputBase =
  "w-full rounded-xl border bg-ivory px-4 py-3 text-base text-charcoal outline-none transition focus:ring-2";
const inputOk = `${inputBase} border-gold/30 focus:border-gold focus:ring-gold/20`;
const inputErr = `${inputBase} border-red-500 focus:border-red-500 focus:ring-red-200`;

const labelClass = "mb-1.5 block text-sm font-medium text-charcoal";
const sectionClass =
  "space-y-4 rounded-2xl border border-gold/25 bg-white p-5 shadow-sm sm:p-6";
const errTextClass = "mt-1.5 text-sm font-medium text-red-600";

// フィールドキーとそ�Eラベル�E�バリチE�EションメチE��ージ用�E�Etype FieldKey = keyof FormState;

type FieldError = Partial<Record<FieldKey, string>>;

type FormState = {
  shopName: string;
  shopAddress: string;
  area: string;
  businessType: string;
  businessHours: string;
  shopPhone: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  websiteUrl: string;
  instagramUrl: string;
  xUrl: string;
  tiktokUrl: string;
  lineOfficialUrl: string;
  youtubeUrl: string;
  otherSns: string;
  businessLicenseInfo: string;
  openDate: string;
  requestedPlan: JobPlan;
  listingReason: string;
  shopFeatures: string;
  notes: string;
  consentAccuracy: boolean;
  consentTerms: boolean;
  attachments: ListingAttachment[];
  website: string;
};

const EMPTY: FormState = {
  shopName: "",
  shopAddress: "",
  area: "",
  businessType: "",
  businessHours: "",
  shopPhone: "",
  contactName: "",
  contactPhone: "",
  contactEmail: "",
  websiteUrl: "",
  instagramUrl: "",
  xUrl: "",
  tiktokUrl: "",
  lineOfficialUrl: "",
  youtubeUrl: "",
  otherSns: "",
  businessLicenseInfo: "",
  openDate: "",
  requestedPlan: "standard",
  listingReason: "",
  shopFeatures: "",
  notes: "",
  consentAccuracy: false,
  consentTerms: false,
  attachments: [],
  website: "",
};

const STEPS = [
  { id: 1, title: "店�E基本惁E��" },
  { id: 2, title: "拁E��老E��報" },
  { id: 3, title: "SNS・Web惁E��" },
  { id: 4, title: "営業・許可惁E��" },
  { id: 5, title: "希望プラン" },
  { id: 6, title: "確認事頁E },
  { id: 7, title: "添付賁E��" },
  { id: 8, title: "冁E��確誁E },
] as const;

function loadDraft(): FormState | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<FormState>;
    return { ...EMPTY, ...parsed, attachments: parsed.attachments ?? [] };
  } catch {
    return null;
  }
}

/** ヘッダー高さ�E�余白刁E�Eスクロールマ�Eジン */
const SCROLL_MARGIN = 96;

function scrollToRef(ref: React.RefObject<HTMLElement | null>) {
  const el = ref.current;
  if (!el) return;
  const top =
    el.getBoundingClientRect().top + window.scrollY - SCROLL_MARGIN;
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
}

function focusFirstError(
  containerRef: React.RefObject<HTMLElement | null>,
) {
  if (!containerRef.current) return;
  // 少し遁E��して DOM が確定してからフォーカス
  setTimeout(() => {
    const el = containerRef.current?.querySelector<HTMLElement>(
      "[data-error-field] input, [data-error-field] textarea, [data-error-field] select",
    );
    el?.focus({ preventScroll: true });
  }, 80);
}

// ---- per-step バリチE�Eション�E�フィールド単位で返す�E�E----
function validateStep(step: number, form: FormState): FieldError {
  const errors: FieldError = {};

  if (step === 1) {
    if (!form.shopName.trim()) errors.shopName = "店�E名を入力してください、E;
    if (!form.shopAddress.trim()) errors.shopAddress = "店�E所在地を�E力してください、E;
    if (!form.businessType.trim()) errors.businessType = "業種を�E力してください、E;
    if (!form.businessHours.trim()) errors.businessHours = "営業時間を�E力してください、E;
    if (!form.shopPhone.trim()) errors.shopPhone = "店�E電話番号を�E力してください、E;
  }
  if (step === 2) {
    if (!form.contactName.trim()) errors.contactName = "拁E��老E��を�E力してください、E;
    if (!form.contactPhone.trim()) errors.contactPhone = "拁E��老E��話番号を�E力してください、E;
    if (!form.contactEmail.trim()) {
      errors.contactEmail = "拁E��老E��ールアドレスを�E力してください、E;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail.trim())) {
      errors.contactEmail = "メールアドレスの形式が正しくありません、E;
    }
  }
  if (step === 3) {
    const url = form.websiteUrl.trim();
    if (!url) {
      errors.websiteUrl = "公式Webサイトまた�ESNSのURLを�E力してください、E;
    } else if (!/^https?:\/\/.+/i.test(url)) {
      errors.websiteUrl = "正しいURLを�E力してください、E;
    }
  }
  if (step === 4) {
    if (!form.businessLicenseInfo.trim())
      errors.businessLicenseInfo = "営業許可に関する惁E��を�E力してください、E;
    if (!form.openDate.trim()) errors.openDate = "オープン日を�E力してください、E;
  }
  if (step === 5) {
    if (!JOB_PLANS.includes(form.requestedPlan))
      errors.requestedPlan = "希望プランを選択してください、E;
  }
  if (step === 6) {
    if (!form.listingReason.trim())
      errors.listingReason = "掲載を希望する琁E��を�E力してください、E;
    if (!form.shopFeatures.trim())
      errors.shopFeatures = "店�Eの特徴を�E力してください、E;
    if (!form.consentAccuracy)
      errors.consentAccuracy = "求人冁E��と勤務条件に相違がなぁE��とへの同意が忁E��です、E;
    if (!form.consentTerms)
      errors.consentTerms = "利用規紁E�E掲載基準�Eプライバシーポリシーへの同意が忁E��です、E;
  }
  return errors;
}

function hasErrors(errors: FieldError): boolean {
  return Object.keys(errors).length > 0;
}

// フィールチEつ刁E�EラチE��ー�E�エラー時に枠赤�E�メチE��ージ表示�E�Efunction Field({
  error,
  children,
}: {
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div data-error-field={error ? "1" : undefined}>
      {children}
      {error && <p className={errTextClass}>{error}</p>}
    </div>
  );
}

export function ListingApplicationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [navigating, setNavigating] = useState(false); // 「次へ、E「戻る」�E反応フラグ
  const [uploading, setUploading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState(""); // 送信エラーなど
  const [fieldErrors, setFieldErrors] = useState<FieldError>({});
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const [draftId, setDraftId] = useState(() => crypto.randomUUID());
  const formOpenedAt = useRef(Date.now());
  const submittingRef = useRef(false);
  const stepHeadRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const draft = loadDraft();
    const planParam = searchParams.get("plan");
    const plan =
      planParam === "light" || planParam === "standard" || planParam === "premium"
        ? planParam
        : null;

    if (draft) {
      setForm({ ...draft, requestedPlan: plan ?? draft.requestedPlan });
    } else if (plan) {
      setForm((c) => ({ ...c, requestedPlan: plan }));
    }
    setHydrated(true);
  }, [searchParams]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
  }, [form, hydrated]);

  const progress = useMemo(
    () => Math.round((step / STEPS.length) * 100),
    [step],
  );

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((c) => ({ ...c, [key]: value }));
    // 入力したフィールド�Eエラーをリアルタイムでクリア
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  const scrollToStepHead = useCallback(() => {
    scrollToRef(stepHeadRef);
  }, []);

  function goNext() {
    if (navigating) return;
    setNavigating(true);

    const errors = validateStep(step, form);
    if (hasErrors(errors)) {
      setFieldErrors(errors);
      setSubmitMessage("入力�E容にエラーがあります。赤字�E頁E��をご確認ください、E);
      // スクロール→フォーカス
      scrollToStepHead();
      focusFirstError(sectionRef);
      setNavigating(false);
      return;
    }

    setFieldErrors({});
    setSubmitMessage("");
    setStep((c) => Math.min(STEPS.length, c + 1));
    // 次フレームでスクロール�E�Etep state 更新�E��Eレンダリング後！E    requestAnimationFrame(() => {
      scrollToStepHead();
      setNavigating(false);
    });
  }

  function goBack() {
    if (navigating) return;
    setNavigating(true);
    setFieldErrors({});
    setSubmitMessage("");
    setStep((c) => Math.max(1, c - 1));
    requestAnimationFrame(() => {
      scrollToStepHead();
      setNavigating(false);
    });
  }

  async function handleUpload(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    if (form.attachments.length + fileList.length > 8) {
      setSubmitMessage("添付賁E��は最大8件までです、E);
      scrollToStepHead();
      return;
    }

    setUploading(true);
    setSubmitMessage("");
    try {
      const uploaded: ListingAttachment[] = [];
      for (const file of Array.from(fileList)) {
        const body = new FormData();
        body.append("file", file);
        body.append("draftId", draftId);
        const response = await fetch("/api/listing-applications/upload", {
          method: "POST",
          body,
        });
        const data = (await response.json()) as {
          message?: string;
          attachment?: ListingAttachment;
          draftId?: string;
        };
        if (!response.ok)
          throw new Error(data.message ?? "アチE�Eロードに失敗しました、E);
        if (data.draftId) setDraftId(data.draftId);
        if (data.attachment) uploaded.push(data.attachment);
      }
      update("attachments", [...form.attachments, ...uploaded]);
    } catch (error) {
      setSubmitMessage(
        error instanceof Error ? error.message : "アチE�Eロードに失敗しました、E,
      );
      scrollToStepHead();
    } finally {
      setUploading(false);
    }
  }

  async function submit(confirmDuplicate = false) {
    if (submittingRef.current) return;

    // スチE��チEのバリチE�Eションを念のため再確誁E    const errors = validateStep(6, form);
    if (hasErrors(errors)) {
      setFieldErrors(errors);
      setSubmitMessage("入力�E容にエラーがあります。赤字�E頁E��をご確認ください、E);
      setStep(6);
      scrollToStepHead();
      return;
    }

    submittingRef.current = true;
    setLoading(true);
    setSubmitMessage("");

    try {
      const response = await fetch("/api/listing-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          formOpenedAt: formOpenedAt.current,
          confirmDuplicate,
        }),
      });
      const data = (await response.json()) as {
        message?: string;
        applicationNumber?: string;
        duplicateWarning?: boolean;
      };

      if (response.status === 409 && data.duplicateWarning) {
        setDuplicateWarning(true);
        setSubmitMessage(data.message ?? "重褁E�E可能性があります、E);
        scrollToStepHead();
        return;
      }

      if (!response.ok) {
        throw new Error(data.message ?? "送信に失敗しました、E);
      }

      window.localStorage.removeItem(DRAFT_KEY);
      router.push(
        `/for-shops/apply/complete?no=${encodeURIComponent(data.applicationNumber ?? "")}`,
      );
    } catch (err) {
      setSubmitMessage(
        err instanceof Error ? err.message : "送信に失敗しました、E,
      );
      scrollToStepHead();
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  }

  if (!hydrated) {
    return (
      <p className="rounded-xl border border-gold/20 bg-white px-4 py-6 text-sm text-muted">
        読み込み中...
      </p>
    );
  }

  const fe = fieldErrors;

  return (
    <div className="space-y-5">
      {/* ── スチE��プ�EチE��ー�E�スクロール先！E── */}
      <div
        id="application-steps"
        ref={stepHeadRef}
        style={{ scrollMarginTop: `${SCROLL_MARGIN}px` }}
      >
        <div className="mb-2 flex items-center justify-between text-xs text-muted">
          <span>
            スチE��チE{step} / {STEPS.length}�E�{STEPS[step - 1]?.title}
          </span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gold/15">
          <div
            className="h-full rounded-full bg-gradient-to-r from-gold to-gold-dark transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* ── エラーサマリー�E�赤斁E��！E── */}
      {submitMessage && (
        <p
          role="alert"
          className={`rounded-xl border px-4 py-3 text-sm font-medium ${
            hasErrors(fieldErrors)
              ? "border-red-300 bg-red-50 text-red-700"
              : "border-gold/30 bg-white text-charcoal"
          }`}
        >
          {submitMessage}
        </p>
      )}

      {/* ── 重褁E��呁E── */}
      {duplicateWarning && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-charcoal">
          <p>同じ店�Eまた�Eメールでの申請が既にあります、E/p>
          <button
            type="button"
            disabled={loading}
            onClick={() => void submit(true)}
            className="mt-3 rounded-full bg-charcoal px-4 py-2 text-xs font-medium text-white disabled:opacity-60"
          >
            冁E��を確認した�Eで送信する
          </button>
        </div>
      )}

      {/* ── honeypot ── */}
      <div
        className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
        aria-hidden
      >
        <label>
          website
          <input
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={(e) => update("website", e.target.value)}
          />
        </label>
      </div>

      {/* ── スチE��プコンチE��チE── */}
      <div ref={sectionRef}>
        {step === 1 && (
          <section className={sectionClass}>
            <h2 className="font-serif text-lg text-charcoal">
              1. 店�E基本惁E��
            </h2>
            <Field error={fe.shopName}>
              <label className={labelClass}>店�E吁E*</label>
              <input
                className={fe.shopName ? inputErr : inputOk}
                value={form.shopName}
                onChange={(e) => update("shopName", e.target.value)}
              />
            </Field>
            <Field error={fe.shopAddress}>
              <label className={labelClass}>店�E所在地 *</label>
              <input
                className={fe.shopAddress ? inputErr : inputOk}
                value={form.shopAddress}
                onChange={(e) => update("shopAddress", e.target.value)}
                placeholder="都道府県・市区町村�E番地"
              />
            </Field>
            <Field>
              <label className={labelClass}>エリア�E�任意！E/label>
              <input
                className={inputOk}
                value={form.area}
                onChange={(e) => update("area", e.target.value)}
                placeholder="例：すすきの"
              />
            </Field>
            <Field error={fe.businessType}>
              <label className={labelClass}>業種 *</label>
              <input
                className={fe.businessType ? inputErr : inputOk}
                value={form.businessType}
                onChange={(e) => update("businessType", e.target.value)}
                placeholder="例：ガールズバ�E"
              />
            </Field>
            <Field error={fe.businessHours}>
              <label className={labelClass}>営業時間 *</label>
              <input
                className={fe.businessHours ? inputErr : inputOk}
                value={form.businessHours}
                onChange={(e) => update("businessHours", e.target.value)}
                placeholder="例！E0:00〜LAST"
              />
            </Field>
            <Field error={fe.shopPhone}>
              <label className={labelClass}>店�E電話番号 *</label>
              <input
                className={fe.shopPhone ? inputErr : inputOk}
                value={form.shopPhone}
                onChange={(e) => update("shopPhone", e.target.value)}
                inputMode="tel"
              />
            </Field>
          </section>
        )}

        {step === 2 && (
          <section className={sectionClass}>
            <h2 className="font-serif text-lg text-charcoal">2. 拁E��老E��報</h2>
            <Field error={fe.contactName}>
              <label className={labelClass}>拁E��老E�� *</label>
              <input
                className={fe.contactName ? inputErr : inputOk}
                value={form.contactName}
                onChange={(e) => update("contactName", e.target.value)}
              />
            </Field>
            <Field error={fe.contactPhone}>
              <label className={labelClass}>拁E��老E��話番号 *</label>
              <input
                className={fe.contactPhone ? inputErr : inputOk}
                value={form.contactPhone}
                onChange={(e) => update("contactPhone", e.target.value)}
                inputMode="tel"
              />
            </Field>
            <Field error={fe.contactEmail}>
              <label className={labelClass}>拁E��老E��ールアドレス *</label>
              <input
                className={fe.contactEmail ? inputErr : inputOk}
                type="email"
                value={form.contactEmail}
                onChange={(e) => update("contactEmail", e.target.value)}
              />
            </Field>
          </section>
        )}

        {step === 3 && (
          <section className={sectionClass}>
            <h2 className="font-serif text-lg text-charcoal">3. SNS・Web惁E��</h2>
            <p className="text-xs text-muted">
              URLは https:// から入力してください、E            </p>
            <Field error={fe.websiteUrl}>
              <label className={labelClass}>公式Webサイト！Enstagram等可�E�E*</label>
              <input
                className={fe.websiteUrl ? inputErr : inputOk}
                value={form.websiteUrl}
                onChange={(e) => update("websiteUrl", e.target.value)}
                placeholder="例：https://example.com"
              />
              <p className="mt-1 text-xs text-muted">
                店�Eの公式サイト、Instagram、X、TikTok等、店�Eを確認できるURLを�E力してください、E              </p>
            </Field>
            <Field>
              <label className={labelClass}>Instagram�E�任意！E/label>
              <input
                className={inputOk}
                value={form.instagramUrl}
                onChange={(e) => update("instagramUrl", e.target.value)}
              />
            </Field>
            <Field>
              <label className={labelClass}>X�E�任意！E/label>
              <input
                className={inputOk}
                value={form.xUrl}
                onChange={(e) => update("xUrl", e.target.value)}
              />
            </Field>
            <Field>
              <label className={labelClass}>TikTok�E�任意！E/label>
              <input
                className={inputOk}
                value={form.tiktokUrl}
                onChange={(e) => update("tiktokUrl", e.target.value)}
              />
            </Field>
            <Field>
              <label className={labelClass}>LINE公式アカウント（任意！E/label>
              <input
                className={inputOk}
                value={form.lineOfficialUrl}
                onChange={(e) => update("lineOfficialUrl", e.target.value)}
              />
            </Field>
            <Field>
              <label className={labelClass}>YouTube�E�任意！E/label>
              <input
                className={inputOk}
                value={form.youtubeUrl}
                onChange={(e) => update("youtubeUrl", e.target.value)}
              />
            </Field>
            <Field>
              <label className={labelClass}>そ�E他SNS�E�任意！E/label>
              <textarea
                className={inputOk}
                rows={3}
                value={form.otherSns}
                onChange={(e) => update("otherSns", e.target.value)}
              />
            </Field>
          </section>
        )}

        {step === 4 && (
          <section className={sectionClass}>
            <h2 className="font-serif text-lg text-charcoal">
              4. 営業・許可惁E��
            </h2>
            <Field error={fe.businessLicenseInfo}>
              <label className={labelClass}>営業許可に関する惁E�� *</label>
              <textarea
                className={fe.businessLicenseInfo ? inputErr : inputOk}
                rows={4}
                value={form.businessLicenseInfo}
                onChange={(e) =>
                  update("businessLicenseInfo", e.target.value)
                }
                placeholder="許可の種類�E番号・取得状況など"
              />
            </Field>
            <Field error={fe.openDate}>
              <label className={labelClass}>オープン日 *</label>
              <input
                className={fe.openDate ? inputErr : inputOk}
                type="date"
                value={form.openDate}
                onChange={(e) => update("openDate", e.target.value)}
              />
            </Field>
          </section>
        )}

        {step === 5 && (
          <section className={sectionClass}>
            <h2 className="font-serif text-lg text-charcoal">5. 希望プラン</h2>
            <p className="text-xs text-muted">
              審査承認後に最終確定します。この時点では料��請求�E確定しません、E            </p>
            {fe.requestedPlan && (
              <p className={errTextClass}>{fe.requestedPlan}</p>
            )}
            <div className="space-y-3">
              {JOB_PLANS.map((plan) => (
                <label
                  key={plan}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 ${
                    form.requestedPlan === plan
                      ? "border-gold bg-ivory"
                      : "border-gold/25 bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="requestedPlan"
                    checked={form.requestedPlan === plan}
                    onChange={() => update("requestedPlan", plan)}
                    className="mt-1"
                  />
                  <span>
                    <span className="block font-medium text-charcoal">
                      {plan === "light"
                        ? "ライチE
                        : plan === "standard"
                          ? "スタンダーチE
                          : "プレミアム"}
                    </span>
                    <span className="text-sm text-muted">
                      {formatPlanPriceLabel(plan)}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </section>
        )}

        {step === 6 && (
          <section className={sectionClass}>
            <h2 className="font-serif text-lg text-charcoal">6. 確認事頁E/h2>
            <Field error={fe.listingReason}>
              <label className={labelClass}>掲載を希望する琁E�� *</label>
              <textarea
                className={fe.listingReason ? inputErr : inputOk}
                rows={4}
                value={form.listingReason}
                onChange={(e) => update("listingReason", e.target.value)}
              />
            </Field>
            <Field error={fe.shopFeatures}>
              <label className={labelClass}>店�Eの特徴 *</label>
              <textarea
                className={fe.shopFeatures ? inputErr : inputOk}
                rows={4}
                value={form.shopFeatures}
                onChange={(e) => update("shopFeatures", e.target.value)}
              />
            </Field>
            <Field>
              <label className={labelClass}>補足事頁E��任意！E/label>
              <textarea
                className={inputOk}
                rows={3}
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
              />
            </Field>
            <div
              data-error-field={fe.consentAccuracy ? "1" : undefined}
            >
              <label
                className={`flex items-start gap-3 text-sm ${fe.consentAccuracy ? "text-red-700" : "text-charcoal"}`}
              >
                <input
                  type="checkbox"
                  checked={form.consentAccuracy}
                  onChange={(e) => update("consentAccuracy", e.target.checked)}
                  className="mt-1"
                />
                <span>
                  求人冁E��と実際の勤務条件に相違がなぁE��とに同意します、E
                </span>
              </label>
              {fe.consentAccuracy && (
                <p className={errTextClass}>{fe.consentAccuracy}</p>
              )}
            </div>
            <div
              data-error-field={fe.consentTerms ? "1" : undefined}
            >
              <label
                className={`flex items-start gap-3 text-sm ${fe.consentTerms ? "text-red-700" : "text-charcoal"}`}
              >
                <input
                  type="checkbox"
                  checked={form.consentTerms}
                  onChange={(e) => update("consentTerms", e.target.checked)}
                  className="mt-1"
                />
                <span>
                  <Link href="/terms-shop" className="text-gold-dark underline">
                    利用規紁E                  </Link>
                  、E                  <Link
                    href="/listing-criteria"
                    className="text-gold-dark underline"
                  >
                    掲載基溁E                  </Link>
                  、E                  <Link href="/privacy" className="text-gold-dark underline">
                    プライバシーポリシー
                  </Link>
                  に同意します、E
                </span>
              </label>
              {fe.consentTerms && (
                <p className={errTextClass}>{fe.consentTerms}</p>
              )}
            </div>
          </section>
        )}

        {step === 7 && (
          <section className={sectionClass}>
            <h2 className="font-serif text-lg text-charcoal">
              7. 添付賁E���E�任意！E            </h2>
            <p className="text-xs text-muted">
              店�E外観・店�E・営業許可証など�E�EPG / PNG / WebP / PDF、各5MBまで、最大8件�E�E            </p>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.pdf,image/*,application/pdf"
              multiple
              disabled={uploading}
              onChange={(e) => {
                void handleUpload(e.target.files);
                e.target.value = "";
              }}
            />
            {uploading && (
              <p className="text-sm text-muted">アチE�Eロード中...</p>
            )}
            <ul className="space-y-2 text-sm">
              {form.attachments.map((file) => (
                <li
                  key={file.url}
                  className="flex items-center justify-between gap-2 rounded-lg border border-gold/20 px-3 py-2"
                >
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate text-gold-dark underline"
                  >
                    {file.name}
                  </a>
                  <button
                    type="button"
                    className="shrink-0 text-xs text-muted"
                    onClick={() =>
                      update(
                        "attachments",
                        form.attachments.filter((item) => item.url !== file.url),
                      )
                    }
                  >
                    削除
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {step === 8 && (
          <section className={sectionClass}>
            <h2 className="font-serif text-lg text-charcoal">送信前�E確誁E/h2>
            <dl className="space-y-2 text-sm text-charcoal">
              <div>
                <dt className="text-muted">店�E吁E/dt>
                <dd>{form.shopName}</dd>
              </div>
              <div>
                <dt className="text-muted">所在地</dt>
                <dd>{form.shopAddress}</dd>
              </div>
              <div>
                <dt className="text-muted">業種</dt>
                <dd>{form.businessType}</dd>
              </div>
              <div>
                <dt className="text-muted">拁E��老E/dt>
                <dd>
                  {form.contactName} / {form.contactEmail}
                </dd>
              </div>
              <div>
                <dt className="text-muted">希望プラン</dt>
                <dd>{formatPlanPriceLabel(form.requestedPlan)}</dd>
              </div>
              <div>
                <dt className="text-muted">添仁E/dt>
                <dd>{form.attachments.length}件</dd>
              </div>
            </dl>
            <p className="text-xs text-muted">
              審査申請�Eみでは求人は公開されません。承認後に登録手続きへ進みます、E            </p>
          </section>
        )}
      </div>

      {/* ── ナビゲーションボタン ── */}
      <div className="flex flex-wrap gap-3">
        {step > 1 && (
          <button
            type="button"
            disabled={navigating || loading}
            onClick={goBack}
            className="rounded-full border border-gold/40 px-5 py-3 text-sm font-medium text-gold-dark disabled:opacity-60"
          >
            戻めE          </button>
        )}

        {step < STEPS.length && (
          <button
            type="button"
            disabled={navigating || loading}
            onClick={goNext}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold to-gold-dark px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {navigating ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeOpacity="0.3"
                  />
                  <path
                    d="M12 2a10 10 0 0 1 10 10"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
                確認中...
              </>
            ) : (
              "次へ"
            )}
          </button>
        )}

        {step === STEPS.length && (
          <button
            type="button"
            disabled={loading || navigating}
            onClick={() => void submit(false)}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold to-gold-dark px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeOpacity="0.3"
                  />
                  <path
                    d="M12 2a10 10 0 0 1 10 10"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
                送信中...
              </>
            ) : (
              "掲載審査を申し込む"
            )}
          </button>
        )}
      </div>
    </div>
  );
}
