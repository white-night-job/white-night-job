"use client";

import { LineBroadcastPanel } from "@/components/admin/LineBroadcastPanel";
import { useEffect, useState } from "react";
import type { BroadcastJobOption } from "@/components/admin/LineBroadcastPanel";

export default function AdminLineBroadcastPage() {
  const [jobs, setJobs] = useState<BroadcastJobOption[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/jobs/options", { credentials: "include" })
      .then((res) => res.json())
      .then((data: { jobs?: BroadcastJobOption[] }) => {
        setJobs(Array.isArray(data.jobs) ? data.jobs : []);
      })
      .catch(() => setJobs([]));
  }, []);

  return (
    <div>
      <header className="admin-page-header">
        <h1>LINE配信管理</h1>
        <p>求職者向けLINE通知の配信を行います。</p>
      </header>
      {message ? (
        <p className="mb-4 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm">
          {message}
        </p>
      ) : null}
      <div className="rounded-xl border border-black/10 bg-white p-4 sm:p-5">
        <LineBroadcastPanel jobs={jobs} onMessage={setMessage} />
      </div>
    </div>
  );
}
