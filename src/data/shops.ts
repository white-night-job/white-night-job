export const shops = {
  "sapporo-rosetta": {
    name: "ニュークラブ ロゼッタ",
    lineUrl: "https://line.me/R/ti/p/@example-sapporo-rosetta",
  },
  "sapporo-aurora": {
    name: "ニュークラブ オーロラ",
    lineUrl: "https://line.me/R/ti/p/@example-sapporo-aurora",
  },
  "sapporo-blanc": {
    name: "Club BLANC 札幌",
    lineUrl: "https://line.me/R/ti/p/@example-sapporo-blanc",
  },
  lumiere: {
    name: "Bar Lumière",
    lineUrl: "https://line.me/R/ti/p/@example-lumiere",
  },
  prestige: {
    name: "Lounge Prestige",
    lineUrl: "https://line.me/R/ti/p/@example-prestige",
  },
  "snack-hana": {
    name: "スナック 花",
    lineUrl: "https://line.me/R/ti/p/@example-snack-hana",
  },
} as const;

export type ShopId = keyof typeof shops;
