/** 「掲載をご検討の方はこちら」ページの申込ボタン直前専用。 */
export function ForShopsApplyDocumentsNotice() {
  return (
    <aside
      className="for-shops-docs-notice"
      aria-label="掲載審査に必要な書類のご案内"
    >
      <p className="for-shops-docs-notice__eyebrow">事前のご準備</p>
      <p className="for-shops-docs-notice__lead">
        掲載審査には、以下の書類が必要です。
      </p>
      <ul className="for-shops-docs-notice__list">
        <li>代表者または担当者の顔写真付き身分証明書</li>
      </ul>
      <p className="for-shops-docs-notice__foot">
        上記1点をご用意のうえ、掲載審査へお進みください。
      </p>
    </aside>
  );
}
