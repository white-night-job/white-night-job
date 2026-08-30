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
  /** すすきの コンカフェ — worldview / costume focused (not a girlsbar clone). */
  "concept-cafe-worldview": {
    id: "concept-cafe-worldview",
    jobTypeDisplayPattern: "{jobTypeName}",
    title: "{areaName}の{jobTypeName}求人｜{brandName}",
    description:
      "{areaName}のコンカフェ求人を探すなら{brandName}。未経験からでも相談しやすい求人や体験入店の案内がある店舗を、時給・勤務条件・衣装・コンセプトから比較できます。",
    h1: "{areaName}の{jobTypeName}求人",
    displayName: "{jobTypeName}",
    breadcrumbLabel: "{jobTypeName}求人",
    intro: [
      "{areaName}でコンカフェ求人を探している方へ。{brandName}では、テーマや世界観のある接客をしたい方向けに、{areaName}のコンカフェ求人を掲載しています。時給・勤務条件・未経験歓迎・体験入店の案内など、店舗が登録した情報から比較できます。",
      "コンカフェは「どんな世界観の店か」「指定衣装で動けるか」が働きやすさに直結しやすい職種です。公開中の求人はページ内に表示され、新規公開や更新も反映されます。",
    ],
    guide: [
      "写真と紹介文でコンセプトをイメージしたうえで、シフト・衣装ルール・終業時間もセットで確認してください。世界観が好きでも、準備負担や出勤ペースが合わないと続きにくいことがあります。",
      "初めての方は、未経験歓迎や体験入店の案内がある求人から比較し、店内の空気感と衣装の動きやすさを体入で確かめてから本入店を判断するのが安心です。",
    ],
    contentSections: [
      {
        heading: "{areaName}でコンカフェ求人を探す",
        paragraphs: [
          "{areaName}でコンカフェ求人を探すときは、まず「可愛い・クール・アニメ寄りの世界観が好きか」など、自分が楽しめるコンセプトを決めておくと比較しやすくなります。同じコンカフェでも、カウンター接客中心の店と、演出やイベントが強い店では一日の流れが違います。",
          "{brandName}では掲載審査を通過した{areaName}のコンカフェ求人を公開しています。気になるお店は一覧から詳細を開き、時給・勤務条件・体験入店の案内を確認してください。",
        ],
      },
      {
        heading: "コンカフェの仕事内容",
        paragraphs: [
          "コンカフェの仕事は、店のコンセプトに沿った挨拶や会話、ドリンク提供、写真撮影の案内、イベント時の演出サポートなどが中心になることが多いです。ガールズバーのようにカウンター越しの会話が軸の店もあれば、衣装を着て世界観を演じる比重が大きい店もあります。",
          "具体的な業務は店舗ごとに登録内容が異なります。当サイトでは架空の仕事内容は書かず、求人票の紹介文と、あなた自身の体験入店での実感をもとに判断できる構成にしています。",
        ],
      },
      {
        heading: "時給、バック、待遇",
        paragraphs: [
          "コンカフェの時給・バック・待遇は店舗ごとに異なります。求人カードや詳細に出る時給、日払い、送迎、未経験歓迎などの情報は、各店舗が登録した実データです。平均時給などの統計は掲載していません。",
          "バックがある場合でも、対象（指名・ドリンク・イベント）や精算タイミングは店則次第です。タグが無い項目は「なし」と断定せず、詳細ページと店舗確認で実条件を確かめてください。",
        ],
      },
      {
        heading: "未経験から働く場合",
        paragraphs: [
          "未経験から{areaName}のコンカフェで働く場合は、未経験歓迎の求人を起点に、世界観の説明が丁寧な店舗や体験入店のある店舗から探す流れが一般的です。セリフやポーズに慣れるまで時間がかかることもあるため、初日に完璧を求めすぎない店舗かを事前に聞くと安心です。",
          "初めての方向けガイドやコンカフェの仕事内容コラムもあわせて読むと、衣装・演出・接客のイメージが整理しやすくなります。",
        ],
      },
      {
        heading: "体験入店",
        paragraphs: [
          "{areaName}でコンカフェの体験入店（体入）を考えるなら、体入時給・時間・指定衣装の有無・ヘアメイクの要否を先に確認してください。体入では接客だけでなく、「その衣装で何時間動けるか」「世界観に自分を置けるか」を見るのがポイントです。",
          "当サイトでは実在しない体入条件は表示しません。案内の有無は求人票と店舗への相談で確認し、合わないと感じたら本入店を急がなくて構いません。",
        ],
      },
      {
        heading: "衣装やコンセプト",
        paragraphs: [
          "コンカフェ選びでは、衣装とコンセプトの相性が続けやすさに大きく影響します。レンタルがある店、自前準備が必要な店、ヒールの高さやウィッグの有無は求人によって違うため、写真だけでなく待遇欄の衣装関連タグも見てください。",
          "「好きな世界観」と「毎日着られる負担」は別物です。体入で実際に着てみて、違和感が強い場合は別コンセプトの求人を比較するのがおすすめです。",
        ],
      },
      {
        heading: "シフト、学生、Wワーク",
        paragraphs: [
          "学生やWワークで{areaName}のコンカフェを探す場合は、週1出勤OK、短時間勤務、終電を意識した営業時間かを求人票で確認してください。イベント前日の準備や休日の撮影会がある店舗では、通常シフト以外の拘束が出ることもあります。",
          "希望の出勤ペースは応募前に具体的に伝えてください。入れる曜日が限られる場合でも、条件が合う求人から比較できます。",
        ],
      },
      {
        heading: "求人を比較するときのポイント",
        paragraphs: [
          "比較するときは、時給だけでなくコンセプト・衣装負担・シフト・送迎・ノルマの有無を横並びで見てください。{brandName}では店舗の登録情報を並べて確認できるため、未経験の方でも応募前に情報を整理しやすい構成です。",
          "求人内容と説明が違うと感じた場合は、無理に進めず体験入店や応募を見送って構いません。納得できる世界観と条件の店舗を選ぶことが、長く働くうえでの第一歩です。",
        ],
      },
    ],
    faqHeading: "{areaName}のコンカフェ求人に関するよくある質問",
    faqs: [
      {
        question: "{areaName}のコンカフェは未経験でも働けますか？",
        answer:
          "未経験歓迎のコンカフェ求人を掲載している場合があります。世界観や衣装のルールは店舗差が大きいため、求人詳細の待遇タグと紹介文を確認し、研修や体入の有無は店舗へ事前相談してください。",
      },
      {
        question: "コンカフェの時給や勤務条件はどう確認すればよいですか？",
        answer:
          "時給・勤務条件は店舗・シフト・経験によって異なります。各求人票に掲載されている給与と勤務時間をご確認ください。当サイトでは平均時給などの架空数値は表示していません。",
      },
      {
        question: "体験入店では何を見ればよいですか？",
        answer:
          "接客の流れにくわえ、指定衣装の動きやすさ、ヘアメイクの負担、スタッフの教え方、客層の印象を見てください。体入時給や時間、持ち物は事前に店舗へ確認してから日程を決めるのが安心です。",
      },
      {
        question: "衣装はレンタルですか？自前ですか？",
        answer:
          "店舗によります。衣装レンタルありや私服OKなどのタグがある求人では、その記載を手がかりにできます。タグが無い場合は「必ずレンタル」とは限らないため、詳細と店舗確認で実条件を確かめてください。",
      },
      {
        question: "学生やWワークでもコンカフェに応募できますか？",
        answer:
          "週1出勤OKやWワーク歓迎などの待遇がある求人から探せます。イベント準備や休日出勤の有無は店舗ごとに異なるため、学業・本業と重なる曜日を先に伝えて確認してください。",
      },
      {
        question: "コンカフェとガールズバーはどう違いますか？",
        answer:
          "コンカフェは店の世界観や衣装・演出の比重が大きいことが多く、ガールズバーはカウンター越しの会話中心になりやすい傾向があります。どちらが合うかは体入での実感が分かりやすいので、職種ページの求人を見比べてください。",
      },
    ],
    detailTitleSegment: "{areaName}の{jobTypeName}",
    detailDescriptionSegment: "{areaName}の{jobTypeName}",
    listLinkLabel: "{areaName}の{jobTypeName}求人を見る",
  },
};

export function getSeoCopyProfile(id: string): SeoCopyProfile | undefined {
  return seoCopyProfiles[id];
}
