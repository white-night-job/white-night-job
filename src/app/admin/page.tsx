"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BENEFIT_CATEGORIES,
  getKnownBenefits,
  getUncategorizedBenefits,
} from "@/data/benefits";
import { DISTRICTS } from "@/data/districts";
import { formatLocation, JOBS_UPDATED_EVENT } from "@/lib/job-storage";
import { parseBenefits } from "@/lib/job-db";
import {
  FIXED_AREA,
  JOB_TYPES,
  type District,
  type Job,
  type JobType,
} from "@/types/job";

type JobForm = {
  shopName: string;
  district: District;
  jobType: JobType;
  salary: string;
  businessHours: string;
  ageGroup: string;
  customerPersonalityLevel: string;
  customerAgeLevel: string;
  customerRegularLevel: string;
  benefits: string[];
  otherBenefits: string;
  introductionText: string;
  descriptionText: string;
  imageUrl: string;
  phone: string;
  address: string;
  access: string;
  xUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  youtubeUrl: string;
  websiteUrl: string;
  lineUrl: string;
};

const emptyForm: JobForm = {
  shopName: "",
  district: "すすきの",
  jobType: "ニュークラ",
  salary: "",
  businessHours: "",
  ageGroup: "",
  customerPersonalityLevel: "",
  customerAgeLevel: "",
  customerRegularLevel: "",
  benefits: [],
  otherBenefits: "",
  introductionText: "",
  descriptionText: "",
  imageUrl: "",
  phone: "",
  address: "",
  access: "",
  xUrl: "",
  instagramUrl: "",
  tiktokUrl: "",
  youtubeUrl: "",
  websiteUrl: "",
  lineUrl: "",
};

const inputClass =
  "w-full rounded-xl border border-gold/30 bg-ivory px-4 py-3 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/20";

const labelClass = "mb-1.5 block text-sm font-medium text-charcoal";

const levelOptions = [
  { value: "", label: "未設定" },
  { value: "1", label: "1（左寄り）" },
  { value: "2", label: "2" },
  { value: "3", label: "3（中央）" },
  { value: "4", label: "4" },
  { value: "5", label: "5（右寄り）" },
];

function toPayload(form: JobForm) {
  return {
    shopName: form.shopName,
    district: form.district,
    jobType: form.jobType,
    salary: form.salary,
    businessHours: form.businessHours,
    ageGroup: form.ageGroup,
    customerPersonalityLevel: form.customerPersonalityLevel
      ? Number(form.customerPersonalityLevel)
      : undefined,
    customerAgeLevel: form.customerAgeLevel
      ? Number(form.customerAgeLevel)
      : undefined,
    customerRegularLevel: form.customerRegularLevel
      ? Number(form.customerRegularLevel)
      : undefined,
    benefits: form.benefits,
    otherBenefits: parseBenefits(form.otherBenefits),
    introductionText: form.introductionText || undefined,
    descriptionText: form.descriptionText || undefined,
    imageUrl: form.imageUrl || undefined,
    phone: form.phone || undefined,
    address: form.address || undefined,
    access: form.access || undefined,
    xUrl: form.xUrl || undefined,
    instagramUrl: form.instagramUrl || undefined,
    tiktokUrl: form.tiktokUrl || undefined,
    youtubeUrl: form.youtubeUrl || undefined,
    websiteUrl: form.websiteUrl || undefined,
    lineUrl: form.lineUrl,
  };
}

