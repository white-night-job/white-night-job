import type { SeoCopyProfile } from "@/lib/seo-landing/types";

/**
 * Copy profiles use {areaName} {jobTypeName} {jobTypeAlias} {jobTypeDisplay} {brandName}.
 * Susukino / Kotoni girlsbar profiles are tuned so interpolated output matches
 * the previously hand-written pages exactly.
 */
export const seoCopyProfiles: Record<string, SeoCopyProfile> = {
  /** すすきの girlsbar — alias first (ガルバ・ガールズバー) */
  "girlsbar-alias-first": {
    id: "girlsbar-alias-first",
    jobTypeDisplayPattern: "{jobTypeAlias}・{jobTypeName}",
    title: "{areaName}の{jobTypeDisplay}求人｜{brandName}",
    description:
      "{areaName}で{jobTypeAlias}・{jobTypeName}求人を探すなら{brandName}。独自審査を通過した優良店を掲載。時給・各種バック・日払い・送迎・体入などの条件から、自分に合った{areaName}の{jobTypeAlias}求人を探せます。",
    h1: "{areaName}の{jobTypeDisplay}求人",
    displayName: "{jobTypeDisplay}",
    breadcrumbLabel: "{jobTypeDisplay}求人",
    intro: [
      "{areaName}で{jobTypeAlias}・{jobTypeName}の求人を探している方へ。{brandName}では、{areaName}エリアの{jobTypeAlias}求人を掲載しています。時給や各種バック、日払い、送迎、ノルマ、勤務時間、体験入店などを比較しながら、自分に合ったお店を探せます。",
      "{areaName}は札幌を代表する歓楽街で、{jobTypeName}（通称{jobTypeAlias}）の店舗も多く、雰囲気や客層、働き方の幅が広いのが特徴です。公開中の求人はページ内に自動で表示され、新規公開・更新時も反映されます。",
    ],
    guide: [
      "初めての方は、未経験歓迎や体験入店（体入）ありの求人から比較するのがおすすめです。店舗ごとの客層やルールは異なるため、写真・紹介文・待遇欄をセットで確認しましょう。",
      "日払い・送迎・ノルマなしなどの条件は求人ごとに異なります。気になる店舗には応募前に質問し、納得してから体験入店へ進むと安心です。",
    ],
    contentSections: [
      {
        heading: "{areaName}で{jobTypeAlias}を探すなら",
        paragraphs: [
          "{areaName}で{jobTypeAlias}を探すなら、希望の出勤日数や終電、お酒の対応可否など、自分が大切にしたい条件を先に決めておくと比較しやすくなります。店舗数が多く雰囲気の差も大きいため、求人票の紹介文と待遇をあわせて見るのがおすすめです。",
          "{brandName}では掲載審査を通過した{areaName}の{jobTypeName}求人のみを公開しています。気になるお店は一覧から詳細を開き、時給やシフト、体入の有無を確認してみてください。",
        ],
      },
      {
        heading: "{areaName}の{jobTypeAlias}の時給・待遇",
        paragraphs: [
          "{areaName}の{jobTypeAlias}の時給・待遇は店舗ごとに異なります。時給のほか、各種バック、日払い、送迎、ノルマの有無などが求人票に記載されています。表示内容は各店舗が登録した情報です。架空の条件は掲載していません。",
          "待遇タグ（未経験歓迎・日払いOK・送迎あり・ノルマなしなど）から、自分の働き方に近い{jobTypeAlias}求人へ絞り込むこともできます。精算タイミングや送迎範囲は、応募前の店舗確認が安心です。",
        ],
      },
      {
        heading: "未経験でも働ける{areaName}の{jobTypeAlias}",
        paragraphs: [
          "未経験でも働ける{areaName}の{jobTypeAlias}求人があります。会話中心の接客が多い一方、店舗によってルールや客層は異なるため、未経験歓迎の求人や研修・体入のある店舗から探すのが一般的です。",
          "不安な点は求人詳細と事前相談で確認し、納得してから応募・体験入店へ進みましょう。初めての方向けガイドやコラムもあわせてご覧ください。",
        ],
      },
      {
        heading: "{areaName}で体入できる{jobTypeAlias}を探す",
        paragraphs: [
          "{areaName}で体入（体験入店）できる{jobTypeAlias}を探すなら、求人詳細の案内を確認し、LINEや電話で日程を相談するのがおすすめです。体入時給・衣装・勤務時間は店舗ごとに異なります。",
          "本入店の前に店内の雰囲気を確かめられるため、初めての方や店舗選びで迷っている方にも向いています。公開中一覧から条件が合うお店を比較してみてください。",
        ],
      },
    ],
    faqHeading: "{areaName}の{jobTypeAlias}求人に関するよくある質問",
    faqs: [
      {
        question: "{areaName}の{jobTypeAlias}は未経験でも働ける？",
        answer:
          "はい。未経験歓迎の{jobTypeName}（{jobTypeAlias}）求人を掲載しています。研修やフォローの有無は店舗ごとに異なるため、求人詳細と事前相談で確認してください。",
      },
      {
        question: "{areaName}の{jobTypeAlias}の時給は？",
        answer:
          "時給は店舗・シフト・経験によって異なります。各求人票に掲載されている給与情報をご確認ください。当サイトでは架空の時給は表示していません。",
      },
      {
        question: "日払いできる{jobTypeAlias}はある？",
        answer:
          "日払いOKの{jobTypeAlias}求人があります。支払いのタイミングは店舗ルールによるため、詳細ページと応募前の確認で実条件を確かめてください。",
      },
      {
        question: "送りがある{jobTypeAlias}はある？",
        answer:
          "送迎（送り）ありの求人を掲載しています。対応エリアや終電後の条件は店舗ごとに異なるため、応募前に確認するのが安心です。",
      },
      {
        question: "体験入店できる？",
        answer:
          "体験入店（体入）を受け付けている{areaName}の{jobTypeAlias}があります。体入時給や勤務時間、必要な持ち物は事前に店舗へ確認してから日程を決めてください。",
      },
      {
        question: "ノルマなしの{jobTypeAlias}はある？",
        answer:
          "ノルマなしと記載のある求人もあります。同伴や売上に関するルールは店舗差が大きいため、求人票の確認と事前質問をおすすめします。",
      },
    ],
    detailTitleSegment: "{areaName}の{jobTypeAlias}・{jobTypeName}",
    detailDescriptionSegment: "{areaName}の{jobTypeAlias}・{jobTypeName}",
    listLinkLabel: "{areaName}の{jobTypeAlias}求人一覧を見る",
  },

  /** 琴似 girlsbar — name first (ガールズバー・ガルバ). Reuse for 北24条/手稲 later. */
  "girlsbar-name-first": {
    id: "girlsbar-name-first",
    jobTypeDisplayPattern: "{jobTypeName}・{jobTypeAlias}",
    title: "{areaName}の{jobTypeDisplay}求人｜{brandName}",
    description:
      "{areaName}で{jobTypeName}を探すなら{brandName}。{areaName}エリアの{jobTypeAlias}・{jobTypeName}求人を掲載。時給・各種バック・日払い・送迎・体入などの条件を比較して、自分に合ったお店を探せます。",
    h1: "{areaName}の{jobTypeDisplay}求人",
    displayName: "{jobTypeDisplay}",
    breadcrumbLabel: "{jobTypeName}求人",
    intro: [
      "{areaName}で{jobTypeName}を探している方へ。{brandName}では、札幌・{areaName}エリアの{jobTypeAlias}・{jobTypeName}求人を掲載しています。時給や各種バック、日払い、送迎、ノルマ、勤務時間、体験入店などの条件を比較しながら、自分に合ったお店を探せます。",
      "{areaName}は地下鉄やJRでのアクセスを活かしやすく、すすきのより落ち着いた雰囲気の{jobTypeAlias}（{jobTypeName}）を検討する方にも選ばれやすいエリアです。公開中の求人はページ内に自動で表示され、新規公開・更新時も反映されます。",
    ],
    guide: [
      "初めての方は、未経験歓迎や体験入店（体入）ありの求人から比較するのがおすすめです。店舗ごとの客層やルールは異なるため、写真・紹介文・待遇欄をセットで確認しましょう。",
      "日払い・送迎・ノルマなしなどの条件は求人ごとに異なります。気になる店舗には応募前に質問し、納得してから体験入店へ進むと安心です。",
    ],
    contentSections: [
      {
        heading: "{areaName}で{jobTypeName}を探すなら",
        paragraphs: [
          "{areaName}で{jobTypeName}を探すなら、通勤手段と希望の出勤ペースを先に決めておくと比較しやすくなります。地域密着の店舗も多いため、写真や紹介文から雰囲気を想像しつつ、待遇タグで条件を絞るのがおすすめです。",
          "{brandName}では掲載審査を通過した{areaName}の{jobTypeName}（{jobTypeAlias}）求人のみを公開しています。気になるお店は一覧から詳細を開き、時給・シフト・体入の有無を確認してください。",
        ],
      },
      {
        heading: "{areaName}の{jobTypeName}の時給・待遇",
        paragraphs: [
          "{areaName}の{jobTypeName}の時給・待遇は店舗ごとに異なります。時給のほか、各種バック、日払い、送迎、ノルマの有無などが求人票に記載されています。表示内容は各店舗が登録した情報で、架空の平均時給や統計は掲載していません。",
          "未経験歓迎・日払いOK・送迎あり・ノルマなしなどのタグから、自分の働き方に近い{areaName}の{jobTypeAlias}求人へ絞り込むこともできます。精算タイミングや送迎範囲は、応募前の店舗確認が安心です。",
        ],
      },
      {
        heading: "未経験から{areaName}の{jobTypeName}で働くには",
        paragraphs: [
          "未経験から{areaName}の{jobTypeName}で働く場合は、未経験歓迎の求人や研修・体験入店のある店舗から探すのが一般的です。会話中心の接客が多い一方、ルールや客層は店舗差があるため、詳細ページと事前相談で不安点を解消してから進みましょう。",
          "初めての方向けガイドやコラムもあわせて読むと、職種のイメージや体入時の確認ポイントが整理しやすくなります。",
        ],
      },
      {
        heading: "{areaName}で体験入店できる{jobTypeName}を探す",
        paragraphs: [
          "{areaName}で体験入店（体入）できる{jobTypeName}を探すなら、求人詳細の案内を確認し、LINEや電話で日程を相談するのがおすすめです。体入時給・衣装・勤務時間は店舗ごとに異なります。",
          "本入店の前に店内の雰囲気を確かめられるため、初めての方や店舗選びに迷っている方にも向いています。公開中一覧から条件が合うお店を比較してみてください。",
        ],
      },
    ],
    faqHeading: "{areaName}の{jobTypeName}求人に関するよくある質問",
    faqs: [
      {
        question: "{areaName}の{jobTypeName}は未経験でも働ける？",
        answer:
          "はい。未経験歓迎の{jobTypeName}（{jobTypeAlias}）求人を掲載している場合があります。研修やフォローの有無は店舗ごとに異なるため、求人詳細と事前相談で確認してください。",
      },
      {
        question: "{areaName}の{jobTypeAlias}の時給は？",
        answer:
          "時給は店舗・シフト・経験によって異なります。各求人票に掲載されている給与情報をご確認ください。当サイトでは架空の平均時給は表示していません。",
      },
      {
        question: "日払いできる{jobTypeName}はある？",
        answer:
          "日払いOKの{jobTypeAlias}・{jobTypeName}求人がある場合があります。支払いのタイミングは店舗ルールによるため、詳細ページと応募前の確認で実条件を確かめてください。",
      },
      {
        question: "送りがある{jobTypeName}はある？",
        answer:
          "送迎（送り）ありの求人を掲載している場合があります。対応エリアや終電後の条件は店舗ごとに異なるため、応募前に確認するのが安心です。",
      },
      {
        question: "体験入店できる？",
        answer:
          "体験入店（体入）を受け付けている{areaName}の{jobTypeName}があります。体入時給や勤務時間、必要な持ち物は事前に店舗へ確認してから日程を決めてください。",
      },
      {
        question: "ノルマなしの{jobTypeAlias}はある？",
        answer:
          "ノルマなしの求人がある場合があります。ルールの詳細は店舗ごとに異なるため、応募前に質問して確認してください。",
      },
    ],
    detailTitleSegment: "{areaName}の{jobTypeName}・{jobTypeAlias}",
    detailDescriptionSegment: "{areaName}の{jobTypeName}・{jobTypeAlias}",
    listLinkLabel: "{areaName}の{jobTypeName}求人一覧を見る",
  },
};

export function getSeoCopyProfile(id: string): SeoCopyProfile | undefined {
  return seoCopyProfiles[id];
}
