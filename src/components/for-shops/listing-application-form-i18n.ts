/** UTF-8 Japanese copy for ListingApplicationForm (keep this file UTF-8). */

export const FORM_I18N = {
  steps: [
    "店舗基本情報",
    "担当者情報",
    "SNS・Web情報",
    "営業・許可情報",
    "希望プラン",
    "確認事項",
    "店舗画像",
    "内容確認",
  ] as const,

  planSuffix: "プラン",
  planPricePrefix: "月額",
  planPriceSuffix: "（税込）",
  emDash: "—",

  errGeneric: "入力内容にエラーがあります。赤字の項目をご確認ください。",
  errShopName: "店舗名を入力してください。",
  errShopAddress: "店舗住所を入力してください。",
  errBusinessType: "業種を入力してください。",
  errBusinessHours: "営業時間を入力してください。",
  errShopPhoneRequired: "店舗電話番号を入力してください。",
  errShopPhoneFormat: "店舗電話番号の形式が正しくありません",
  errContactName: "担当者名を入力してください。",
  errContactPhoneRequired: "担当者電話番号を入力してください。",
  errContactPhoneFormat: "担当者電話番号の形式が正しくありません",
  errContactEmailRequired: "担当者メールアドレスを入力してください。",
  errContactEmailFormat: "メールアドレスの形式が正しくありません",
  errApplicantType: "申請者区分を選択してください。",
  errCorporateName: "法人名を入力してください。",
  errCorporateNameKana: "法人名フリガナを入力してください。",
  errRepresentativeName: "代表者名を入力してください。",
  errIdentityDocument:
    "顔写真付き身分証明書をアップロードしてください",
  errWebsiteRequired: "公式WebサイトまたはSNSのURLを入力してください。",
  errWebsiteFormat: "正しいURLを入力してください。",
  errBusinessLicense: "営業許可証をアップロードしてください。",
  errOpenDate: "オープン日を入力してください。",
  errPlan: "料金プランを選択してください",
  errConsentAccuracy:
    "求人内容と実際の勤務条件に相違がないことへの同意が必要です。",
  errConsentTerms: "利用規約・プライバシーポリシーへの同意が必要です。",
  errConsentAntisocial:
    "反社会的勢力に該当しないことの確認が必要です。",
  errShopImagesBoth: "店舗外観と店舗内観の画像をアップロードしてください",
  errShopExterior: "店舗外観の画像をアップロードしてください",
  errShopInterior: "店舗内観の画像をアップロードしてください",

  uploadFailed: "アップロードに失敗しました。",
  imageBucketMissing:
    "画像の保存先が設定されていません。管理者へお問い合わせください。",
  imageBucketMissingNeedle: "画像の保存先が設定されていません",
  imageUploadFailed:
    "画像のアップロードに失敗しました。もう一度お試しください。",
  exteriorMax: "店舗外観は最大5枚までです。",
  interiorMax: "店舗内観は最大10枚までです。",
  duplicateFound:
    "同じ店舗名またはメールアドレスの申請が見つかりました。内容を確認してください。",
  duplicateShort: "同じ店舗名またはメールアドレスの申請が見つかりました。",
  applyFailed: "申請に失敗しました。",
  confirmAndSubmit: "内容を確認して送信する",

  optional: "（任意）",
  selectFile: "ファイルを選択",
  formatLabel: "形式",
  sizeLabel: "サイズ",
  uploaded: "アップロード済み",
  uploading: "アップロード中...",
  change: "変更する",
  remove: "削除する",
  removeShort: "削除",
  noPreview: "プレビューなし",
  add: "追加",
  plus: "＋",
  loading: "読み込み中...",
  stepPrefix: "ステップ",
  stepSeparator: "：",
  selected: "✓ 選択中",

  headingShopBasic: "1. 店舗基本情報",
  labelShopName: "店舗名 *",
  labelShopAddress: "店舗住所 *",
  phShopAddress: "例：札幌市中央区南◯条西◯丁目",
  labelArea: "エリア（任意）",
  phArea: "例：すすきの",
  labelBusinessType: "業種 *",
  phBusinessType: "例：ニュークラブ",
  labelBusinessHours: "営業時間 *",
  phBusinessHours: "例：20:00〜LAST",
  labelShopPhone: "店舗電話番号 *",

  headingContact: "2. 担当者情報",
  labelContactName: "担当者名 *",
  labelContactPhone: "担当者電話番号 *",
  labelContactEmail: "担当者メールアドレス *",
  labelApplicantType: "申請者区分 *",
  applicantIndividual: "個人事業主",
  applicantCorporation: "法人",
  labelCorporateName: "法人名 *",
  labelCorporateNameKana: "法人名フリガナ *",
  labelRepresentativeName: "代表者名 *",
  identityHeading: "顔写真付き身分証明書",
  identityUploadTitle: "顔写真付き身分証明書をアップロードしてください",
  identityUploadHint:
    "運転免許証・マイナンバーカード・パスポート・在留カードなど（JPEG / PNG / PDF、1ファイル10MBまで）",
  identityFrontLabel: "表面",
  identityBackLabel: "裏面",
  identityBackHint: "裏面がある場合はアップロードしてください。",

  headingSns: "3. SNS・Web情報",
  snsUrlHint: "URLは https:// から始まる形式で入力してください。",
  labelWebsite: "公式Webサイト（Instagram等可） *",
  phWebsite: "例：https://example.com",
  websiteHelp:
    "店舗の確認ができる公式サイトやSNS（Instagram / X / TikTok等）のURLを入力してください。",
  labelInstagram: "Instagram（任意）",
  labelX: "X（任意）",
  labelTiktok: "TikTok（任意）",
  labelLine: "LINE公式アカウント（任意）",
  labelYoutube: "YouTube（任意）",
  labelOtherSns: "その他SNS（任意）",

  headingLicense: "4. 営業・許可情報",
  docBusinessLicense: "営業許可証",
  docBusinessLicenseHint: "店舗の営業許可証をアップロードしてください。",
  docEntertainment: "風俗営業許可証（社交飲食店営業許可証）",
  docLateNight: "深夜酒類提供飲食店営業・開始届出（受領書）",
  labelOpenDate: "オープン日 *",

  headingPlan: "5. 希望プラン",
  planHint: "審査承認後に最終確定します。この時点では料金請求は確定しません。",

  headingConsent: "6. 確認事項",
  consentAccuracyText:
    "求人内容と実際の勤務条件に相違がないことに同意します。*",
  termsLink: "利用規約",
  privacyLink: "プライバシーポリシー",
  consentTermsJoiner: "、",
  consentTermsSuffix: "に同意します。*",
  consentAntisocialText:
    "申請者、代表者、役員および実質的経営者は、反社会的勢力に該当せず、関係も有していません。*",

  headingImages: "7. 店舗画像",
  imagesHint: "店舗の外観と内観が分かる画像をアップロードしてください。",
  exteriorTitle: "店舗外観",
  exteriorDesc: "店舗の入口や建物外観が分かる画像をアップロードしてください。",
  interiorTitle: "店舗内観",
  interiorDesc: "店内の雰囲気や設備が分かる画像をアップロードしてください。",

  headingConfirm: "8. 内容確認",
  dtShopName: "店舗名",
  dtAddress: "所在地",
  dtBusinessType: "業種",
  dtBusinessHours: "営業時間",
  dtContact: "担当者",
  dtApplicantType: "申請者区分",
  dtCorporateName: "法人名",
  dtCorporateNameKana: "法人名フリガナ",
  dtRepresentativeName: "代表者名",
  dtIdentityDocument: "顔写真付き身分証明書",
  dtPlan: "選択プラン",
  notSelected: "未選択",
  dtMonthly: "月額料金",
  taxIncluded: "（税込）",
  dtBusinessLicense: "営業許可証",
  dtEntertainment: "風俗営業許可証",
  dtLateNight: "深夜酒類提供届出",
  submitted: "提出済み",
  notSubmitted: "未提出",
  exteriorCountPrefix: "店舗外観（",
  interiorCountPrefix: "店舗内観（",
  countSuffix: "枚）",
  confirmNote:
    "審査申請のみでは求人は公開されません。承認後に登録手続きへ進みます。",

  back: "戻る",
  next: "次へ",
  navigating: "移動中...",
  submitting: "送信中...",
  submit: "審査を申し込む",

  compressing: "圧縮中...",
  uploadingProgress: "アップロード中",
  retryUpload: "再試行",
  uploadWait: "アップロード完了までお待ちください。",
  duplicateImageSkipped: "同じ画像はすでに選択済みのためスキップしました。",
} as const;

/** Full-width digits ０-９ */
export const FULLWIDTH_DIGIT_RE = /[\uFF10-\uFF19]/g;

/** Hyphen-like separators used in phone numbers */
export const PHONE_SEP_RE = /[\s\-\uFF0D\u30FC\u2015\u2010]/g;

/** Hyphen / paren separators for international phones */
export const PHONE_INTL_SEP_RE = /[\s\-\uFF0D\u30FC\u2015\u2010()\uFF08\uFF09]/g;
