"use client";

import { useState } from "react";
import type { DiagnosisResult } from "@/lib/job-type-diagnosis-types";
import {
  buildDiagnosisShareText,
  buildDiagnosisShareUrl,
  buildLineShareUrl,
  buildXShareUrl,
  downloadDiagnosisShareImage,
  shareDiagnosisWithImage,
} from "@/lib/job-type-diagnosis-share";

type JobTypeDiagnosisSharePanelProps = {
  result: DiagnosisResult;
  onMessage?: (message: string) => void;
};

export function JobTypeDiagnosisSharePanel({
  result,
  onMessage,
}: JobTypeDiagnosisSharePanelProps) {
  const [sharing, setSharing] = useState(false);
  const top = result.topTwo[0];
  const shareText = buildDiagnosisShareText(result);

  async function handleInstagramShare() {
    setSharing(true);
    try {
      const shared = await shareDiagnosisWithImage(result);
      if (shared) {
        onMessage?.("共有メニューを開きました。");
        return;
      }
      await downloadDiagnosisShareImage(result);
      onMessage?.("画像を保存しました。Instagramストーリーに投稿してください。");
    } catch {
      onMessage?.("画像の共有に失敗しました。");
    } finally {
      setSharing(false);
    }
  }

  function openShare(url: string) {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <section className="job-diagnosis-share-card" aria-labelledby="job-diagnosis-share-heading">
      <h3 id="job-diagnosis-share-heading" className="job-diagnosis-share-title font-serif">
        診断結果をシェア
      </h3>

      <div className="job-diagnosis-share-preview">
        <p className="job-diagnosis-share-preview-line">あなたに一番向いている職種は</p>
        <p className="job-diagnosis-share-preview-result font-serif">
          🥇 {top.jobType}（{top.percent}%）
        </p>
        <p className="job-diagnosis-share-preview-brand">White Night Jobで診断しました。</p>
      </div>

      <div className="job-diagnosis-share-actions">
        <button
          type="button"
          className="job-diagnosis-share-btn job-diagnosis-share-btn-line"
          onClick={() =>
            openShare(buildLineShareUrl(shareText, buildDiagnosisShareUrl()))
          }
        >
          LINE
        </button>
        <button
          type="button"
          className="job-diagnosis-share-btn job-diagnosis-share-btn-x"
          onClick={() =>
            openShare(buildXShareUrl(shareText, buildDiagnosisShareUrl()))
          }
        >
          X
        </button>
        <button
          type="button"
          className="job-diagnosis-share-btn job-diagnosis-share-btn-ig"
          disabled={sharing}
          onClick={() => void handleInstagramShare()}
        >
          {sharing ? "準備中..." : "Instagramストーリー"}
        </button>
      </div>
    </section>
  );
}
