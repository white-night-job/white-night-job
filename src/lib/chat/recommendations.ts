import type { ChatJob, ChatPreferences, ChatRecommendation } from "./types";

export function getHourlySalary(salary: string): number | null {
  if (/日給|月給|年収/.test(salary)) return null;

  const match = salary.replace(/,/g, "").match(/\d+/);
  return match ? Number(match[0]) : null;
}

function buildReason(job: ChatJob, prefs: ChatPreferences, scoreDetails: string[]): string {
  if (job.chatRecommend.comment?.trim()) {
    return job.chatRecommend.comment.trim();
  }

  const parts: string[] = [];
  if (scoreDetails.length > 0) {
    parts.push(scoreDetails.slice(0, 3).join("・"));
  }
  if (prefs.district && job.district === prefs.district) {
    parts.push(`${prefs.district}エリア`);
  }
  if (prefs.jobType && job.jobType === prefs.jobType) {
    parts.push(`${prefs.jobType}の募集`);
  }

  return parts.length > 0
    ? `${parts.join("、")}の条件にマッチしています`
    : "あなたの条件に近いお店です";
}

function scoreJob(
  job: ChatJob,
  prefs: ChatPreferences,
  messageKeywords: string[],
): { score: number; details: string[] } {
  if (!job.chatRecommend.enabled) {
    return { score: -1, details: [] };
  }

  let score = job.chatRecommend.priority;
  const details: string[] = [];

  if (prefs.district && prefs.district !== "こだわらない") {
    if (job.district === prefs.district) {
      score += 10;
      details.push(`${prefs.district}エリア`);
    } else {
      score -= 5;
    }
  }

  if (prefs.jobType && prefs.jobType !== "こだわらない") {
    if (job.jobType === prefs.jobType) {
      score += 10;
      details.push(prefs.jobType);
    } else {
      score -= 5;
    }
  }

  if (prefs.minSalary) {
    const hourly = getHourlySalary(job.salary);
    if (hourly !== null) {
      if (hourly >= prefs.minSalary) {
        score += 15;
        details.push(`時給${hourly}円`);
      } else {
        score -= 8;
      }
    }
  }

  if (prefs.experience === "beginner" && job.chatRecommend.beginner) {
    score += 20;
    details.push("未経験向け");
  }

  if (prefs.alcoholOk === false && job.chatRecommend.noAlcoholOk) {
    score += 20;
    details.push("お酒NG可");
  }

  if (prefs.wantsShuttle && job.chatRecommend.shuttle) {
    score += 15;
    details.push("送迎あり");
  }

  if (prefs.privacyConcern && job.chatRecommend.privacy) {
    score += 15;
    details.push("身バレ配慮");
  }

  if (job.chatRecommend.highSalary) {
    score += 5;
  }
  if (job.chatRecommend.relaxed) {
    score += 3;
  }
  if (job.chatRecommend.highEarning) {
    score += 3;
  }

  if (messageKeywords.includes("alcohol") && job.chatRecommend.noAlcoholOk) {
    score += 25;
    if (!details.includes("お酒NG可")) details.push("お酒NG可");
  }
  if (messageKeywords.includes("beginner") && job.chatRecommend.beginner) {
    score += 25;
    if (!details.includes("未経験向け")) details.push("未経験向け");
  }
  if (messageKeywords.includes("shuttle") && job.chatRecommend.shuttle) {
    score += 15;
    if (!details.includes("送迎あり")) details.push("送迎あり");
  }
  if (messageKeywords.includes("privacy") && job.chatRecommend.privacy) {
    score += 15;
    if (!details.includes("身バレ配慮")) details.push("身バレ配慮");
  }

  return { score, details };
}

function extractMessageKeywords(message: string): string[] {
  const normalized = message.toLowerCase();
  const keywords: string[] = [];
  if (/お酒|飲めない|飲まない|アルコール/.test(normalized)) keywords.push("alcohol");
  if (/未経験|はじめて|初めて|初心者/.test(normalized)) keywords.push("beginner");
  if (/送迎/.test(normalized)) keywords.push("shuttle");
  if (/身バレ|バレ|プライバシー/.test(normalized)) keywords.push("privacy");
  return keywords;
}

export function matchRecommendations(
  jobs: ChatJob[],
  prefs: ChatPreferences,
  message = "",
  limit = 5,
): ChatRecommendation[] {
  const messageKeywords = extractMessageKeywords(message);
  const hasPreferences = Object.keys(prefs).length > 0 || messageKeywords.length > 0;

  const scored = jobs
    .map((job) => {
      const { score, details } = scoreJob(job, prefs, messageKeywords);
      return { job, score, details };
    })
    .filter((item) => item.score >= 0)
    .sort((a, b) => b.score - a.score);

  const results = hasPreferences
    ? scored
    : jobs
        .filter((job) => job.chatRecommend.enabled)
        .map((job) => ({
          job,
          score: job.chatRecommend.priority,
          details: [] as string[],
        }))
        .sort((a, b) => b.score - a.score);

  return results.slice(0, limit).map(({ job, details }) => ({
    id: job.id,
    shopName: job.shopName,
    area: job.area,
    district: job.district,
    jobType: job.jobType,
    salary: job.salary,
    reason: buildReason(job, prefs, details),
    lineUrl: job.lineUrl,
  }));
}

export function preferencesFromQuery(
  searchParams: URLSearchParams,
): ChatPreferences {
  const prefs: ChatPreferences = {};

  const district = searchParams.get("district");
  if (district && district !== "こだわらない") prefs.district = district;

  const jobType = searchParams.get("jobType");
  if (jobType && jobType !== "こだわらない") prefs.jobType = jobType;

  const minSalary = searchParams.get("minSalary");
  if (minSalary) prefs.minSalary = Number(minSalary);

  const experience = searchParams.get("experience");
  if (experience === "beginner" || experience === "experienced") {
    prefs.experience = experience;
  }

  const alcoholOk = searchParams.get("alcoholOk");
  if (alcoholOk === "true") prefs.alcoholOk = true;
  if (alcoholOk === "false") prefs.alcoholOk = false;

  const daysPerWeek = searchParams.get("daysPerWeek");
  if (daysPerWeek) prefs.daysPerWeek = Number(daysPerWeek);

  const wantsShuttle = searchParams.get("wantsShuttle");
  if (wantsShuttle === "true") prefs.wantsShuttle = true;

  const privacyConcern = searchParams.get("privacyConcern");
  if (privacyConcern === "true") prefs.privacyConcern = true;

  return prefs;
}
