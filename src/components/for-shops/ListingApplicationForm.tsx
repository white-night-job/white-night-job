"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  formatPlanPriceLabel,
  JOB_PLANS,
  type JobPlan,
} from "@/lib/job-plan";
import type {
  ListingAttachment,
  ListingDocumentMeta,
} from "@/lib/listing-application";

const DRAFT_KEY = "wnj-listing-application-draft-v1";

// ?????????
const inputBase =
  "w-full rounded-xl border bg-ivory px-4 py-3 text-base text-charcoal outline-none transition focus:ring-2";
const inputOk = `${inputBase} border-gold/30 focus:border-gold focus:ring-gold/20`;
const inputErr = `${inputBase} border-red-500 focus:border-red-500 focus:ring-red-200`;

const labelClass = "mb-1.5 block text-sm font-medium text-charcoal";
const sectionClass =
  "space-y-4 rounded-2xl border border-gold/25 bg-white p-5 shadow-sm sm:p-6";
const errTextClass = "mt-1.5 text-sm font-medium text-red-600";

// ????????????????????????????
type FieldKey = keyof FormState;

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

const STEPS = [
  { id: 1, title: "??????" },
  { id: 2, title: "?????" },
  { id: 3, title: "SNS?Web??" },
  { id: 4, title: "???????" },
  { id: 5, title: "?????" },
  { id: 6, title: "????" },
  { id: 7, title: "????" },
  { id: 8, title: "????" },
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

/** ???????????????????? */
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
  // ?????? DOM ????????????
  setTimeout(() => {
    const el = containerRef.current?.querySelector<HTMLElement>(
      "[data-error-field] input, [data-error-field] textarea, [data-error-field] select",
    );
    el?.focus({ preventScroll: true });
  }, 80);
}

// ---- per-step ??????????????????? ----
function validateStep(step: number, form: FormState): FieldError {
  const errors: FieldError = {};

  if (step === 1) {
    if (!form.shopName.trim()) errors.shopName = "?????????????";
    if (!form.shopAddress.trim()) errors.shopAddress = "???????????????";
    if (!form.businessType.trim()) errors.businessType = "????????????";
    if (!form.businessHours.trim()) errors.businessHours = "??????????????";
    if (!form.shopPhone.trim()) errors.shopPhone = "????????????????";
  }
  if (step === 2) {
    if (!form.contactName.trim()) errors.contactName = "??????????????";
    if (!form.contactPhone.trim()) errors.contactPhone = "?????????????????";
    if (!form.contactEmail.trim()) {
      errors.contactEmail = "????????????????????";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail.trim())) {
      errors.contactEmail = "????????????????????";
    }
  }
  if (step === 3) {
    const url = form.websiteUrl.trim();
    if (!url) {
      errors.websiteUrl = "??Web??????SNS?URL??????????";
    } else if (!/^https?:\/\/.+/i.test(url)) {
      errors.websiteUrl = "???URL??????????";
    }
  }
  if (step === 4) {
    if (!form.businessLicenseDocument?.storagePath)
      errors.businessLicenseDocument = "Please upload your business license";
    if (!form.openDate.trim()) errors.openDate = "???????????????";
  }
  if (step === 5) {
    if (!JOB_PLANS.includes(form.requestedPlan))
      errors.requestedPlan = "???????????????";
  }
  if (step === 6) {
    if (!form.listingReason.trim())
      errors.listingReason = "???????????????????";
    if (!form.shopFeatures.trim())
      errors.shopFeatures = "???????????????";
    if (!form.consentAccuracy)
      errors.consentAccuracy = "???????????????????????????";
    if (!form.consentTerms)
      errors.consentTerms = "??????????????????????????????";
  }
  return errors;
}

function hasErrors(errors: FieldError): boolean {
  return Object.keys(errors).length > 0;
}

