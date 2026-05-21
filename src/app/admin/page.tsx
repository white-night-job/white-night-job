"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
  benefits: string;
  description: string;
  imageUrl: string;
  lineUrl: string;
};

const emptyForm: JobForm = {
  shopName: "",
  district: "すすきの",
  jobType: "ニュークラ",
  salary: "",
  benefits: "",
  description: "",
  imageUrl: "",
  lineUrl: "",
};

const inputClass =
  "w-full rounded-xl border border-gold/30 bg-ivory px-4 py-3 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/20";

const labelClass = "mb-1.5 block text-sm font-medium text-charcoal";

function toPayload(form: JobForm) {
  return {
    shopName: form.shopName,
    district: form.district,
    jobType: form.jobType,
    salary: form.salary,
    benefits: parseBenefits(form.benefits),
    description: form.description,
    imageUrl: form.imageUrl || undefined,
    lineUrl: form.lineUrl,
  };
}

function toForm(job: Job): JobForm {
  return {
    shopName: job.shopName,
    district: job.district,
    jobType: job.jobType,
    salary: job.salary,
    benefits: job.benefits.join("\n"),
    description: job.description,
    imageUrl: job.imageUrl ?? "",
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
          <label htmlFor="benefits" className={labelClass}>
            待遇
          </label>
          <textarea
            id="benefits"
            value={form.benefits}
            onChange={(event) => setField("benefits", event.target.value)}
            className={inputClass}
            rows={3}
            placeholder={"送迎あり\n衣装貸与\nノルマなし"}
          />
        </div>

        <div>
          <label htmlFor="description" className={labelClass}>
            説明
          </label>
          <textarea
            id="description"
            value={form.description}
            onChange={(event) => setField("description", event.target.value)}
            className={inputClass}
            rows={4}
            placeholder="お店の雰囲気や仕事内容を入力"
            required
          />
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
