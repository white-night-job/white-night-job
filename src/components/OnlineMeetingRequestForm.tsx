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

export function OnlineMeetingRequestForm({
  lineOfficialAccountId = ONLINE_MEETING_LINE_ACCOUNT_ID,
}: Props) {
  const minDate = useMemo(() => getLocalDateInputMin(), []);
  const lineChatUrl = useMemo(
    () => buildOnlineMeetingLineChatUrl(lineOfficialAccountId),
    [lineOfficialAccountId],
  );

  const [shopName, setShopName] = useState("");
  const [contactName, setContactName] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [preferredTimeKey, setPreferredTimeKey] = useState(0);
  const [secondDate, setSecondDate] = useState("");
  const [secondTime, setSecondTime] = useState("");
  const [secondTimeKey, setSecondTimeKey] = useState(0);
  const [consultation, setConsultation] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preferredTimeError, setPreferredTimeError] = useState<string | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    shopName.trim().length > 0 &&
    contactName.trim().length > 0 &&
    preferredDate.trim().length > 0 &&
    preferredTime.trim().length > 0 &&
    !submitting;

  function clearPreferredTime() {
    setPreferredTime("");
    setPreferredTimeKey((key) => key + 1);
    setPreferredTimeError("面談希望時間を選択してください。");
    setStatus(null);
  }

  function clearSecondTime() {
    setSecondTime("");
    setSecondTimeKey((key) => key + 1);
    setStatus(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatus(null);

    if (
      !shopName.trim() ||
      !contactName.trim() ||
      !preferredDate.trim() ||
      !preferredTime.trim()
    ) {
      if (!preferredTime.trim()) {
        setPreferredTimeError("面談希望時間を選択してください。");
      }
      setError("必須項目を入力してください。");
      return;
    }

    if (preferredDate < minDate) {
      setError("過去の日付は選択できません。");
      return;
    }

    if (secondDate && secondDate < minDate) {
      setError("第2希望日に過去の日付は選択できません。");
      return;
    }

    const secondPreferredDateTime =
      secondDate && secondTime
        ? formatMeetingDateTime(secondDate, secondTime)
        : secondDate
          ? secondDate
          : secondTime
            ? secondTime
            : "";

    const message = buildOnlineMeetingLineMessage({
      shopName,
      contactName,
      preferredDate,
      preferredTime,
      secondPreferredDateTime,
      consultation,
    });

    setSubmitting(true);
    try {
      const copied = await copyTextToClipboard(message);
      window.open(lineChatUrl, "_blank", "noopener,noreferrer");

      if (copied) {
        setStatus(
          "メッセージをコピーしました。LINEに貼り付けて送信してください。LINEの送信ボタンを押すまで申し込みは完了しません。",
        );
      } else {
        setStatus(
          "LINEを開きました。メッセージのコピーに失敗したため、この画面の内容を控えてLINEへ貼り付けてください。LINEの送信ボタンを押すまで申し込みは完了しません。",
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="wnm-form" onSubmit={(e) => void handleSubmit(e)} noValidate>
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
            面談希望日<span className="wnm-form__req">必須</span>
          </label>
          <input
            id="wnm-preferred-date"
            name="preferredDate"
            type="date"
            required
            min={minDate}
            value={preferredDate}
            onChange={(e) => setPreferredDate(e.target.value)}
          />
        </div>
        <div className="wnm-form__field">
          <div className="wnm-form__label-row">
            <label htmlFor="wnm-preferred-time">
              面談希望時間<span className="wnm-form__req">必須</span>
            </label>
            <button
              type="button"
              className="wnm-form__clear"
              onClick={clearPreferredTime}
              disabled={!preferredTime}
            >
              クリア
            </button>
          </div>
          <input
            key={`preferred-time-${preferredTimeKey}`}
            id="wnm-preferred-time"
            name="preferredTime"
            type="time"
            required
            value={preferredTime}
            onChange={(e) => {
              setPreferredTime(e.target.value);
              if (e.target.value) setPreferredTimeError(null);
            }}
          />
          {preferredTimeError ? (
            <p className="wnm-form__field-error" role="alert">
              {preferredTimeError}
            </p>
          ) : null}
        </div>
      </div>

      <div className="wnm-form__row">
        <div className="wnm-form__field">
          <label htmlFor="wnm-second-date">
            第2希望日<span className="wnm-form__opt">任意</span>
          </label>
          <input
            id="wnm-second-date"
            name="secondDate"
            type="date"
            min={minDate}
            value={secondDate}
            onChange={(e) => setSecondDate(e.target.value)}
          />
        </div>
        <div className="wnm-form__field">
          <div className="wnm-form__label-row">
            <label htmlFor="wnm-second-time">
              第2希望時間<span className="wnm-form__opt">任意</span>
            </label>
            <button
              type="button"
              className="wnm-form__clear"
              onClick={clearSecondTime}
              disabled={!secondTime}
            >
              クリア
            </button>
          </div>
          <input
            key={`second-time-${secondTimeKey}`}
            id="wnm-second-time"
            name="secondTime"
            type="time"
            value={secondTime}
            onChange={(e) => setSecondTime(e.target.value)}
          />
        </div>
      </div>

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
      {status ? (
        <p className="wnm-form__status" role="status">
          {status}
        </p>
      ) : null}
    </form>
  );
}
