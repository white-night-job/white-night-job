import { SITE_URL } from "@/lib/site";
import type { Job } from "@/types/job";

const MAX_CAROUSEL_ITEMS = 10;
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

function buildBenefitsText(job: Job): string {
  const tags = [...job.benefits, ...(job.otherBenefits ?? [])].filter(Boolean);
  if (tags.length === 0) return "待遇情報は詳細ページでご確認ください";
  return truncate(tags.slice(0, 4).join(" / "), 120);
}

function buildShopBubble(job: Job) {
  const detailUrl = `${SITE_URL}/jobs/${job.id}`;
  const favoriteUrl = `${SITE_URL}/api/favorites/from-line?jobId=${encodeURIComponent(job.id)}`;
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
      contents: [
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
            { type: "text", text: job.jobType, wrap: true, size: "sm", flex: 5, color: "#333333" },
          ],
        },
        {
          type: "box",
          layout: "baseline",
          spacing: "sm",
          contents: [
            { type: "text", text: "時給", color: "#8b6f3e", size: "sm", flex: 2 },
            { type: "text", text: job.salary, wrap: true, size: "sm", flex: 5, color: "#333333" },
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
        {
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
        },
      ],
    },
    {
      type: "text",
      text: buildBenefitsText(job),
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
            label: "お気に入り登録",
            uri: favoriteUrl,
          },
        },
      ],
    },
  };
}

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
