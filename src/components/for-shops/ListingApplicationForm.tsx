"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatPlanPriceLabel, JOB_PLANS, type JobPlan } from "@/lib/job-plan";
import type { ListingAttachment, ListingDocumentMeta } from "@/lib/listing-application";

const DRAFT_KEY = "wnj-listing-application-draft-v1";
const inputBase = "w-full rounded-xl border bg-ivory px-4 py-3 text-base text-charcoal outline-none transition focus:ring-2";
const inputOk = `${inputBase} border-gold/30 focus:border-gold focus:ring-gold/20`;
const inputErr = `${inputBase} border-red-500 focus:border-red-500 focus:ring-red-200`;
const labelClass = "mb-1.5 block text-sm font-medium text-charcoal";
const sectionClass = "space-y-4 rounded-2xl border border-gold/25 bg-white p-5 shadow-sm sm:p-6";
const errTextClass = "mt-1.5 text-sm font-medium text-red-600";

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
  businessLicenseDocument: ListingDocumentMeta | null;
  entertainmentLicenseDocument: ListingDocumentMeta | null;
  lateNightAlcoholNotificationDocument: ListingDocumentMeta | null;
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
  businessLicenseDocument: null,
  entertainmentLicenseDocument: null,
  lateNightAlcoholNotificationDocument: null,
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

type FieldKey = keyof FormState;
type FieldError = Partial<Record<FieldKey, string>>;

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

function validateStep(step: number, form: FormState): FieldError {
  const errors: FieldError = {};
  if (step === 1) {
    if (!form.shopName.trim()) errors.shopName = "店舗名を入力してください。";
    if (!form.shopAddress.trim()) errors.shopAddress = "店舗住所を入力してください。";
    if (!form.businessType.trim()) errors.businessType = "業種を入力してください。";
    if (!form.businessHours.trim()) errors.businessHours = "営業時間を入力してください。";
    if (!form.shopPhone.trim()) errors.shopPhone = "店舗電話番号を入力してください。";
  }
  if (step === 2) {
    if (!form.contactName.trim()) errors.contactName = "担当者名を入力してください。";
    if (!form.contactPhone.trim()) errors.contactPhone = "担当者電話番号を入力してください。";
    if (!form.contactEmail.trim()) errors.contactEmail = "担当者メールアドレスを入力してください。";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail.trim())) errors.contactEmail = "メールアドレスの形式が正しくありません。";
  }
  if (step === 3) {
    const url = form.websiteUrl.trim();
    if (!url) errors.websiteUrl = "公式WebサイトまたはSNSのURLを入力してください。";
    else if (!/^https?:\/\/.+/i.test(url)) errors.websiteUrl = "正しいURLを入力してください。";
  }
  if (step === 4) {
    if (!form.businessLicenseDocument?.storagePath) errors.businessLicenseDocument = "営業許可証をアップロードしてください。";
    if (!form.openDate.trim()) errors.openDate = "オープン日を入力してください。";
  }
  if (step === 5 && !JOB_PLANS.includes(form.requestedPlan)) errors.requestedPlan = "希望プランを選択してください。";
  if (step === 6) {
    if (!form.listingReason.trim()) errors.listingReason = "掲載を希望する理由を入力してください。";
    if (!form.shopFeatures.trim()) errors.shopFeatures = "店舗の特徴を入力してください。";
    if (!form.consentAccuracy) errors.consentAccuracy = "求人内容と勤務条件に相違がないことへの同意が必要です。";
    if (!form.consentTerms) errors.consentTerms = "利用規約・掲載基準・プライバシーポリシーへの同意が必要です。";
  }
  return errors;
}

function Field({ error, children }: { error?: string; children: React.ReactNode }) {
  return <div data-error-field={error ? "1" : undefined}>{children}{error && <p className={errTextClass}>{error}</p>}</div>;
}

