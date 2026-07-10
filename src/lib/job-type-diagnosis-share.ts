import type { DiagnosisResult } from "@/lib/job-type-diagnosis-types";

export function buildDiagnosisShareText(result: DiagnosisResult): string {
  const top = result.topTwo[0];
  return [
    "あなたに一番向いている職種は",
    "",
    `🥇 ${top.jobType}（${top.percent}%）`,
    "",
    "White Night Jobで診断しました。",
  ].join("\n");
}

export function buildDiagnosisShareUrl(): string {
  if (typeof window === "undefined") return "https://whitenightjob.jp/#night-job-diagnosis";
  return `${window.location.origin}/#night-job-diagnosis`;
}

export function buildLineShareUrl(text: string, url: string): string {
  return `https://line.me/R/msg/text/?${encodeURIComponent(`${text}\n${url}`)}`;
}

export function buildXShareUrl(text: string, url: string): string {
  const params = new URLSearchParams({
    text: `${text}\n${url}`,
  });
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

export async function renderDiagnosisShareImage(
  result: DiagnosisResult,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("画像の生成に失敗しました。");

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#111111");
  gradient.addColorStop(0.45, "#2a2218");
  gradient.addColorStop(1, "#8b6f3e");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(255, 253, 248, 0.08)";
  ctx.fillRect(64, 64, canvas.width - 128, canvas.height - 128);

  ctx.fillStyle = "#f0e6d4";
  ctx.font = "600 42px serif";
  ctx.fillText("White Night Job", 120, 180);

  ctx.fillStyle = "#ffffff";
  ctx.font = "700 56px serif";
  ctx.fillText("あなたに一番向いている職種は", 120, 300);

  ctx.font = "800 92px serif";
  ctx.fillStyle = "#f5ede0";
  ctx.fillText(`🥇 ${result.topTwo[0].jobType}`, 120, 430);

  ctx.font = "700 72px sans-serif";
  ctx.fillStyle = "#d4bc8e";
  ctx.fillText(`${result.topTwo[0].percent}%`, 120, 540);

  ctx.fillStyle = "rgba(255, 253, 248, 0.82)";
  ctx.font = "500 40px sans-serif";
  ctx.fillText("White Night Jobで診断しました。", 120, 660);

  ctx.fillStyle = "rgba(240, 230, 212, 0.55)";
  ctx.font = "400 32px sans-serif";
  ctx.fillText("whitenightjob.jp", 120, 1220);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("画像の生成に失敗しました。"));
        return;
      }
      resolve(blob);
    }, "image/png");
  });
}

export async function downloadDiagnosisShareImage(result: DiagnosisResult): Promise<void> {
  const blob = await renderDiagnosisShareImage(result);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "white-night-job-diagnosis.png";
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function shareDiagnosisWithImage(result: DiagnosisResult): Promise<boolean> {
  const text = buildDiagnosisShareText(result);
  const url = buildDiagnosisShareUrl();

  if (!navigator.share) return false;

  try {
    const blob = await renderDiagnosisShareImage(result);
    const file = new File([blob], "white-night-job-diagnosis.png", { type: "image/png" });
    const shareData: ShareData = {
      title: "あなたに合う職種診断",
      text,
      url,
      files: [file],
    };

    if (navigator.canShare?.(shareData)) {
      await navigator.share(shareData);
      return true;
    }

    await navigator.share({ title: "あなたに合う職種診断", text: `${text}\n${url}` });
    return true;
  } catch {
    return false;
  }
}