// ?????1????????????????????????
function Field({
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
  const [navigating, setNavigating] = useState(false); // ????/??????????
  const [uploading, setUploading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState(""); // ???????
  const [fieldErrors, setFieldErrors] = useState<FieldError>({});
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const [draftId, setDraftId] = useState(() => crypto.randomUUID());
  const formOpenedAt = useRef(Date.now());
  const submittingRef = useRef(false);
  const stepHeadRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const businessLicenseInputRef = useRef<HTMLInputElement>(null);
  const entertainmentLicenseInputRef = useRef<HTMLInputElement>(null);
  const lateNightInputRef = useRef<HTMLInputElement>(null);

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
    // ????????????????????????
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
      setSubmitMessage("????????????????????????????");
      // ???????????
      scrollToStepHead();
      focusFirstError(sectionRef);
      setNavigating(false);
      return;
    }

    setFieldErrors({});
    setSubmitMessage("");
    setStep((c) => Math.min(STEPS.length, c + 1));
    // ????????????step state ????????????
    requestAnimationFrame(() => {
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

  async function uploadSingleDocument(options: {
    file: File;
    docType:
      | "business-license"
      | "entertainment-license"
      | "late-night-alcohol-notification";
    key:
      | "businessLicenseDocument"
      | "entertainmentLicenseDocument"
      | "lateNightAlcoholNotificationDocument";
  }) {
    setUploading(true);
    setSubmitMessage("");
    try {
      const body = new FormData();
      body.append("file", options.file);
      body.append("draftId", draftId);
      body.append("docType", options.docType);
      const response = await fetch("/api/listing-applications/upload", {
        method: "POST",
        body,
      });
      const data = (await response.json()) as {
        message?: string;
        draftId?: string;
        document?: ListingDocumentMeta;
      };
      if (!response.ok || !data.document) {
        throw new Error(data.message ?? "??????????????");
      }
      if (data.draftId) setDraftId(data.draftId);
      update(options.key, data.document);
    } catch (error) {
      setSubmitMessage(
        error instanceof Error ? error.message : "??????????????",
      );
      scrollToStepHead();
    } finally {
      setUploading(false);
    }
  }

  async function handleUpload(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    if (form.attachments.length + fileList.length > 8) {
      setSubmitMessage("???????8??????");
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
        body.append("docType", "general-attachment");
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
          throw new Error(data.message ?? "??????????????");
        if (data.draftId) setDraftId(data.draftId);
        if (data.attachment) uploaded.push(data.attachment);
      }
      update("attachments", [...form.attachments, ...uploaded]);
    } catch (error) {
      setSubmitMessage(
        error instanceof Error ? error.message : "??????????????",
      );
      scrollToStepHead();
    } finally {
      setUploading(false);
    }
  }

  async function submit(confirmDuplicate = false) {
    if (submittingRef.current) return;

    // ????6????????????????
    const errors = validateStep(6, form);
    if (hasErrors(errors)) {
      setFieldErrors(errors);
      setSubmitMessage("????????????????????????????");
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
        setSubmitMessage(data.message ?? "????????????");
        scrollToStepHead();
        return;
      }

      if (!response.ok) {
        throw new Error(data.message ?? "??????????");
      }

      window.localStorage.removeItem(DRAFT_KEY);
      router.push(
        `/for-shops/apply/complete?no=${encodeURIComponent(data.applicationNumber ?? "")}`,
      );
    } catch (err) {
      setSubmitMessage(
        err instanceof Error ? err.message : "??????????",
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
        ?????...
      </p>
    );
  }

  const fe = fieldErrors;

  return (
    <div className="space-y-5">
      {/* ?? ???????????????? ?? */}
      <div
        id="application-steps"
        ref={stepHeadRef}
        style={{ scrollMarginTop: `${SCROLL_MARGIN}px` }}
      >
        <div className="mb-2 flex items-center justify-between text-xs text-muted">
          <span>
            ???? {step} / {STEPS.length}?{STEPS[step - 1]?.title}
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

      {/* ?? ???????????? ?? */}
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

      {/* ?? ???? ?? */}
      {duplicateWarning && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-charcoal">
          <p>??????????????????????</p>
          <button
            type="button"
            disabled={loading}
            onClick={() => void submit(true)}
            className="mt-3 rounded-full bg-charcoal px-4 py-2 text-xs font-medium text-white disabled:opacity-60"
          >
            ?????????????
          </button>
        </div>
      )}

      {/* ?? honeypot ?? */}
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

      {/* ?? ????????? ?? */}
      <div ref={sectionRef}>
        {step === 1 && (
          <section className={sectionClass}>
            <h2 className="font-serif text-lg text-charcoal">
              1. ??????
            </h2>
            <Field error={fe.shopName}>
              <label className={labelClass}>??? *</label>
              <input
                className={fe.shopName ? inputErr : inputOk}
                value={form.shopName}
                onChange={(e) => update("shopName", e.target.value)}
              />
            </Field>
            <Field error={fe.shopAddress}>
              <label className={labelClass}>????? *</label>
              <input
                className={fe.shopAddress ? inputErr : inputOk}
                value={form.shopAddress}
                onChange={(e) => update("shopAddress", e.target.value)}
                placeholder="????????????"
              />
            </Field>
            <Field>
              <label className={labelClass}>???????</label>
              <input
                className={inputOk}
                value={form.area}
                onChange={(e) => update("area", e.target.value)}
                placeholder="??????"
              />
            </Field>
            <Field error={fe.businessType}>
              <label className={labelClass}>?? *</label>
              <input
                className={fe.businessType ? inputErr : inputOk}
                value={form.businessType}
                onChange={(e) => update("businessType", e.target.value)}
                placeholder="????????"
              />
            </Field>
            <Field error={fe.businessHours}>
              <label className={labelClass}>???? *</label>
              <input
                className={fe.businessHours ? inputErr : inputOk}
                value={form.businessHours}
                onChange={(e) => update("businessHours", e.target.value)}
                placeholder="??20:00?LAST"
              />
            </Field>
            <Field error={fe.shopPhone}>
              <label className={labelClass}>?????? *</label>
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
            <h2 className="font-serif text-lg text-charcoal">2. ?????</h2>
            <Field error={fe.contactName}>
              <label className={labelClass}>???? *</label>
              <input
                className={fe.contactName ? inputErr : inputOk}
                value={form.contactName}
                onChange={(e) => update("contactName", e.target.value)}
              />
            </Field>
            <Field error={fe.contactPhone}>
              <label className={labelClass}>??????? *</label>
              <input
                className={fe.contactPhone ? inputErr : inputOk}
                value={form.contactPhone}
                onChange={(e) => update("contactPhone", e.target.value)}
                inputMode="tel"
              />
            </Field>
            <Field error={fe.contactEmail}>
              <label className={labelClass}>?????????? *</label>
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
            <h2 className="font-serif text-lg text-charcoal">3. SNS?Web??</h2>
            <p className="text-xs text-muted">
              URL? https:// ???????????
            </p>
            <Field error={fe.websiteUrl}>
              <label className={labelClass}>??Web????Instagram??? *</label>
              <input
                className={fe.websiteUrl ? inputErr : inputOk}
                value={form.websiteUrl}
                onChange={(e) => update("websiteUrl", e.target.value)}
                placeholder="??https://example.com"
              />
              <p className="mt-1 text-xs text-muted">
                ?????????Instagram?X?TikTok??????????URL??????????
              </p>
            </Field>
            <Field>
              <label className={labelClass}>Instagram????</label>
              <input
                className={inputOk}
                value={form.instagramUrl}
                onChange={(e) => update("instagramUrl", e.target.value)}
              />
            </Field>
            <Field>
              <label className={labelClass}>X????</label>
              <input
                className={inputOk}
                value={form.xUrl}
                onChange={(e) => update("xUrl", e.target.value)}
              />
            </Field>
            <Field>
              <label className={labelClass}>TikTok????</label>
              <input
                className={inputOk}
                value={form.tiktokUrl}
                onChange={(e) => update("tiktokUrl", e.target.value)}
              />
            </Field>
            <Field>
              <label className={labelClass}>LINE???????????</label>
              <input
                className={inputOk}
                value={form.lineOfficialUrl}
                onChange={(e) => update("lineOfficialUrl", e.target.value)}
              />
            </Field>
            <Field>
              <label className={labelClass}>YouTube????</label>
              <input
                className={inputOk}
                value={form.youtubeUrl}
                onChange={(e) => update("youtubeUrl", e.target.value)}
              />
            </Field>
            <Field>
              <label className={labelClass}>???SNS????</label>
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
              4. ???????
            </h2>
            <Field error={fe.businessLicenseDocument}>
              <label className={labelClass}>Business License *</label>
              <input
                ref={businessLicenseInputRef}
                type="file"
                className={inputOk}
                accept=".pdf,.jpeg,.jpg,.png,.heic,image/jpeg,image/png,image/heic,application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    void uploadSingleDocument({
                      file,
                      docType: "business-license",
                      key: "businessLicenseDocument",
                    });
                  }
                }}
              />
            </Field>
            <Field>
              <label className={labelClass}>
                Entertainment Business License (Optional)
              </label>
              <input
                ref={entertainmentLicenseInputRef}
                type="file"
                className={inputOk}
                accept=".pdf,.jpeg,.jpg,.png,.heic,image/jpeg,image/png,image/heic,application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    void uploadSingleDocument({
                      file,
                      docType: "entertainment-license",
                      key: "entertainmentLicenseDocument",
                    });
                  }
                }}
              />
            </Field>
            <Field>
              <label className={labelClass}>
                Late-night Alcohol Notification (Optional)
              </label>
              <input
                ref={lateNightInputRef}
                type="file"
                className={inputOk}
                accept=".pdf,.jpeg,.jpg,.png,.heic,image/jpeg,image/png,image/heic,application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    void uploadSingleDocument({
                      file,
                      docType: "late-night-alcohol-notification",
                      key: "lateNightAlcoholNotificationDocument",
                    });
                  }
                }}
              />
            </Field>
            <Field error={fe.openDate}>
              <label className={labelClass}>????? *</label>
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
            <h2 className="font-serif text-lg text-charcoal">5. ?????</h2>
            <p className="text-xs text-muted">
              ????????????????????????????????
            </p>
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
                        ? "???"
                        : plan === "standard"
                          ? "??????"
                          : "?????"}
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
            <h2 className="font-serif text-lg text-charcoal">6. ????</h2>
            <Field error={fe.listingReason}>
              <label className={labelClass}>????????? *</label>
              <textarea
                className={fe.listingReason ? inputErr : inputOk}
                rows={4}
                value={form.listingReason}
                onChange={(e) => update("listingReason", e.target.value)}
              />
            </Field>
            <Field error={fe.shopFeatures}>
              <label className={labelClass}>????? *</label>
              <textarea
                className={fe.shopFeatures ? inputErr : inputOk}
                rows={4}
                value={form.shopFeatures}
                onChange={(e) => update("shopFeatures", e.target.value)}
              />
            </Field>
            <Field>
              <label className={labelClass}>????????</label>
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
                  ???????????????????????????*
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
                    ????
                  </Link>
                  ?
                  <Link
                    href="/listing-criteria"
                    className="text-gold-dark underline"
                  >
                    ????
                  </Link>
                  ?
                  <Link href="/privacy" className="text-gold-dark underline">
                    ??????????
                  </Link>
                  ???????*
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
              7. ????????
            </h2>
            <p className="text-xs text-muted">
              ????????????????JPG / PNG / WebP / PDF??5MB?????8??
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
            {uploading && (
              <p className="text-sm text-muted">???????...</p>
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
                    ??
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {step === 8 && (
          <section className={sectionClass}>
            <h2 className="font-serif text-lg text-charcoal">??????</h2>
            <dl className="space-y-2 text-sm text-charcoal">
              <div>
                <dt className="text-muted">???</dt>
                <dd>{form.shopName}</dd>
              </div>
              <div>
                <dt className="text-muted">???</dt>
                <dd>{form.shopAddress}</dd>
              </div>
              <div>
                <dt className="text-muted">??</dt>
                <dd>{form.businessType}</dd>
              </div>
              <div>
                <dt className="text-muted">???</dt>
                <dd>
                  {form.contactName} / {form.contactEmail}
                </dd>
              </div>
              <div>
                <dt className="text-muted">?????</dt>
                <dd>{formatPlanPriceLabel(form.requestedPlan)}</dd>
              </div>
              <div>
                <dt className="text-muted">Business License</dt>
                <dd>{form.businessLicenseDocument ? "Uploaded" : "Not submitted"}</dd>
              </div>
              <div>
                <dt className="text-muted">Entertainment License</dt>
                <dd>{form.entertainmentLicenseDocument ? "Uploaded" : "Not submitted"}</dd>
              </div>
              <div>
                <dt className="text-muted">Late-night Alcohol Notification</dt>
                <dd>
                  {form.lateNightAlcoholNotificationDocument
                    ? "Uploaded"
                    : "Not submitted"}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Attachments</dt>
                <dd>{form.attachments.length}</dd>
              </div>
            </dl>
            <p className="text-xs text-muted">
              ??????????????????????????????????
            </p>
          </section>
        )}
      </div>

      {/* ?? ?????????? ?? */}
      <div className="flex flex-wrap gap-3">
        {step > 1 && (
          <button
            type="button"
            disabled={navigating || loading || uploading}
            onClick={goBack}
            className="rounded-full border border-gold/40 px-5 py-3 text-sm font-medium text-gold-dark disabled:opacity-60"
          >
            ??
          </button>
        )}

        {step < STEPS.length && (
          <button
            type="button"
            disabled={navigating || loading || uploading}
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
                ???...
              </>
            ) : (
              "??"
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
                ???...
              </>
            ) : (
              "?????????"
            )}
          </button>
        )}
      </div>
    </div>
  );
}
