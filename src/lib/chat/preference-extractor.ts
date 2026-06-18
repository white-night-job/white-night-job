import { DISTRICTS } from "@/data/districts";
import { JOB_TYPES } from "@/types/job";
import type { ChatPreferences } from "./types";

function joinUserMessages(messages: Array<{ role: string; content: string }>): string {
  return messages
    .filter((message) => message.role === "user")
    .map((message) => message.content)
    .join("\n");
}

export function extractPreferencesFromMessages(
  messages: Array<{ role: string; content: string }>,
): ChatPreferences {
  const text = joinUserMessages(messages);
  if (!text.trim()) return {};

  const prefs: ChatPreferences = {};

  for (const district of DISTRICTS) {
    if (text.includes(district)) {
      prefs.district = district;
      break;
    }
  }

  if (/すすきの|ススキノ/.test(text) && !prefs.district) {
    prefs.district = "すすきの";
  }

  for (const jobType of JOB_TYPES) {
    if (text.includes(jobType)) {
      prefs.jobType = jobType;
      break;
    }
  }

  const salaryMatch = text.replace(/,/g, "").match(/(\d{3,5})\s*円/);
  if (salaryMatch) {
    prefs.minSalary = Number(salaryMatch[1]);
  } else if (/高時給|時給高|3000|3500|4000/.test(text)) {
    const num = text.match(/(2\d{3}|3\d{3}|4\d{3})/);
    if (num) prefs.minSalary = Number(num[0]);
  }

  if (/未経験|はじめて|初めて|初心者/.test(text)) {
    prefs.experience = "beginner";
  } else if (/経験者|経験あり|ベテラン/.test(text)) {
    prefs.experience = "experienced";
  }

  if (/飲めない|飲まない|お酒NG|お酒なし|アルコール/.test(text)) {
    prefs.alcoholOk = false;
  } else if (/お酒.*(飲める|OK|大丈夫)|飲める/.test(text)) {
    prefs.alcoholOk = true;
  }

  if (/送迎/.test(text)) {
    prefs.wantsShuttle = !/送迎.*(不要|いらない|なし)/.test(text);
  }

  if (/身バレ|バレたくない|バレない|プライバシー/.test(text)) {
    prefs.privacyConcern = true;
  }

  if (/週1|週１|週に1|週に１/.test(text)) {
    prefs.wantsWeeklyOnce = true;
  }

  if (/日払い/.test(text)) {
    prefs.wantsDailyPay = true;
  }

  if (/ノルマなし|ノルマ無|ノルマがない|ノルマない/.test(text)) {
    prefs.noQuota = true;
  }

  if (/罰金なし|罰金無|罰金がない|罰金ない/.test(text)) {
    prefs.noPenalty = true;
  }

  if (/週[2-9２-９]|毎日|週3|週３|週4|週４|週5|週５/.test(text)) {
    const weekMatch = text.match(/週\s*([1-9１-９])/);
    if (weekMatch) {
      const digit = weekMatch[1].replace("１", "1").replace("２", "2").replace("３", "3");
      prefs.daysPerWeek = Number(digit);
    }
  }

  return prefs;
}

export function shouldIncludeRecommendations(
  messages: Array<{ role: string; content: string }>,
  prefs: ChatPreferences,
): boolean {
  const lastUser =
    [...messages].reverse().find((message) => message.role === "user")?.content ?? "";
  const allUserText = joinUserMessages(messages);

  if (
    /おすすめ|紹介して|お店.*(教え|ある|は)|店舗.*(教え|探|紹介)|求人.*(教え|探)|マッチ|ぴったり|合う店/.test(
      lastUser,
    )
  ) {
    return true;
  }

  if (/おすすめ|店舗|求人|探して/.test(allUserText) && Object.keys(prefs).length >= 1) {
    return true;
  }

  const signalCount = Object.keys(prefs).length;
  return signalCount >= 2;
}

export function preferencesToSearchText(
  messages: Array<{ role: string; content: string }>,
): string {
  return joinUserMessages(messages);
}

/** 条件指定なしのおすすめ依頼（優先度順で紹介） */
export function isGenericRecommendRequest(
  messages: Array<{ role: string; content: string }>,
): boolean {
  const lastUser =
    [...messages].reverse().find((message) => message.role === "user")?.content ?? "";
  return /おすすめ.*(お店|店舗)|お店.*おすすめ|おすすめを(教え|紹介)/.test(lastUser);
}
