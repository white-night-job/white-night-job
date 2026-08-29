/**
 * Parity snapshots for published SEO landings.
 * Run: npx tsc --noEmit && node (via next build) or import in tests.
 */
import { getPublishedSeoLanding } from "@/lib/seo-landing/build";

export const SEO_LANDING_PARITY = {
  susukinoGirlsbar: {
    path: "/sapporo/susukino/girlsbar",
    title: "すすきののガールズバー・ガルバ求人｜White Night Job",
    h1: "すすきののガールズバー・ガルバ求人",
    description:
      "すすきののガールズバー求人・ガルバ求人を探すならWhite Night Job。未経験歓迎や体験入店の案内がある求人を、時給・勤務条件・待遇タグから比較できます。掲載審査を通過した店舗情報をもとに、自分に合うすすきののガールズバーを見つけやすい求人サイトです。",
  },
  kotoniGirlsbar: {
    path: "/sapporo/kotoni/girlsbar",
    title: "琴似のガールズバー・ガルバ求人｜White Night Job",
    h1: "琴似のガールズバー・ガルバ求人",
    description:
      "琴似でガールズバーを探すならWhite Night Job。琴似エリアのガルバ・ガールズバー求人を掲載。時給・各種バック・日払い・送迎・体入などの条件を比較して、自分に合ったお店を探せます。",
  },
} as const;

export function assertSeoLandingParity(): string[] {
  const errors: string[] = [];
  const susukino = getPublishedSeoLanding("susukino", "girlsbar");
  const kotoni = getPublishedSeoLanding("kotoni", "girlsbar");
  const checks: Array<{
    name: string;
    actual: ReturnType<typeof getPublishedSeoLanding>;
    expected: (typeof SEO_LANDING_PARITY)[keyof typeof SEO_LANDING_PARITY];
  }> = [
    {
      name: "susukino/girlsbar",
      actual: susukino,
      expected: SEO_LANDING_PARITY.susukinoGirlsbar,
    },
    {
      name: "kotoni/girlsbar",
      actual: kotoni,
      expected: SEO_LANDING_PARITY.kotoniGirlsbar,
    },
  ];

  for (const check of checks) {
    if (!check.actual) {
      errors.push(`${check.name}: missing landing`);
      continue;
    }
    if (check.actual.path !== check.expected.path) {
      errors.push(
        `${check.name}: path ${check.actual.path} !== ${check.expected.path}`,
      );
    }
    if (check.actual.title !== check.expected.title) {
      errors.push(`${check.name}: title mismatch`);
    }
    if (check.actual.h1 !== check.expected.h1) {
      errors.push(`${check.name}: h1 mismatch`);
    }
    if (check.actual.description !== check.expected.description) {
      errors.push(`${check.name}: description mismatch`);
    }
  }
  return errors;
}

// Self-check helper — call from sitemap / tests. Do not run at module load
// (avoids circular init with build.ts).
