"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  formatPlanPriceLabel,
  JOB_PLANS,
  type JobPlan,
} from "@/lib/job-plan";
import type { ListingAttachment } from "@/lib/listing-application";

const DRAFT_KEY = "wnj-listing-application-draft-v1";

const inputClass =
  "w-full rounded-xl border border-gold/30 bg-ivory px-4 py-3 text-base text-charcoal outline-none focus:border-gold focus:ring-2 focus:ring-gold/20";
const labelClass = "mb-1.5 block text-sm font-medium text-charcoal";
const sectionClass =
  "space-y-4 rounded-2xl border border-gold/25 bg-white p-5 shadow-sm sm:p-6";

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
  { id: 1, title: "店舗基本情報" },
  { id: 2, title: "担当者情報" },
  { id: 3, title: "SNS・Web情報" },
  { id: 4, title: "営業・許可情報" },
  { id: 5, title: "希望プラン" },
  { id: 6, title: "確認事項" },
  { id: 7, title: "添付資料" },
  { id: 8, title: "内容確認" },
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

export function ListingApplicationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const [draftId, setDraftId] = useState(() => crypto.randomUUID());
  const formOpenedAt = useRef(Date.now());
  const submittingRef = useRef(false);

  useEffect(() => {
    const draft = loadDraft();
    const planParam = searchParams.get("plan");
    const plan =
      planParam === "light" ||
      planParam === "standard" ||
      planParam === "premium"
        ? planParam
        : null;

    if (draft) {
      setForm({
        ...draft,
        requestedPlan: plan ?? draft.requestedPlan,
      });
    } else if (plan) {
      setForm((current) => ({ ...current, requestedPlan: plan }));
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
    setForm((current) => ({ ...current, [key]: value }));
  }

  function validateStep(currentStep: number): string | null {
    if (currentStep === 1) {
      if (!form.shopName.trim()) return "店舗名を入力してください。";
      if (!form.shopAddress.trim()) return "店舗所在地を入力してください。";
      if (!form.businessType.trim()) return "業種を入力してください。";
      if (!form.businessHours.trim()) return "営業時間を入力してください。";
      if (!form.shopPhone.trim()) return "店舗電話番号を入力してください。";
    }
    if (currentStep === 2) {
      if (!form.contactName.trim()) return "担当者名を入力してください。";
      if (!form.contactPhone.trim()) return "担当者電話番号を入力してください。";
      if (!form.contactEmail.trim()) return "担当者メールアドレスを入力してください。";
    }
    if (currentStep === 3) {
      if (!form.websiteUrl.trim()) return "公式Webサイトを入力してください。";
      if (!form.instagramUrl.trim()) return "Instagramを入力してください。";
      if (!form.xUrl.trim()) return "Xを入力してください。";
      if (!form.tiktokUrl.trim()) return "TikTokを入力してください。";
      if (!form.lineOfficialUrl.trim()) return "LINE公式アカウントを入力してください。";
    }
    if (currentStep === 4) {
      if (!form.businessLicenseInfo.trim()) {
        return "営業許可に関する情報を入力してください。";
      }
      if (!form.openDate.trim()) return "オープン日を入力してください。";
    }
    if (currentStep === 5) {
      if (!JOB_PLANS.includes(form.requestedPlan)) {
        return "希望プランを選択してください。";
      }
    }
    if (currentStep === 6) {
      if (!form.listingReason.trim()) return "掲載を希望する理由を入力してください。";
      if (!form.shopFeatures.trim()) return "店舗の特徴を入力してください。";
      if (!form.consentAccuracy) {
        return "求人内容と勤務条件に相違がないことへの同意が必要です。";
      }
      if (!form.consentTerms) {
        return "利用規約等への同意が必要です。";
      }
    }
    return null;
  }

  function goNext() {
    const error = validateStep(step);
    if (error) {
      setMessage(error);
      return;
    }
    setMessage("");
    setStep((current) => Math.min(STEPS.length, current + 1));
  }

  function goBack() {
    setMessage("");
    setStep((current) => Math.max(1, current - 1));
  }

  async function handleUpload(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    if (form.attachments.length + fileList.length > 8) {
      setMessage("添付資料は最大8件までです。");
      return;
    }

    setUploading(true);
    setMessage("");
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
        if (!response.ok) throw new Error(data.message ?? "アップロードに失敗しました。");
        if (data.draftId) setDraftId(data.draftId);
        if (data.attachment) uploaded.push(data.attachment);
      }
      update("attachments", [...form.attachments, ...uploaded]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "アップロードに失敗しました。");
    } finally {
      setUploading(false);
    }
  }

  async function submit(confirmDuplicate = false) {
    if (submittingRef.current) return;
    const error = validateStep(6);
    if (error) {
      setMessage(error);
      setStep(6);
      return;
    }

    submittingRef.current = true;
    setLoading(true);
    setMessage("");

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
        setMessage(data.message ?? "重複の可能性があります。");
        return;
      }

      if (!response.ok) {
        throw new Error(data.message ?? "送信に失敗しました。");
      }

      window.localStorage.removeItem(DRAFT_KEY);
      router.push(
        `/for-shops/apply/complete?no=${encodeURIComponent(data.applicationNumber ?? "")}`,
      );
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "送信に失敗しました。");
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

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 flex items-center justify-between text-xs text-muted">
          <span>
            ステップ {step} / {STEPS.length}：{STEPS[step - 1]?.title}
          </span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gold/15">
          <div
            className="h-full rounded-full bg-gradient-to-r from-gold to-gold-dark transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {message && (
        <p className="rounded-xl border border-gold/30 bg-white px-4 py-3 text-sm text-charcoal">
          {message}
        </p>
      )}

      {duplicateWarning && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-charcoal">
          <p>同じ店舗またはメールでの申請が既にあります。</p>
          <button
            type="button"
            disabled={loading}
            onClick={() => void submit(true)}
            className="mt-3 rounded-full bg-charcoal px-4 py-2 text-xs font-medium text-white"
          >
            内容を確認したので送信する
          </button>
        </div>
      )}

      {/* honeypot */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden>
        <label>
          website
          <input
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={(event) => update("website", event.target.value)}
          />
        </label>
      </div>

      {step === 1 && (
        <section className={sectionClass}>
          <h2 className="font-serif text-lg text-charcoal">1. 店舗基本情報</h2>
          <div>
            <label className={labelClass}>店舗名 *</label>
            <input className={inputClass} value={form.shopName} onChange={(e) => update("shopName", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>店舗所在地 *</label>
            <input className={inputClass} value={form.shopAddress} onChange={(e) => update("shopAddress", e.target.value)} placeholder="都道府県・市区町村・番地" />
          </div>
          <div>
            <label className={labelClass}>エリア（任意）</label>
            <input className={inputClass} value={form.area} onChange={(e) => update("area", e.target.value)} placeholder="例：すすきの" />
          </div>
          <div>
            <label className={labelClass}>業種 *</label>
            <input className={inputClass} value={form.businessType} onChange={(e) => update("businessType", e.target.value)} placeholder="例：ガールズバー" />
          </div>
          <div>
            <label className={labelClass}>営業時間 *</label>
            <input className={inputClass} value={form.businessHours} onChange={(e) => update("businessHours", e.target.value)} placeholder="例：20:00〜LAST" />
          </div>
          <div>
            <label className={labelClass}>店舗電話番号 *</label>
            <input className={inputClass} value={form.shopPhone} onChange={(e) => update("shopPhone", e.target.value)} inputMode="tel" />
          </div>
        </section>
      )}

      {step === 2 && (
        <section className={sectionClass}>
          <h2 className="font-serif text-lg text-charcoal">2. 担当者情報</h2>
          <div>
            <label className={labelClass}>担当者名 *</label>
            <input className={inputClass} value={form.contactName} onChange={(e) => update("contactName", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>担当者電話番号 *</label>
            <input className={inputClass} value={form.contactPhone} onChange={(e) => update("contactPhone", e.target.value)} inputMode="tel" />
          </div>
          <div>
            <label className={labelClass}>担当者メールアドレス *</label>
            <input className={inputClass} type="email" value={form.contactEmail} onChange={(e) => update("contactEmail", e.target.value)} />
          </div>
        </section>
      )}

      {step === 3 && (
        <section className={sectionClass}>
          <h2 className="font-serif text-lg text-charcoal">3. SNS・Web情報</h2>
          <p className="text-xs text-muted">URLは https:// から入力してください。</p>
          <div>
            <label className={labelClass}>公式Webサイト *</label>
            <input className={inputClass} value={form.websiteUrl} onChange={(e) => update("websiteUrl", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Instagram *</label>
            <input className={inputClass} value={form.instagramUrl} onChange={(e) => update("instagramUrl", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>X *</label>
            <input className={inputClass} value={form.xUrl} onChange={(e) => update("xUrl", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>TikTok *</label>
            <input className={inputClass} value={form.tiktokUrl} onChange={(e) => update("tiktokUrl", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>LINE公式アカウント *</label>
            <input className={inputClass} value={form.lineOfficialUrl} onChange={(e) => update("lineOfficialUrl", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>YouTube（任意）</label>
            <input className={inputClass} value={form.youtubeUrl} onChange={(e) => update("youtubeUrl", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>その他SNS（任意）</label>
            <textarea className={inputClass} rows={3} value={form.otherSns} onChange={(e) => update("otherSns", e.target.value)} />
          </div>
        </section>
      )}

      {step === 4 && (
        <section className={sectionClass}>
          <h2 className="font-serif text-lg text-charcoal">4. 営業・許可情報</h2>
          <div>
            <label className={labelClass}>営業許可に関する情報 *</label>
            <textarea
              className={inputClass}
              rows={4}
              value={form.businessLicenseInfo}
              onChange={(e) => update("businessLicenseInfo", e.target.value)}
              placeholder="許可の種類・番号・取得状況など"
            />
          </div>
          <div>
            <label className={labelClass}>オープン日 *</label>
            <input className={inputClass} type="date" value={form.openDate} onChange={(e) => update("openDate", e.target.value)} />
          </div>
        </section>
      )}

      {step === 5 && (
        <section className={sectionClass}>
          <h2 className="font-serif text-lg text-charcoal">5. 希望プラン</h2>
          <p className="text-xs text-muted">
            審査承認後に管理者または店舗側で最終確定できます。この時点では料金請求は確定しません。
          </p>
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
                      ? "ライト"
                      : plan === "standard"
                        ? "スタンダード"
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
          <h2 className="font-serif text-lg text-charcoal">6. 確認事項</h2>
          <div>
            <label className={labelClass}>掲載を希望する理由 *</label>
            <textarea className={inputClass} rows={4} value={form.listingReason} onChange={(e) => update("listingReason", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>店舗の特徴 *</label>
            <textarea className={inputClass} rows={4} value={form.shopFeatures} onChange={(e) => update("shopFeatures", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>補足事項（任意）</label>
            <textarea className={inputClass} rows={3} value={form.notes} onChange={(e) => update("notes", e.target.value)} />
          </div>
          <label className="flex items-start gap-3 text-sm text-charcoal">
            <input
              type="checkbox"
              checked={form.consentAccuracy}
              onChange={(e) => update("consentAccuracy", e.target.checked)}
              className="mt-1"
            />
            <span>
              求人内容と実際の勤務条件に相違がないことに同意します。*
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm text-charcoal">
            <input
              type="checkbox"
              checked={form.consentTerms}
              onChange={(e) => update("consentTerms", e.target.checked)}
              className="mt-1"
            />
            <span>
              <Link href="/terms-shop" className="text-gold-dark underline">
                利用規約
              </Link>
              、
              <Link href="/listing-criteria" className="text-gold-dark underline">
                掲載基準
              </Link>
              、
              <Link href="/privacy" className="text-gold-dark underline">
                プライバシーポリシー
              </Link>
              に同意します。*
            </span>
          </label>
        </section>
      )}

      {step === 7 && (
        <section className={sectionClass}>
          <h2 className="font-serif text-lg text-charcoal">7. 添付資料（任意）</h2>
          <p className="text-xs text-muted">
            店舗外観・店内・営業許可証など（JPG / PNG / WebP / PDF、各5MBまで、最大8件）
          </p>
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
          {uploading && <p className="text-sm text-muted">アップロード中...</p>}
          <ul className="space-y-2 text-sm">
            {form.attachments.map((file) => (
              <li
                key={file.url}
                className="flex items-center justify-between gap-2 rounded-lg border border-gold/20 px-3 py-2"
              >
                <a href={file.url} target="_blank" rel="noopener noreferrer" className="truncate text-gold-dark underline">
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
          <h2 className="font-serif text-lg text-charcoal">送信前の確認</h2>
          <dl className="space-y-2 text-sm text-charcoal">
            <div><dt className="text-muted">店舗名</dt><dd>{form.shopName}</dd></div>
            <div><dt className="text-muted">所在地</dt><dd>{form.shopAddress}</dd></div>
            <div><dt className="text-muted">業種</dt><dd>{form.businessType}</dd></div>
            <div><dt className="text-muted">担当者</dt><dd>{form.contactName} / {form.contactEmail}</dd></div>
            <div><dt className="text-muted">希望プラン</dt><dd>{formatPlanPriceLabel(form.requestedPlan)}</dd></div>
            <div><dt className="text-muted">添付</dt><dd>{form.attachments.length}件</dd></div>
          </dl>
          <p className="text-xs text-muted">
            審査申請のみでは求人は公開されません。承認後に登録手続きへ進みます。
          </p>
        </section>
      )}

      <div className="flex flex-wrap gap-3">
        {step > 1 && (
          <button
            type="button"
            onClick={goBack}
            className="rounded-full border border-gold/40 px-5 py-3 text-sm font-medium text-gold-dark"
          >
            戻る
          </button>
        )}
        {step < STEPS.length && (
          <button
            type="button"
            onClick={goNext}
            className="rounded-full bg-gradient-to-r from-gold to-gold-dark px-5 py-3 text-sm font-semibold text-white"
          >
            次へ
          </button>
        )}
        {step === STEPS.length && (
          <button
            type="button"
            disabled={loading}
            onClick={() => void submit(false)}
            className="rounded-full bg-gradient-to-r from-gold to-gold-dark px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "送信中..." : "掲載審査を申し込む"}
          </button>
        )}
      </div>
    </div>
  );
}
