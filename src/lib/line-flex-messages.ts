import { SITE_URL } from "@/lib/site";
import type { Job } from "@/types/job";

const DEFAULT_HERO_IMAGE =
  "https://scdn.line-apps.com/n/channel_devcenter/img/fx/01_1_cafe.png";

type FlexMessage = {
  type: "flex";
  altText: string;
  contents: Record<string, unknown>;
};

type LineMessage = FlexMessage | { type: "text"; text: string };

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

function getJobHeroImage(job: Job): string {
  const candidate = job.imageUrl?.trim() || job.storeImages?.[0]?.trim();
  if (!candidate) return DEFAULT_HERO_IMAGE;
  if (candidate.startsWith("http://") || candidate.startsWith("https://")) {
    return candidate;
  }
  return `${SITE_URL}${candidate.startsWith("/") ? candidate : `/${candidate}`}`;
}

function benefitTags(job: Job, max = 3): string[] {
  return [...job.benefits, ...(job.otherBenefits ?? [])]
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, max);
}

function buildBenefitsText(job: Job, max = 4): string {
  const tags = benefitTags(job, max);
  if (tags.length === 0) return "待遇情報は詳細ページでご確認ください";
  return truncate(tags.join(" / "), 120);
}

function buildShopBubble(
  job: Job,
  options?: { benefitLimit?: number; showAddress?: boolean },
) {
  const detailUrl = `${SITE_URL}/jobs/${job.id}`;
  const favoriteUrl = `${SITE_URL}/api/favorites/from-line?jobId=${encodeURIComponent(job.id)}`;
  const benefitLimit = options?.benefitLimit ?? 4;
  const showAddress = options?.showAddress ?? true;

  const infoRows: Record<string, unknown>[] = [
    {
      type: "box",
      layout: "baseline",
      spacing: "sm",
      contents: [
        { type: "text", text: "エリア", color: "#8b6f3e", size: "sm", flex: 2 },
        {
          type: "text",
          text: `${job.area} ${job.district}`,
          wrap: true,
          size: "sm",
          flex: 5,
          color: "#333333",
        },
      ],
    },
    {
      type: "box",
      layout: "baseline",
      spacing: "sm",
      contents: [
        { type: "text", text: "職種", color: "#8b6f3e", size: "sm", flex: 2 },
        {
          type: "text",
          text: job.jobType,
          wrap: true,
          size: "sm",
          flex: 5,
          color: "#333333",
        },
      ],
    },
    {
      type: "box",
      layout: "baseline",
      spacing: "sm",
      contents: [
        { type: "text", text: "時給", color: "#8b6f3e", size: "sm", flex: 2 },
        {
          type: "text",
          text: job.salary,
          wrap: true,
          size: "sm",
          flex: 5,
          color: "#333333",
        },
      ],
    },
    {
      type: "box",
      layout: "baseline",
      spacing: "sm",
      contents: [
        { type: "text", text: "営業", color: "#8b6f3e", size: "sm", flex: 2 },
        {
          type: "text",
          text: job.businessHours?.trim() || job.workHours || "詳細ページ参照",
          wrap: true,
          size: "sm",
          flex: 5,
          color: "#333333",
        },
      ],
    },
  ];

  if (showAddress) {
    infoRows.push({
      type: "box",
      layout: "baseline",
      spacing: "sm",
      contents: [
        { type: "text", text: "住所", color: "#8b6f3e", size: "sm", flex: 2 },
        {
          type: "text",
          text: job.address?.trim() || "詳細ページ参照",
          wrap: true,
          size: "sm",
          flex: 5,
          color: "#333333",
        },
      ],
    });
  }

  const bodyContents: Record<string, unknown>[] = [
    {
      type: "text",
      text: truncate(job.shopName, 40),
      weight: "bold",
      size: "lg",
      wrap: true,
    },
    {
      type: "box",
      layout: "vertical",
      margin: "md",
      spacing: "xs",
      contents: infoRows,
    },
    {
      type: "text",
      text: buildBenefitsText(job, benefitLimit),
      size: "xs",
      color: "#666666",
      wrap: true,
      margin: "md",
    },
  ];

  if (job.managerComment?.trim()) {
    bodyContents.push({
      type: "box",
      layout: "vertical",
      margin: "md",
      backgroundColor: "#f8f4ea",
      cornerRadius: "md",
      paddingAll: "md",
      contents: [
        {
          type: "text",
          text: "店長から一言",
          size: "xs",
          color: "#8b6f3e",
          weight: "bold",
        },
        {
          type: "text",
          text: truncate(job.managerComment.trim(), 180),
          size: "sm",
          color: "#333333",
          wrap: true,
          margin: "sm",
        },
      ],
    });
  }

  return {
    type: "bubble",
    hero: {
      type: "image",
      url: getJobHeroImage(job),
      size: "full",
      aspectRatio: "20:13",
      aspectMode: "cover",
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: bodyContents,
    },
    footer: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      contents: [
        {
          type: "button",
          style: "primary",
          color: "#b8954d",
          action: {
            type: "uri",
            label: "詳しく見る",
            uri: detailUrl,
          },
        },
        {
          type: "button",
          style: "secondary",
          action: {
            type: "uri",
            label: "お気に入りに追加",
            uri: favoriteUrl,
          },
        },
      ],
    },
  };
}

const MAX_CAROUSEL_ITEMS = 10;

export function buildShopCarouselMessage(jobs: Job[], altText: string): LineMessage {
  if (jobs.length === 0) {
    return { type: "text", text: "お気に入り店舗がまだありません" };
  }

  const bubbles = jobs.slice(0, MAX_CAROUSEL_ITEMS).map((job) => buildShopBubble(job));
  return {
    type: "flex",
    altText,
    contents: {
      type: "carousel",
      contents: bubbles,
    },
  };
}

/** 毎日20時 PickUp 1店舗配信用 Flex */
export function buildDailyPickupFlexMessage(job: Job): FlexMessage {
  const bubble = buildShopBubble(job, { benefitLimit: 3, showAddress: false });
  return {
    type: "flex",
    altText: `今日のPickUp求人｜${job.shopName}`,
    contents: {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#111111",
        paddingAll: "16px",
        contents: [
          {
            type: "text",
            text: "今日のPickUp求人",
            color: "#d4bc8e",
            weight: "bold",
            size: "md",
          },
          {
            type: "text",
            text: "あなたが設定した地域から、本日のおすすめ店舗をご紹介します。",
            color: "#faf7f2",
            size: "xs",
            wrap: true,
            margin: "sm",
          },
        ],
      },
      hero: bubble.hero,
      body: bubble.body,
      footer: bubble.footer,
    },
  };
}