export function ListingApplicationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldError>({});
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const [draftId, setDraftId] = useState(() => crypto.randomUUID());
  const formOpenedAt = useRef(Date.now());

  useEffect(() => {
    const draft = loadDraft();
    const plan = searchParams.get("plan") as JobPlan | null;
    if (draft) setForm({ ...draft, requestedPlan: plan ?? draft.requestedPlan });
    else if (plan && JOB_PLANS.includes(plan)) setForm((c) => ({ ...c, requestedPlan: plan }));
    setHydrated(true);
  }, [searchParams]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
  }, [form, hydrated]);

  const progress = useMemo(() => Math.round((step / STEPS.length) * 100), [step]);
  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((c) => ({ ...c, [key]: value }));
    if (fieldErrors[key]) setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const uploadDoc = async (file: File, docType: string, key: keyof Pick<FormState, "businessLicenseDocument" | "entertainmentLicenseDocument" | "lateNightAlcoholNotificationDocument">) => {
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("draftId", draftId);
      body.append("docType", docType);
      const res = await fetch("/api/listing-applications/upload", { method: "POST", body });
      const data = (await res.json()) as { message?: string; draftId?: string; document?: ListingDocumentMeta };
      if (!res.ok || !data.document) throw new Error(data.message ?? "アップロードに失敗しました。");
      if (data.draftId) setDraftId(data.draftId);
      update(key, data.document as never);
    } catch (e) {
      setSubmitMessage(e instanceof Error ? e.message : "アップロードに失敗しました。");
    } finally {
      setUploading(false);
    }
  };

  const goNext = () => {
    const errors = validateStep(step, form);
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      setSubmitMessage("入力内容にエラーがあります。赤字の項目をご確認ください。");
      return;
    }
    setFieldErrors({});
    setSubmitMessage("");
    setStep((c) => Math.min(STEPS.length, c + 1));
  };

  const goBack = () => setStep((c) => Math.max(1, c - 1));

  const submit = async (confirmDuplicate = false) => {
    const errors = validateStep(6, form);
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      setSubmitMessage("入力内容にエラーがあります。赤字の項目をご確認ください。");
      setStep(6);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/listing-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, formOpenedAt: formOpenedAt.current, confirmDuplicate }),
      });
      const data = (await res.json()) as { message?: string; duplicateWarning?: boolean; applicationNumber?: string };
      if (res.status === 409 && data.duplicateWarning) {
        setDuplicateWarning(true);
        setSubmitMessage(data.message ?? "重複する申請の可能性があります。");
        return;
      }
      if (!res.ok) throw new Error(data.message ?? "申請に失敗しました。");
      window.localStorage.removeItem(DRAFT_KEY);
      router.push(`/for-shops/apply/complete?no=${encodeURIComponent(data.applicationNumber ?? "")}`);
    } catch (e) {
      setSubmitMessage(e instanceof Error ? e.message : "申請に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  if (!hydrated) return <p className="rounded-xl border border-gold/20 bg-white px-4 py-6 text-sm text-muted">読み込み中...</p>;

  const fe = fieldErrors;
  return <div className="space-y-5"><div><div className="mb-2 flex items-center justify-between text-xs text-muted"><span>ステップ {step} / {STEPS.length}：{STEPS[step - 1]?.title}</span><span>{progress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-gold/15"><div className="h-full rounded-full bg-gradient-to-r from-gold to-gold-dark transition-all duration-300" style={{ width: `${progress}%` }} /></div></div>
    {submitMessage && <p role="alert" className={`rounded-xl border px-4 py-3 text-sm font-medium ${Object.keys(fe).length ? "border-red-300 bg-red-50 text-red-700" : "border-gold/30 bg-white text-charcoal"}`}>{submitMessage}</p>}
    {duplicateWarning && <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-charcoal"><p>同じ店舗名またはメールアドレスの申請が見つかりました。内容を確認してください。</p><button type="button" disabled={loading} onClick={() => void submit(true)} className="mt-3 rounded-full bg-charcoal px-4 py-2 text-xs font-medium text-white disabled:opacity-60">内容を確認して送信する</button></div>}
    <div>{step===1&&<section className={sectionClass}><h2 className="font-serif text-lg text-charcoal">1. 店舗基本情報</h2><Field error={fe.shopName}><label className={labelClass}>店舗名 *</label><input className={fe.shopName?inputErr:inputOk} value={form.shopName} onChange={(e)=>update("shopName",e.target.value)} /></Field><Field error={fe.shopAddress}><label className={labelClass}>店舗住所 *</label><input className={fe.shopAddress?inputErr:inputOk} value={form.shopAddress} onChange={(e)=>update("shopAddress",e.target.value)} placeholder="例：札幌市中央区南◯条西◯丁目" /></Field><Field><label className={labelClass}>エリア（任意）</label><input className={inputOk} value={form.area} onChange={(e)=>update("area",e.target.value)} placeholder="例：すすきの" /></Field><Field error={fe.businessType}><label className={labelClass}>業種 *</label><input className={fe.businessType?inputErr:inputOk} value={form.businessType} onChange={(e)=>update("businessType",e.target.value)} placeholder="例：ニュークラブ"/></Field><Field error={fe.businessHours}><label className={labelClass}>営業時間 *</label><input className={fe.businessHours?inputErr:inputOk} value={form.businessHours} onChange={(e)=>update("businessHours",e.target.value)} placeholder="例：20:00〜LAST"/></Field><Field error={fe.shopPhone}><label className={labelClass}>店舗電話番号 *</label><input className={fe.shopPhone?inputErr:inputOk} value={form.shopPhone} onChange={(e)=>update("shopPhone",e.target.value)} inputMode="tel"/></Field></section>}
    {step===2&&<section className={sectionClass}><h2 className="font-serif text-lg text-charcoal">2. 担当者情報</h2><Field error={fe.contactName}><label className={labelClass}>担当者名 *</label><input className={fe.contactName?inputErr:inputOk} value={form.contactName} onChange={(e)=>update("contactName",e.target.value)} /></Field><Field error={fe.contactPhone}><label className={labelClass}>担当者電話番号 *</label><input className={fe.contactPhone?inputErr:inputOk} value={form.contactPhone} onChange={(e)=>update("contactPhone",e.target.value)} inputMode="tel"/></Field><Field error={fe.contactEmail}><label className={labelClass}>担当者メールアドレス *</label><input className={fe.contactEmail?inputErr:inputOk} value={form.contactEmail} onChange={(e)=>update("contactEmail",e.target.value)} type="email"/></Field></section>}
    {step===3&&<section className={sectionClass}><h2 className="font-serif text-lg text-charcoal">3. SNS・Web情報</h2><p className="text-xs text-muted">URLは https:// から始まる形式で入力してください。</p><Field error={fe.websiteUrl}><label className={labelClass}>公式Webサイト（Instagram等可） *</label><input className={fe.websiteUrl?inputErr:inputOk} value={form.websiteUrl} onChange={(e)=>update("websiteUrl",e.target.value)} placeholder="例：https://example.com"/><p className="mt-1 text-xs text-muted">店舗の確認ができる公式サイトやSNS（Instagram / X / TikTok等）のURLを入力してください。</p></Field><Field><label className={labelClass}>Instagram（任意）</label><input className={inputOk} value={form.instagramUrl} onChange={(e)=>update("instagramUrl",e.target.value)} /></Field><Field><label className={labelClass}>X（任意）</label><input className={inputOk} value={form.xUrl} onChange={(e)=>update("xUrl",e.target.value)} /></Field><Field><label className={labelClass}>TikTok（任意）</label><input className={inputOk} value={form.tiktokUrl} onChange={(e)=>update("tiktokUrl",e.target.value)} /></Field><Field><label className={labelClass}>LINE公式アカウント（任意）</label><input className={inputOk} value={form.lineOfficialUrl} onChange={(e)=>update("lineOfficialUrl",e.target.value)} /></Field><Field><label className={labelClass}>YouTube（任意）</label><input className={inputOk} value={form.youtubeUrl} onChange={(e)=>update("youtubeUrl",e.target.value)} /></Field><Field><label className={labelClass}>その他SNS（任意）</label><textarea className={inputOk} rows={3} value={form.otherSns} onChange={(e)=>update("otherSns",e.target.value)} /></Field></section>}
    {step===4&&<section className={sectionClass}><h2 className="font-serif text-lg text-charcoal">4. 営業・許可情報</h2><Field error={fe.businessLicenseDocument}><label className={labelClass}>営業許可証 *</label><p className="mb-1 text-xs text-muted">店舗の営業許可証をアップロードしてください。</p><input className={inputOk} type="file" accept=".pdf,.jpeg,.jpg,.png,.heic,image/jpeg,image/png,image/heic,application/pdf" onChange={(e)=>{const f=e.target.files?.[0];if(f)void uploadDoc(f,"business-license","businessLicenseDocument");}}/></Field><Field><label className={labelClass}>風俗営業許可証（社交飲食店営業許可証）（任意）</label><input className={inputOk} type="file" accept=".pdf,.jpeg,.jpg,.png,.heic,image/jpeg,image/png,image/heic,application/pdf" onChange={(e)=>{const f=e.target.files?.[0];if(f)void uploadDoc(f,"entertainment-license","entertainmentLicenseDocument");}}/></Field><Field><label className={labelClass}>深夜酒類提供飲食店営業・開始届出（受領書）（任意）</label><input className={inputOk} type="file" accept=".pdf,.jpeg,.jpg,.png,.heic,image/jpeg,image/png,image/heic,application/pdf" onChange={(e)=>{const f=e.target.files?.[0];if(f)void uploadDoc(f,"late-night-alcohol-notification","lateNightAlcoholNotificationDocument");}}/></Field><Field error={fe.openDate}><label className={labelClass}>オープン日 *</label><input className={fe.openDate?inputErr:inputOk} type="date" value={form.openDate} onChange={(e)=>update("openDate",e.target.value)} /></Field></section>}
    {step===5&&<section className={sectionClass}><h2 className="font-serif text-lg text-charcoal">5. 希望プラン</h2><p className="text-xs text-muted">審査承認後に最終確定します。この時点では料金請求は確定しません。</p></section>}
    {step===6&&<section className={sectionClass}><h2 className="font-serif text-lg text-charcoal">6. 確認事項</h2><Field error={fe.listingReason}><label className={labelClass}>掲載を希望する理由 *</label><textarea className={fe.listingReason?inputErr:inputOk} rows={4} value={form.listingReason} onChange={(e)=>update("listingReason",e.target.value)} /></Field><Field error={fe.shopFeatures}><label className={labelClass}>店舗の特徴 *</label><textarea className={fe.shopFeatures?inputErr:inputOk} rows={4} value={form.shopFeatures} onChange={(e)=>update("shopFeatures",e.target.value)} /></Field><Field><label className={labelClass}>補足事項（任意）</label><textarea className={inputOk} rows={3} value={form.notes} onChange={(e)=>update("notes",e.target.value)} /></Field></section>}
    {step===8&&<section className={sectionClass}><h2 className="font-serif text-lg text-charcoal">送信前の確認</h2><p className="text-sm">店舗名: {form.shopName}</p></section>}
    </div>
    <div className="flex flex-wrap gap-3">{step>1&&<button type="button" onClick={goBack} disabled={loading||uploading} className="rounded-full border border-gold/40 px-5 py-3 text-sm font-medium text-gold-dark disabled:opacity-60">戻る</button>}{step<STEPS.length&&<button type="button" onClick={goNext} disabled={loading||uploading} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold to-gold-dark px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">次へ</button>}{step===STEPS.length&&<button type="button" onClick={()=>void submit(false)} disabled={loading||uploading} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold to-gold-dark px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{loading?"送信中...":"審査を申し込む"}</button>}</div></div>;
}
