"use client";

import { useState } from "react";

const CHECK_ITEMS = [
  "店舗の雰囲気が伝わる写真を掲載している",
  "給与・バックの内容を明確に記載している",
  "待遇情報を充実させている",
  "店舗の特徴や魅力を紹介している",
  "未経験者向けの情報を記載している",
  "勤務時間・出勤条件が正確である",
  "応募前の疑問を解消できる内容になっている",
  "求人情報を最新の状態に更新している",
  "アクセス・応募状況を確認している",
  "分析結果を求人改善に活用している",
] as const;

export function ListingSuccessChecklist() {
  const [checked, setChecked] = useState<boolean[]>(() =>
    CHECK_ITEMS.map(() => false),
  );

  function toggle(index: number) {
    setChecked((prev) => prev.map((value, i) => (i === index ? !value : value)));
  }

  return (
    <div>
      <ul className="lsg-check-list">
        {CHECK_ITEMS.map((label, index) => {
          const on = checked[index];
          return (
            <li key={label}>
              <button
                type="button"
                className={`lsg-check${on ? " is-on" : ""}`}
                onClick={() => toggle(index)}
                aria-pressed={on}
              >
                <span className="lsg-check__box" aria-hidden>
                  {on ? "✓" : ""}
                </span>
                <p className="lsg-check__label">{label}</p>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="lsg-check-hint">
        ※このチェックリストはページ内の確認用です。操作しても求人データは変更されません。
      </p>
    </div>
  );
}
