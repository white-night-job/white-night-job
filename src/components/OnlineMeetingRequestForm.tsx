"use client";

import { useMemo, useState, type FormEvent } from "react";
import { copyTextToClipboard } from "@/lib/clipboard";
import {
  ONLINE_MEETING_LINE_ACCOUNT_ID,
  buildOnlineMeetingLineChatUrl,
  buildOnlineMeetingLineMessage,
  formatMeetingDateTime,
  getLocalDateInputMin,
} from "@/lib/online-meeting";

type Props = {
  lineOfficialAccountId?: string;
};

type ConfirmState = {
  message: string;
  lineUrl: string;
  copied: boolean;
  copyFailed: boolean;
};

export function OnlineMeetingRequestForm({
  lineOfficialAccountId = ONLINE_MEETING_LINE_ACCOUNT_ID,
}: Props) {
  const minDate = useMemo(() => getLocalDateInputMin(), []);

  const [shopName, setShopName] = useState("");
  const [contactName, setContactName] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredDateKey, setPreferredDateKey] = useState(0);
  const [preferredTime, setPreferredTime] = useState("");
  const [preferredTimeKey, setPreferredTimeKey] = useState(0);
  const [secondDate, setSecondDate] = useState("");
  const [secondDateKey, setSecondDateKey] = useState(0);
  const [secondTime, setSecondTime] = useState("");
  const [secondTimeKey, setSecondTimeKey] = useState(0);
  const [consultation, setConsultation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    preferredDate?: string;
    preferredTime?: string;
    second?: string;
  }>({});
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const canSubmit =
    shopName.trim().length > 0 &&
    contactName.trim().length > 0 &&
    preferredDate.trim().length > 0 &&
    preferredTime.trim().length > 0;

  function clearPreferredDate() {
    setPreferredDate("");
    setPreferredDateKey((key) => key + 1);
    setFieldErrors((prev) => ({
      ...prev,
      preferredDate: "面談希望日を選択してください。",
    }));
  }

  function clearPreferredTime() {
    setPreferredTime("");
    setPreferredTimeKey((key) => key + 1);
    setFieldErrors((prev) => ({
      ...prev,
      preferredTime: "面談希望時間を選択してください。",
    }));
  }

  function clearSecondDate() {
    setSecondDate("");
    setSecondDateKey((key) => key + 1);
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.second;
      return next;
    });
  }

  function clearSecondTime() {
    setSecondTime("");
    setSecondTimeKey((key) => key + 1);
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.second;
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setCopyFeedback(null);

    const nextFieldErrors: typeof fieldErrors = {};

    if (!shopName.trim() || !contactName.trim()) {
      setError("必須項目を入力してください。");
      return;
    }

    if (!preferredDate.trim()) {
      nextFieldErrors.preferredDate = "面談希望日を選択してください。";
    }
    if (!preferredTime.trim()) {
      nextFieldErrors.preferredTime = "面談希望時間を選択してください。";
    }

    const hasSecondDate = secondDate.trim().length > 0;
    const hasSecondTime = secondTime.trim().length > 0;
    if (hasSecondDate !== hasSecondTime) {
      nextFieldErrors.second =
        "第2希望は日付と時間の両方を入力するか、どちらも空にしてください。";
    }

    if (preferredDate && preferredDate < minDate) {
      setError("過去の日付は選択できません。");
      setFieldErrors(nextFieldErrors);
      return;
    }

    if (secondDate && secondDate < minDate) {
      setError("第2希望日に過去の日付は選択できません。");
      setFieldErrors(nextFieldErrors);
      return;
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setError("入力内容をご確認ください。");
      return;
    }

    setFieldErrors({});

    const secondPreferredDateTime =
      hasSecondDate && hasSecondTime
        ? formatMeetingDateTime(secondDate, secondTime)
        : "";

    const message = buildOnlineMeetingLineMessage({
      shopName,
      contactName,
      preferredDate,
      preferredTime,
      secondPreferredDateTime,
      consultation,
    });

    const lineUrl = buildOnlineMeetingLineChatUrl(
      message,
      lineOfficialAccountId,
    );
    const copied = await copyTextToClipboard(message);
    setConfirm({
      message,
      lineUrl,
      copied,
      copyFailed: !copied,
    });
    setCopyFeedback(
      copied
        ? "メッセージをコピーしました。「LINEを開く」を押すと、対応環境では入力欄に反映されます。反映されない場合は貼り付けて送信してください。"
        : "自動コピーに失敗しました。下のメッセージから「文章をコピーする」を押してください。",
    );
  }

  async function handleCopyConfirmMessage() {
    if (!confirm) return;
    const copied = await copyTextToClipboard(confirm.message);
    setConfirm({
      ...confirm,
      copied,
      copyFailed: !copied,
    });
    setCopyFeedback(
      copied
        ? "メッセージをコピーしました。LINEのトーク画面に貼り付けて送信してください。"
        : "コピーに失敗しました。下の文章を長押しして手動でコピーしてください。",
    );
  }

  function handleOpenLine() {
    if (!confirm) return;
    window.open(confirm.lineUrl, "_blank", "noopener,noreferrer");
  }

  function handleCloseConfirm() {
    setConfirm(null);
    setCopyFeedback(null);
  }

  return (
    <>
      <form
        className="wnm-form"
        onSubmit={(e) => void handleSubmit(e)}
        noValidate
      >
        <div className="wnm-form__field">
          <label htmlFor="wnm-shop-name">
            店舗名<span className="wnm-form__req">必須</span>
          </label>
          <input
            id="wnm-shop-name"
            name="shopName"
            type="text"
            autoComplete="organization"
            required
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            placeholder="例）CLUB EXAMPLE"
          />
        </div>

        <div className="wnm-form__field">
          <label htmlFor="wnm-contact-name">
            ご担当者名<span className="wnm-form__req">必須</span>
          </label>
          <input
            id="wnm-contact-name"
            name="contactName"
            type="text"
            autoComplete="name"
            required
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="例）山田 太郎"
          />
        </div>

        <div className="wnm-form__row">
          <div className="wnm-form__field">
            <label htmlFor="wnm-preferred-date">
              第1希望日<span className="wnm-form__req">必須</span>
            </label>
            <div className="wnm-form__control">
              <div className="wnm-form__control-input">
                <input
                  key={`preferred-date-${preferredDateKey}`}
                  id="wnm-preferred-date"
                  name="preferredDate"
                  type="date"
                  required
                  min={minDate}
                  value={preferredDate}
                  onChange={(e) => {
                    setPreferredDate(e.target.value);
                    if (e.target.value) {
                      setFieldErrors((prev) => {
                        const next = { ...prev };
                        delete next.preferredDate;
                        return next;
                      });
                    }
                  }}
                />
              </div>
              <button
                type="button"
                className="wnm-form__clear"
                onClick={clearPreferredDate}
                disabled={!preferredDate}
                aria-label="第1希望日をクリア"
              >
                クリア
              </button>
            </div>
            {fieldErrors.preferredDate ? (
              <p className="wnm-form__field-error" role="alert">
                {fieldErrors.preferredDate}
              </p>
            ) : null}
          </div>

          <div className="wnm-form__field">
            <label htmlFor="wnm-preferred-time">
              第1希望時間<span className="wnm-form__req">必須</span>
            </label>
            <div className="wnm-form__control">
              <div className="wnm-form__control-input">
                <input
                  key={`preferred-time-${preferredTimeKey}`}
                  id="wnm-preferred-time"
                  name="preferredTime"
                  type="time"
                  required
                  value={preferredTime}
                  onChange={(e) => {
                    setPreferredTime(e.target.value);
                    if (e.target.value) {
                      setFieldErrors((prev) => {
                        const next = { ...prev };
                        delete next.preferredTime;
                        return next;
                      });
                    }
                  }}
                />
              </div>
              <button
                type="button"
                className="wnm-form__clear"
                onClick={clearPreferredTime}
                disabled={!preferredTime}
                aria-label="第1希望時間をクリア"
              >
                クリア
              </button>
            </div>
            {fieldErrors.preferredTime ? (
              <p className="wnm-form__field-error" role="alert">
                {fieldErrors.preferredTime}
              </p>
            ) : null}
          </div>
        </div>

        <div className="wnm-form__row">
          <div className="wnm-form__field">
            <label htmlFor="wnm-second-date">
              第2希望日<span className="wnm-form__opt">任意</span>
            </label>
            <div className="wnm-form__control">
              <div className="wnm-form__control-input">
                <input
                  key={`second-date-${secondDateKey}`}
                  id="wnm-second-date"
                  name="secondDate"
                  type="date"
                  min={minDate}
                  value={secondDate}
                  onChange={(e) => {
                    setSecondDate(e.target.value);
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next.second;
                      return next;
                    });
                  }}
                />
              </div>
              <button
                type="button"
                className="wnm-form__clear"
                onClick={clearSecondDate}
                disabled={!secondDate}
                aria-label="第2希望日をクリア"
              >
                クリア
              </button>
            </div>
          </div>

          <div className="wnm-form__field">
            <label htmlFor="wnm-second-time">
              第2希望時間<span className="wnm-form__opt">任意</span>
            </label>
            <div className="wnm-form__control">
              <div className="wnm-form__control-input">
                <input
                  key={`second-time-${secondTimeKey}`}
                  id="wnm-second-time"
                  name="secondTime"
                  type="time"
                  value={secondTime}
                  onChange={(e) => {
                    setSecondTime(e.target.value);
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next.second;
                      return next;
                    });
                  }}
                />
              </div>
              <button
                type="button"
                className="wnm-form__clear"
                onClick={clearSecondTime}
                disabled={!secondTime}
                aria-label="第2希望時間をクリア"
              >
                クリア
              </button>
            </div>
          </div>
        </div>
        {fieldErrors.second ? (
          <p className="wnm-form__field-error" role="alert">
            {fieldErrors.second}
          </p>
        ) : null}

        <div className="wnm-form__field">
          <label htmlFor="wnm-consultation">
            ご相談内容<span className="wnm-form__opt">任意</span>
          </label>
          <textarea
            id="wnm-consultation"
            name="consultation"
            rows={4}
            value={consultation}
            onChange={(e) => setConsultation(e.target.value)}
            placeholder="料金プランや掲載の流れなど、ご相談したい内容があればご記入ください"
          />
        </div>

        <button
          type="submit"
          className="wnm-form__submit"
          disabled={!canSubmit}
        >
          LINEで面談を申し込む
        </button>

        <p className="wnm-form__caution">
          LINEの送信ボタンを押すまで申し込みは完了しません。メッセージの自動送信は行いません。
        </p>

        <p className="wnm-form__note">
          希望日時を送信いただいた後、担当者より日程をご案内いたします。日時の確定は担当者からの返信をもって完了となります。
        </p>

        {error ? (
          <p className="wnm-form__error" role="alert">
            {error}
          </p>
        ) : null}
      </form>

      {confirm ? (
        <div
          className="wnm-confirm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="wnm-confirm-title"
        >
          <div className="wnm-confirm__panel">
            <button
              type="button"
              className="wnm-confirm__close"
              onClick={handleCloseConfirm}
              aria-label="閉じる"
            >
              ×
            </button>

            <h3 id="wnm-confirm-title" className="wnm-confirm__title">
              送信用メッセージの確認
            </h3>
            <p className="wnm-confirm__lead">
              「LINEを開く」を押すと、対応環境では申込内容が入力欄に入ります。
              <br />
              入らない場合は、下の文章をコピーしてトーク画面に貼り付けてください。
              <br />
              LINEの送信ボタンを押すまで申し込みは完了しません。
            </p>

            {copyFeedback ? (
              <p
                className={`wnm-confirm__feedback${confirm.copyFailed ? " is-error" : ""}`}
                role="status"
              >
                {copyFeedback}
              </p>
            ) : null}

            <pre className="wnm-confirm__message">{confirm.message}</pre>

            <div className="wnm-confirm__actions">
              <button
                type="button"
                className="wnm-confirm__copy"
                onClick={() => void handleCopyConfirmMessage()}
              >
                文章をコピーする
              </button>
              <button
                type="button"
                className="wnm-confirm__line"
                onClick={handleOpenLine}
              >
                LINEを開く
              </button>
              <button
                type="button"
                className="wnm-confirm__back"
                onClick={handleCloseConfirm}
              >
                入力内容を修正する
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
