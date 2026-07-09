"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  addCompareJobId,
  COMPARE_MAX,
  loadCompareJobIds,
} from "@/lib/compare-jobs";

type CompareButtonProps = {
  jobId: string;
  className?: string;
};

export function CompareButton({ jobId, className = "" }: CompareButtonProps) {
  const [jobIds, setJobIds] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setJobIds(loadCompareJobIds());
  }, []);

  function handleAdd() {
    setMessage(null);
    const result = addCompareJobId(jobId);
    setJobIds(result.jobIds);
    if (result.ok) {
      setMessage("比較に追加しました");
      return;
    }
    if (result.reason === "duplicate") {
      setMessage("すでに比較リストにあります");
      return;
    }
    setMessage(`比較は最大${COMPARE_MAX}店舗までです`);
  }

  const isAdded = jobIds.includes(jobId);

  return (
    <div className={`flex flex-col items-start gap-1 ${className}`}>
      <button
        type="button"
        onClick={handleAdd}
        disabled={isAdded}
        className="text-xs font-semibold text-gold-dark underline-offset-2 hover:underline disabled:opacity-50"
      >
        {isAdded ? "比較に追加済み" : "比較に追加"}
      </button>
      {jobIds.length > 0 && (
        <Link href="/compare" className="text-[10px] text-muted">
          比較する（{jobIds.length}/{COMPARE_MAX}）
        </Link>
      )}
      {message && <p className="text-[10px] text-muted">{message}</p>}
    </div>
  );
}
