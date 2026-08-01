const DOCUMENT_ITEMS = [
  { label: "営業許可証", optional: false },
  {
    label: "社交飲食店営業許可証（風俗営業許可証）",
    optional: true,
  },
  {
    label: "深夜における酒類提供飲食店営業開始届出書の受領書",
    optional: true,
  },
  { label: "代表者または担当者の顔写真付き身分証明書", optional: false },
  { label: "店舗の外観写真", optional: false },
  { label: "店舗の内観写真", optional: false },
] as const;

/** 「掲載をご検討の方はこちら」ページの申込ボタン直前専用。 */
export function ForShopsApplyDocumentsNotice() {
  return (
    <aside
      className="for-shops-docs-notice"
      aria-label="掲載審査に必要な画像のご案内"
    >
      <p className="for-shops-docs-notice__eyebrow">事前のご準備</p>
      <p className="for-shops-docs-notice__lead">
        掲載審査には、以下の画像が必要です。
      </p>
      <ul className="for-shops-docs-notice__list">
        {DOCUMENT_ITEMS.map((item) => (
          <li key={item.label}>
            {item.optional ? (
              <>
                <span className="for-shops-docs-notice__optional">【任意】</span>
                {item.label}
              </>
            ) : (
              item.label
            )}
          </li>
        ))}
      </ul>
      <p className="for-shops-docs-notice__foot">
        合計4,5点の画像をご用意のうえ、掲載審査へお進みください。
      </p>
    </aside>
  );
}