function toForm(job: Job): JobForm {
  return {
    shopName: job.shopName,
    district: job.district,
    jobType: job.jobType,
    salary: job.salary,
    businessHours: job.businessHours ?? "",
    ageGroup: job.ageGroup ?? "",
    customerPersonalityLevel: job.customerPersonalityLevel
      ? String(job.customerPersonalityLevel)
      : "",
    customerAgeLevel: job.customerAgeLevel ? String(job.customerAgeLevel) : "",
    customerRegularLevel: job.customerRegularLevel
      ? String(job.customerRegularLevel)
      : "",
    benefits: getKnownBenefits(job.benefits),
    otherBenefits: [
      ...(job.otherBenefits ?? []),
      ...getUncategorizedBenefits(job.benefits),
    ].join("\n"),
    introductionText: job.introductionText ?? "",
    descriptionText: job.descriptionText ?? "",
    imageUrl: job.imageUrl ?? "",
    phone: job.phone ?? "",
    address: job.address ?? "",
    access: job.access ?? "",
    xUrl: job.xUrl ?? "",
    instagramUrl: job.instagramUrl ?? "",
    tiktokUrl: job.tiktokUrl ?? "",
    youtubeUrl: job.youtubeUrl ?? "",
    websiteUrl: job.websiteUrl ?? "",
    lineUrl: job.lineUrl,
  };
}

