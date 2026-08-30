import type { SeoLandingPageDef } from "@/lib/seo-landing/types";

/**
 * Published area × jobType landings managed by the shared SEO template.
 *
 * To add 北24条 × ガールズバー later, append ONE object:
 *   { area: "kita24jo", jobType: "girlsbar", published: true, profile: "girlsbar-name-first", showInGlobalNav: true, globalNavLabel: "{areaName}の{jobTypeName}求人", footerNavLabel: "{areaName}の{jobTypeAlias}求人" }
 *
 * Do NOT set published:true until you intentionally launch the page.
 */
export const seoLandingPages: SeoLandingPageDef[] = [
  {
    area: "susukino",
    jobType: "girlsbar",
    published: true,
    profile: "girlsbar-alias-first",
    showInGlobalNav: true,
    /** Top / area nav anchor */
    globalNavLabel: "{areaName}の{jobTypeName}求人",
    footerNavLabel: "{areaName}の{jobTypeName}求人",
    overrides: {
      jobTypeDisplayPattern: "{jobTypeName}・{jobTypeAlias}",
      title: "{areaName}の{jobTypeName}・{jobTypeAlias}求人｜{brandName}",
      h1: "{areaName}の{jobTypeName}・{jobTypeAlias}求人",
      description:
        "{areaName}のガールズバー求人・ガルバ求人を探すなら{brandName}。未経験歓迎や体験入店の案内がある求人を、時給・勤務条件・待遇タグから比較できます。掲載審査を通過した店舗情報をもとに、自分に合う{areaName}のガールズバーを見つけやすい求人サイトです。",
      displayName: "{jobTypeDisplay}",
      breadcrumbLabel: "{jobTypeName}・{jobTypeAlias}求人",
      intro: [
        "{areaName}でガールズバー求人を探している方へ。{brandName}では、{areaName}のガルバ求人もあわせて比較できるよう、時給・勤務条件・未経験歓迎・体験入店の有無など、店舗が登録した情報をもとに求人を探せます。",
        "会話中心の接客が多い一方、店舗ごとのルールや雰囲気は異なります。公開中の求人一覧から詳細を開き、条件を確認してから応募・相談へ進んでください。新規公開や更新も一覧へ反映されます。",
      ],
      guide: [
        "初めての方は、未経験歓迎のタグがある求人や、体験入店の案内がある店舗から比較するのがおすすめです。写真・紹介文・待遇・時給をセットで確認しましょう。",
        "{brandName}は掲載審査を通過した店舗の求人を公開しています。条件の最終確認は求人詳細と店舗への事前質問で行い、納得してから体験入店へ進むと安心です。",
      ],
      contentSections: [
        {
          heading: "{areaName}でガールズバー求人を探すなら",
          paragraphs: [
            "{areaName}でガールズバー求人を探すなら、希望の出勤ペースや終電、お酒の対応可否など、自分が大切にしたい条件を先に決めておくと比較しやすくなります。店舗数が多く雰囲気の差も大きいため、求人票の時給・待遇タグ・紹介文をあわせて見るのがおすすめです。",
            "{brandName}では、優良店を探しやすいよう掲載審査を通過した店舗の情報を公開しています。気になるお店は一覧から詳細へ進み、勤務条件や体験入店の案内を確認してください。",
          ],
        },
        {
          heading: "{areaName}のガールズバーの仕事内容",
          paragraphs: [
            "{areaName}のガールズバー（ガルバ）は、カウンター越しの会話やドリンク提供を中心にした接客が多い職種です。店舗によって客層やルール、忙しさは異なるため、求人詳細の紹介文や写真で雰囲気をイメージし、不明点は応募前に質問するのが安心です。",
            "仕事の進め方や研修の有無は店舗ごとに登録内容が異なります。当サイトでは架空の業務内容は記載せず、各店舗が公開した情報と、あなた自身の事前確認をもとに判断できる構成にしています。",
          ],
        },
        {
          heading: "{areaName}のガールズバーの時給・バック・待遇",
          paragraphs: [
            "{areaName}のガールズバーの時給・バック・待遇は店舗ごとに異なります。求人カードや詳細ページに表示される時給・日払い・送迎・未経験歓迎などの情報は、各店舗が登録した実データです。平均時給や店舗数などの統計は掲載していません。",
            "待遇タグがある求人では、日払いOK・送迎あり・週1出勤OK・衣装レンタルありなどを比較の手がかりにできます。タグが無い項目は「なし」と断定せず、詳細ページや店舗確認で実条件を確かめてください。",
          ],
        },
        {
          heading: "未経験から{areaName}のガールズバーで働くには",
          paragraphs: [
            "未経験から{areaName}のガールズバーで働く場合は、未経験歓迎の求人を起点に、体験入店で店内の空気感を確かめる流れが一般的です。会話中心の接客が多い一方、ルールや客層は店舗差があるため、求人条件を確認しやすい{brandName}の詳細ページで不安点を整理してから相談しましょう。",
            "初めての方向けガイドやコラムもあわせて読むと、職種のイメージや体入時の確認ポイントが整理しやすくなります。焦って即決せず、比較しながら進めてください。",
          ],
        },
        {
          heading: "{areaName}で体験入店できるガールズバーを探す",
          paragraphs: [
            "{areaName}で体験入店できるガールズバーを探すなら、求人詳細の案内や待遇の記載を確認し、LINEや電話で日程を相談するのがおすすめです。体入時給・衣装・勤務時間は店舗ごとに異なるため、当サイトでは実在しない条件を表示しません。",
            "本入店の前に雰囲気を確かめられるため、未経験の方や店舗選びに迷っている方にも向いています。公開中一覧から条件が合うお店を比較してみてください。",
          ],
        },
        {
          heading: "{areaName}で自分に合ったガールズバー求人を選ぶポイント",
          paragraphs: [
            "選ぶときは、時給だけでなく通いやすさ・シフトの柔軟さ・送迎・衣装・ノルマの有無など、続けやすさに関わる条件をセットで見ることが大切です。{brandName}では店舗情報を並べて比較できるため、未経験者でも応募前に情報を確認しやすい構成になっています。",
            "求人内容と実際の説明が違うと感じた場合は、無理に進めず応募や体験入店を見送って構いません。納得できる条件の店舗を選ぶことが、長く働くうえでの第一歩です。",
          ],
        },
      ],
      faqHeading: "{areaName}のガールズバー求人に関するよくある質問",
      faqs: [
        {
          question: "{areaName}のガールズバーは未経験でも働けますか？",
          answer:
            "未経験歓迎の求人を掲載している場合があります。求人詳細の待遇タグや紹介文で「未経験者大歓迎」などの記載を確認し、研修やフォローの有無は店舗への事前相談で確かめてください。",
        },
        {
          question: "{areaName}のガールズバーの時給はどのくらいですか？",
          answer:
            "時給は店舗・シフト・経験によって異なります。各求人票に掲載されている給与情報をご確認ください。当サイトでは平均時給などの架空数値は表示していません。",
        },
        {
          question: "体験入店できる求人はありますか？",
          answer:
            "体験入店（体入）の案内がある求人があります。詳細ページの記載を確認し、体入時給や勤務時間、持ち物は事前に店舗へ確認してから日程を決めてください。",
        },
        {
          question: "学生やWワークでも応募できますか？",
          answer:
            "週1出勤OKやWワーク歓迎などの待遇がある求人から探せます。実際に入れるシフトや学業・本業との両立可否は店舗ごとに異なるため、応募前に希望の出勤ペースを伝えて確認してください。",
        },
        {
          question: "ガールズバーとニュークラ・スナックの違いは？",
          answer:
            "ガールズバーはカウンター越しの会話中心の接客が多い一方、ニュークラは席での接客やドレスコードの差が出やすい職種、スナックは地域密着の落ち着いた接客が多い傾向があります。詳しくは職種ごとの求人ページやコラムで比較できます。",
        },
        {
          question: "求人を選ぶときは何を確認すればいいですか？",
          answer:
            "時給・勤務時間・日払い・送迎・未経験歓迎・衣装・ノルマの有無など、求人詳細に記載された条件を確認してください。不明点は応募前に店舗へ質問し、必要なら体験入店で雰囲気も確かめるとミスマッチを減らしやすくなります。",
        },
      ],
      listLinkLabel: "{areaName}の{jobTypeName}求人を見る",
      detailTitleSegment: "{areaName}の{jobTypeName}・{jobTypeAlias}",
      detailDescriptionSegment: "{areaName}の{jobTypeName}・{jobTypeAlias}",
    },
  },
  {
    area: "kotoni",
    jobType: "girlsbar",
    published: true,
    profile: "girlsbar-name-first",
    showInGlobalNav: true,
    globalNavLabel: "{areaName}の{jobTypeName}求人",
    footerNavLabel: "{areaName}の{jobTypeAlias}求人",
  },
  {
    area: "susukino",
    jobType: "concept-cafe",
    published: true,
    profile: "concept-cafe-worldview",
    showInGlobalNav: true,
    globalNavLabel: "{areaName}の{jobTypeName}求人",
    footerNavLabel: "{areaName}の{jobTypeName}求人",
  },
  // Examples (unpublished — keep commented or published:false):
  // { area: "kita24jo", jobType: "girlsbar", published: false, profile: "girlsbar-name-first" },
  // { area: "teine", jobType: "girlsbar", published: false, profile: "girlsbar-name-first" },
  // { area: "susukino", jobType: "concafe", published: false, profile: "…" },
];
