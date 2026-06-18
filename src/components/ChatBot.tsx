"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createInitialSession, getWelcomeMessage, FAQ_QUICK_REPLIES } from "@/lib/chat/engine";
import type { ChatRecommendation, ChatSession } from "@/lib/chat/types";

type ChatMessage = {
  id: string;
  role: "user" | "bot";
  content: string;
  recommendations?: ChatRecommendation[];
};

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function RecommendationCard({ item }: { item: ChatRecommendation }) {
  return (
    <div className="rounded-xl border border-gold/25 bg-white p-3 text-left shadow-sm">
      <p className="font-semibold text-charcoal">{item.shopName}</p>
      <p className="mt-0.5 text-xs text-muted">
        {item.area}・{item.district} / {item.jobType}
      </p>
      <p className="mt-1 text-sm font-medium text-gold-dark">{item.salary}</p>
      <p className="mt-2 text-xs leading-relaxed text-charcoal/80">{item.reason}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={`/jobs/${item.id}`}
          className="rounded-full border border-gold/40 px-3 py-1.5 text-xs font-medium text-gold-dark hover:bg-ivory"
        >
          求人詳細を見る
        </Link>
        <a
          href={item.lineUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-[#06C755] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
        >
          LINEで相談
        </a>
      </div>
    </div>
  );
}

export function ChatBot() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<ChatSession>(createInitialSession);
  const [quickReplies, setQuickReplies] = useState<string[]>(FAQ_QUICK_REPLIES);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          id: createId(),
          role: "bot",
          content: getWelcomeMessage(),
        },
      ]);
      setQuickReplies(FAQ_QUICK_REPLIES);
    }
  }, [open, messages.length]);

  useEffect(() => {
    if (open) {
      const timer = window.setTimeout(() => inputRef.current?.focus(), 200);
      return () => window.clearTimeout(timer);
    }
  }, [open]);

  const sendMessage = useCallback(
    async (text: string, action?: "start_recommend") => {
      const trimmed = text.trim();
      if (!trimmed && !action) return;

      setLoading(true);
      setQuickReplies([]);

      const userMessage: ChatMessage = {
        id: createId(),
        role: "user",
        content: trimmed || "おすすめ店舗を探す",
      };
      setMessages((current) => [...current, userMessage]);
      setInput("");

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            session,
            action:
              action ??
              (trimmed.includes("おすすめ") ? ("start_recommend" as const) : undefined),
          }),
        });

        const data = (await response.json()) as {
          reply?: string;
          session?: ChatSession;
          recommendations?: ChatRecommendation[];
          quickReplies?: string[];
          message?: string;
        };

        if (!response.ok) {
          throw new Error(data.message ?? "送信に失敗しました。");
        }

        if (data.session) setSession(data.session);
        if (data.quickReplies) setQuickReplies(data.quickReplies);

        setMessages((current) => [
          ...current,
          {
            id: createId(),
            role: "bot",
            content: data.reply ?? "申し訳ありません。もう一度お試しください。",
            recommendations: data.recommendations,
          },
        ]);
      } catch (error) {
        setMessages((current) => [
          ...current,
          {
            id: createId(),
            role: "bot",
            content:
              error instanceof Error
                ? error.message
                : "通信エラーが発生しました。しばらくしてからお試しください。",
          },
        ]);
        setQuickReplies(FAQ_QUICK_REPLIES);
      } finally {
        setLoading(false);
      }
    },
    [session],
  );

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/20 sm:bg-transparent"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <div className="fixed bottom-4 right-4 z-[70] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
        {open && (
          <div
            className="flex h-[min(70vh,520px)] w-[min(100vw-2rem,360px)] flex-col overflow-hidden rounded-2xl border border-gold/30 bg-ivory shadow-2xl"
            role="dialog"
            aria-label="White Night相談Bot"
          >
            <div className="flex items-center justify-between border-b border-gold/20 bg-gradient-to-r from-gold to-gold-dark px-4 py-3 text-white">
              <div>
                <p className="text-sm font-semibold">White Night相談Bot</p>
                <p className="text-xs text-white/80">夜職の不安・おすすめ店舗相談</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-1.5 hover:bg-white/15"
                aria-label="チャットを閉じる"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-3 py-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                      message.role === "user"
                        ? "bg-gold text-white"
                        : "border border-gold/20 bg-white text-charcoal"
                    }`}
                  >
                    {message.content}
                    {message.recommendations && message.recommendations.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {message.recommendations.map((item) => (
                          <RecommendationCard key={item.id} item={item} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl border border-gold/20 bg-white px-3 py-2 text-sm text-muted">
                    入力中...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {quickReplies.length > 0 && (
              <div className="border-t border-gold/15 px-3 py-2">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {quickReplies.map((reply) => (
                    <button
                      key={reply}
                      type="button"
                      disabled={loading}
                      onClick={() =>
                        sendMessage(
                          reply,
                          reply.includes("おすすめ") ? "start_recommend" : undefined,
                        )
                      }
                      className="shrink-0 rounded-full border border-gold/30 bg-white px-3 py-1.5 text-xs text-charcoal hover:border-gold disabled:opacity-50"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form
              className="flex gap-2 border-t border-gold/20 bg-white p-3"
              onSubmit={(event) => {
                event.preventDefault();
                void sendMessage(input);
              }}
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="メッセージを入力..."
                disabled={loading}
                className="min-w-0 flex-1 rounded-full border border-gold/30 bg-ivory px-4 py-2 text-sm outline-none focus:border-gold"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="shrink-0 rounded-full bg-gold px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                送信
              </button>
            </form>
          </div>
        )}

        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-gold to-gold-dark text-white shadow-lg transition hover:scale-105 sm:h-12 sm:w-12"
          aria-label={open ? "チャットを閉じる" : "White Night相談Botを開く"}
          aria-expanded={open}
        >
          {open ? (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          )}
        </button>
      </div>
    </>
  );
}