async function readJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { message?: string };
  if (!response.ok) throw new Error(data.message ?? "通信に失敗しました。");
  return data;
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [password, setPassword] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [form, setForm] = useState<JobForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const editingJob = useMemo(
    () => jobs.find((job) => job.id === editingId),
    [editingId, jobs],
  );

  async function loadJobs() {
    const data = await readJson<{ jobs: Job[] }>(
      await fetch("/api/jobs", { cache: "no-store" }),
    );
    setJobs(data.jobs);
  }

  useEffect(() => {
    fetch("/api/admin/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { authenticated: boolean }) => {
        setAuthenticated(data.authenticated);
        if (data.authenticated) return loadJobs();
      })
      .catch(() => setAuthenticated(false))
      .finally(() => setCheckingSession(false));
  }, []);

  function setField<K extends keyof JobForm>(key: K, value: JobForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleBenefit(benefit: string) {
    setForm((current) => ({
      ...current,
      benefits: current.benefits.includes(benefit)
        ? current.benefits.filter((item) => item !== benefit)
        : [...current.benefits, benefit],
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      await readJson<{ ok: boolean }>(
        await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        }),
      );
      setAuthenticated(true);
      setPassword("");
      await loadJobs();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ログインに失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthenticated(false);
    setJobs([]);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const url = editingId ? `/api/jobs/${editingId}` : "/api/jobs";
      const method = editingId ? "PUT" : "POST";
      await readJson<{ job: Job }>(
        await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(toPayload(form)),
        }),
      );
      setMessage(editingId ? "求人を更新しました。" : "求人を追加しました。");
      resetForm();
      await loadJobs();
      window.dispatchEvent(new Event(JOBS_UPDATED_EVENT));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(job: Job) {
    if (!window.confirm(`「${job.shopName}」を削除しますか？`)) return;
    setLoading(true);
    setMessage("");
    try {
      await readJson<{ ok: boolean }>(
        await fetch(`/api/jobs/${job.id}`, { method: "DELETE" }),
      );
      if (editingId === job.id) resetForm();
      setMessage("求人を削除しました。");
      await loadJobs();
      window.dispatchEvent(new Event(JOBS_UPDATED_EVENT));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "削除に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const data = await readJson<{ imageUrl: string }>(
        await fetch("/api/upload", {
          method: "POST",
          body: formData,
        }),
      );
      setField("imageUrl", data.imageUrl);
      setMessage("店舗写真をアップロードしました。");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "画像アップロードに失敗しました。",
      );
    } finally {
      setUploading(false);
    }
  }

  function handleEdit(job: Job) {
    setEditingId(job.id);
    setForm(toForm(job));
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (checkingSession) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <div className="h-40 animate-pulse rounded-2xl bg-white" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <form
          onSubmit={handleLogin}
          className="space-y-4 rounded-2xl border border-gold/25 bg-white p-6 shadow-gold"
        >
          <div>
            <h1 className="font-serif text-2xl font-semibold text-charcoal">
              管理画面ログイン
            </h1>
            <p className="mt-1 text-sm text-muted">
              .env.local の ADMIN_PASSWORD を入力してください。
            </p>
          </div>
          {message && <p className="text-sm text-red-600">{message}</p>}
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClass}
            placeholder="管理パスワード"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-gradient-to-r from-gold to-gold-dark px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "確認中..." : "ログイン"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-charcoal sm:text-3xl">
            求人管理
          </h1>
          <p className="mt-1 text-sm text-muted">
            求人情報と店舗写真はSupabaseに保存されます。
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/"
            className="rounded-full border border-gold/40 px-4 py-2 text-sm font-medium text-gold-dark hover:bg-ivory"
          >
            サイトを見る
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full border border-gold/40 px-4 py-2 text-sm font-medium text-muted hover:text-charcoal"
          >
            ログアウト
          </button>
        </div>
      </div>

      {message && (
        <p className="mb-4 rounded-xl border border-gold/30 bg-gold-light/20 px-4 py-3 text-sm text-charcoal">
          {message}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-gold/25 bg-white p-5 shadow-gold sm:p-6"
      >
        <h2 className="text-lg font-semibold text-charcoal">
          {editingId ? "求人を編集" : "求人を追加"}
        </h2>

        <div>
          <label htmlFor="shopName" className={labelClass}>
            店名
          </label>
          <input
            id="shopName"
            value={form.shopName}
            onChange={(event) => setField("shopName", event.target.value)}
            className={inputClass}
            placeholder="例：ニュークラブ ロゼッタ"
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>エリア</label>
            <select
              value={form.district}
              onChange={(event) => setField("district", event.target.value as District)}
              className={inputClass}
            >
              {DISTRICTS.map((district) => (
                <option key={district} value={district}>
                  {FIXED_AREA} / {district}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>業種</label>
            <select
              value={form.jobType}
              onChange={(event) => setField("jobType", event.target.value as JobType)}
              className={inputClass}
            >
              {JOB_TYPES.map((jobType) => (
                <option key={jobType} value={jobType}>
                  {jobType}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="salary" className={labelClass}>
            時給
          </label>
          <input
            id="salary"
            value={form.salary}
            onChange={(event) => setField("salary", event.target.value)}
            className={inputClass}
            placeholder="例：時給 4,000円〜"
            required
          />
        </div>

        <div>
          <label htmlFor="businessHours" className={labelClass}>
            営業時間
          </label>
          <input
            id="businessHours"
            value={form.businessHours}
            onChange={(event) => setField("businessHours", event.target.value)}
            className={inputClass}
            placeholder="例：20:00〜LAST"
          />
        </div>

        <div>
          <label htmlFor="access" className={labelClass}>
            アクセス
          </label>
          <input
            id="access"
            value={form.access}
            onChange={(event) => setField("access", event.target.value)}
            className={inputClass}
            placeholder="例：すすきの駅から徒歩3分"
          />
        </div>

        <div>
          <label htmlFor="ageGroup" className={labelClass}>
            キャスト年齢
          </label>
          <input
            id="ageGroup"
            value={form.ageGroup}
            onChange={(event) => setField("ageGroup", event.target.value)}
            className={inputClass}
            placeholder="例：キャスト年齢 20代前半〜30代前半"
          />
        </div>

        <div className="space-y-4 rounded-2xl border border-gold/20 bg-ivory p-4">
          <div>
            <p className="text-sm font-semibold text-gold-dark">お店の基本情報</p>
            <p className="mt-1 text-xs text-muted">
              1〜5で選択してください。未設定の項目は表示されません。
            </p>
          </div>
          <div>
            <label htmlFor="customerPersonalityLevel" className={labelClass}>
              お店の雰囲気
            </label>
            <select
              id="customerPersonalityLevel"
              value={form.customerPersonalityLevel}
              onChange={(event) =>
                setField("customerPersonalityLevel", event.target.value)
              }
              className={inputClass}
            >
              {levelOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted">1: にぎやか / 5: 落ち着いている</p>
          </div>
          <div>
            <label htmlFor="customerAgeLevel" className={labelClass}>
              お客様の年齢層
            </label>
            <select
              id="customerAgeLevel"
              value={form.customerAgeLevel}
              onChange={(event) => setField("customerAgeLevel", event.target.value)}
              className={inputClass}
            >
              {levelOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted">1: 若い / 5: 年配</p>
          </div>
          <div>
            <label htmlFor="customerRegularLevel" className={labelClass}>
              来店傾向
            </label>
            <select
              id="customerRegularLevel"
              value={form.customerRegularLevel}
              onChange={(event) =>
                setField("customerRegularLevel", event.target.value)
              }
              className={inputClass}
            >
              {levelOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted">1: 新規 / 5: 常連</p>
          </div>
        </div>

        <div>
          <p className={labelClass}>待遇</p>
          <div className="space-y-4 rounded-2xl border border-gold/20 bg-ivory p-4">
            {BENEFIT_CATEGORIES.map((category) => (
              <div key={category.title}>
                <p className="mb-2 text-sm font-semibold text-gold-dark">
                  {category.title}
                </p>
                <div className="flex flex-wrap gap-2">
                  {category.items.map((benefit) => {
                    const selected = form.benefits.includes(benefit);
                    return (
                      <button
                        key={benefit}
                        type="button"
                        onClick={() => toggleBenefit(benefit)}
                        className={`rounded-full border px-4 py-2.5 text-sm font-medium transition-all ${
                          selected
                            ? "border-gold bg-gradient-to-r from-gold to-gold-dark text-white shadow-md"
                            : "border-gold/30 bg-white text-muted hover:border-gold hover:text-gold-dark"
                        }`}
                      >
                        {benefit}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <div>
              <label
                htmlFor="otherBenefits"
                className="mb-2 block text-sm font-semibold text-gold-dark"
              >
                その他
              </label>
              <textarea
                id="otherBenefits"
                value={form.otherBenefits}
                onChange={(event) => setField("otherBenefits", event.target.value)}
                className={inputClass}
                rows={4}
                placeholder={"完全自由シフト\n顔出しNG対応\n待機カットなし"}
              />
              <p className="mt-1 text-xs text-muted">
                1行に1つ、または「、」で区切って自由に入力できます。
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="introductionText" className={labelClass}>
              紹介文
            </label>
            <textarea
              id="introductionText"
              value={form.introductionText}
              onChange={(event) =>
                setField("introductionText", event.target.value)
              }
              className={inputClass}
              rows={3}
              placeholder="求人一覧・詳細ページの店名下に表示される短い紹介文"
            />
            <p className="mt-1 text-xs text-muted">
              2〜3行程度の短い文章を入力してください。
            </p>
          </div>

          <div>
            <label htmlFor="descriptionText" className={labelClass}>
              説明文
            </label>
            <textarea
              id="descriptionText"
              value={form.descriptionText}
              onChange={(event) =>
                setField("descriptionText", event.target.value)
              }
              className={inputClass}
              rows={10}
              placeholder="求人詳細ページの「その他待遇」の下に表示される詳しい説明文"
            />
            <p className="mt-1 text-xs text-muted">
              お店の雰囲気や仕事内容など、詳しく記載できます。
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="imageFile" className={labelClass}>
            店舗写真アップロード
          </label>
          <input
            id="imageFile"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className={inputClass}
          />
          {uploading && <p className="mt-1 text-xs text-muted">アップロード中...</p>}
          {form.imageUrl && (
            <img
              src={form.imageUrl}
              alt="アップロード済み店舗写真"
              className="mt-3 h-40 w-full rounded-xl object-cover"
            />
          )}
        </div>

        <div>
          <label htmlFor="lineUrl" className={labelClass}>
            LINE URL
          </label>
          <input
            id="lineUrl"
            type="url"
            value={form.lineUrl}
            onChange={(event) => setField("lineUrl", event.target.value)}
            className={inputClass}
            placeholder="https://line.me/R/ti/p/@xxxx"
            required
          />
        </div>

        <div className="space-y-4 rounded-2xl border border-gold/20 bg-ivory p-4">
          <div>
            <p className="text-sm font-semibold text-gold-dark">SNSリンク</p>
            <p className="mt-1 text-xs text-muted">
              入力したSNSだけ求人詳細ページに表示されます。
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="xUrl" className={labelClass}>
                Xリンク
              </label>
              <input
                id="xUrl"
                type="url"
                value={form.xUrl}
                onChange={(event) => setField("xUrl", event.target.value)}
                className={inputClass}
                placeholder="https://x.com/xxxx"
              />
            </div>
            <div>
              <label htmlFor="instagramUrl" className={labelClass}>
                Instagramリンク
              </label>
              <input
                id="instagramUrl"
                type="url"
                value={form.instagramUrl}
                onChange={(event) => setField("instagramUrl", event.target.value)}
                className={inputClass}
                placeholder="https://www.instagram.com/xxxx"
              />
            </div>
            <div>
              <label htmlFor="tiktokUrl" className={labelClass}>
                TikTokリンク
              </label>
              <input
                id="tiktokUrl"
                type="url"
                value={form.tiktokUrl}
                onChange={(event) => setField("tiktokUrl", event.target.value)}
                className={inputClass}
                placeholder="https://www.tiktok.com/@xxxx"
              />
            </div>
            <div>
              <label htmlFor="youtubeUrl" className={labelClass}>
                YouTubeリンク
              </label>
              <input
                id="youtubeUrl"
                type="url"
                value={form.youtubeUrl}
                onChange={(event) => setField("youtubeUrl", event.target.value)}
                className={inputClass}
                placeholder="https://www.youtube.com/@xxxx"
              />
            </div>
            <div>
              <label htmlFor="websiteUrl" className={labelClass}>
                WebサイトURL
              </label>
              <input
                id="websiteUrl"
                type="url"
                value={form.websiteUrl}
                onChange={(event) => setField("websiteUrl", event.target.value)}
                className={inputClass}
                placeholder="https://example.com"
              />
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="phone" className={labelClass}>
            電話番号
          </label>
          <input
            id="phone"
            type="tel"
            value={form.phone}
            onChange={(event) => setField("phone", event.target.value)}
            className={inputClass}
            placeholder="011-000-0000"
          />
          <p className="mt-1 text-xs text-muted">
            入力した場合のみ、求人詳細ページに電話応募ボタンが表示されます。
          </p>
        </div>

        <div>
          <label htmlFor="address" className={labelClass}>
            住所
          </label>
          <input
            id="address"
            value={form.address}
            onChange={(event) => setField("address", event.target.value)}
            className={inputClass}
            placeholder="例：北海道札幌市中央区南○条西○丁目"
          />
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            disabled={loading || uploading}
            className="rounded-full bg-gradient-to-r from-gold to-gold-dark px-6 py-3 text-sm font-semibold text-white shadow-md disabled:opacity-60"
          >
            {loading ? "保存中..." : editingId ? "更新する" : "保存する"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-full border border-gold/40 px-6 py-3 text-sm font-medium text-muted hover:text-charcoal"
            >
              キャンセル
            </button>
          )}
        </div>
      </form>

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-charcoal">
          求人一覧（{jobs.length}件）
        </h2>

        <ul className="space-y-3">
          {jobs.map((job) => (
            <li
              key={job.id}
              className="rounded-2xl border border-gold/20 bg-white p-4 shadow-gold sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-gold-dark">
                    {formatLocation(job)} · {job.jobType}
                  </p>
                  <p className="mt-1 font-semibold text-charcoal">{job.shopName}</p>
                  <p className="mt-0.5 text-sm text-muted">{job.salary}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    写真: {job.imageUrl ? "設定済み" : "未設定"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(job)}
                    className="rounded-full border border-gold/40 px-4 py-2 text-sm font-medium text-gold-dark hover:bg-ivory"
                  >
                    編集
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(job)}
                    disabled={loading}
                    className="rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
                  >
                    削除
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
