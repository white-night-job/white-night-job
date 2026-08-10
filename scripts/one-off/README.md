# One-off Stripe 修復スクリプト

このディレクトリのスクリプトは **通常のプラン変更処理ではありません。**

- 管理画面のプラン変更は `src/lib/stripe-subscription-schedule.ts` の
  `schedulePlanChangeAtPeriodEnd` のみを使います。
- ここにあるスクリプトは、過去の誤操作を手直しするための **一度限りの救急処置** です。
- `npm run` には登録しないでください。
- 実行には明示的な確認用環境変数が必要です。

## 含まれているスクリプト

| ファイル | 用途 |
|---|---|
| `repair-sub_1U2w1z-immediate-plan-change.mjs` | 特定 Subscription 1件の日割り誤変更を修復済み（再実行禁止推奨） |
| `inspect-stripe-subs.mjs` | 読み取り専用の契約一覧確認 |

再実行が必要な場合のみ、対象 ID を確認したうえで実行してください。
