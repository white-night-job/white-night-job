"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { CHAT_AREA_OPTIONS } from "@/lib/chat/area-options";
import { FAQ_QUICK_REPLIES } from "@/lib/chat/system-prompt";
import type { ChatRecommendation } from "@/lib/chat/types";

const STORAGE_KEY = "white-night-chat-state";
const MAX_STORED_MESSAGES = 50;

type ChatStep = "area" | "chat";

type ChatMessage = {
  id: string;
  role: "user" | "bot";
  content: string;
  recommendations?: ChatRecommendation[];
};

type StoredChatState = {
  step: ChatStep;
  selectedAreas: string[];
  messages: ChatMessage[];
};

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const CHAT_START_MESSAGE = "夜職についてお気軽にご質問ください。";

function createAreaStartMessage(): ChatMessage {
  return {
    id: createId(),
    role: "bot",
    content: CHAT_START_MESSAGE,
  };
}

function hasAiConversationReply(messages: ChatMessage[]): boolean {
  let userMessageCount = 0;

  for (const message of messages) {
    if (message.role === "user") {
      userMessageCount++;
      continue;
    }

    if (message.role !== "bot" || userMessageCount === 0) continue;
    if (message.recommendations && message.recommendations.length > 0) continue;
    if (message.content === CHAT_START_MESSAGE) continue;
    if (message.content === "先に希望エリアを選択してください") continue;
    if (message.content.startsWith("エリアを「")) continue;

    return true;
  }

  return false;
}

function shouldShowRecommendLink(
  message: ChatMessage,
  messages: ChatMessage[],
  messageIndex: number,
): boolean {
  if (message.role !== "bot") return false;
  if (message.recommendations && message.recommendations.length > 0) return false;
  if (message.content === CHAT_START_MESSAGE) return false;
  if (message.content === "先に希望エリアを選択してください") return false;
  if (message.content.startsWith("エリアを「")) return false;

  const hasPriorUser = messages
    .slice(0, messageIndex)
    .some((item) => item.role === "user");

  return hasPriorUser;
}

function loadStoredState(): StoredChatState {
  if (typeof window === "undefined") {
    return { step: "area", selectedAreas: [], messages: [] };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { step: "area", selectedAreas: [], messages: [] };
    }
    const parsed = JSON.parse(raw) as Partial<StoredChatState>;
    const step = parsed.step === "chat" ? "chat" : "area";
    const selectedAreas = Array.isArray(parsed.selectedAreas)
      ? parsed.selectedAreas.map(String)
      : [];
    const messages = Array.isArray(parsed.messages)
      ? parsed.messages.slice(-MAX_STORED_MESSAGES)
      : [];
    if (step === "chat" && selectedAreas.length === 0) {
      return { step: "area", selectedAreas: [], messages: [] };
    }
    return { step, selectedAreas, messages };
  } catch {
    return { step: "area", selectedAreas: [], messages: [] };
  }
}

function saveState(state: StoredChatState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      step: state.step,
      selectedAreas: state.selectedAreas,
      messages: state.messages.slice(-MAX_STORED_MESSAGES),
    }),
  );
}

function toApiMessages(messages: ChatMessage[]) {
  return messages
    .filter((message) => message.role === "user" || message.role === "bot")
    .map((message) => ({
      role: message.role === "bot" ? ("assistant" as const) : ("user" as const),
      content: message.content,
    }));
}

function RecommendationCard({ item }: { item: ChatRecommendation }) {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-gold/25 bg-white text-left shadow-sm">
      {item.imageUrl ? (
        <div className="relative aspect-[16/9] w-full bg-zinc-100">
          <Image
            src={item.imageUrl}
            alt={item.shopName}
            fill
            className="object-cover"
            sizes="320px"
            unoptimized
          />
        </div>
      ) : (
        <div className="flex aspect-[16/9] w-full items-center justify-center bg-gradient-to-br from-ivory to-gold/10 text-xs text-muted">
          店舗画像なし
        </div>
      )}
      <div className="p-3">
        <p className="font-semibold text-charcoal">{item.shopName}</p>
        <p className="mt-0.5 text-xs text-muted">
          {item.area} / {item.district} / {item.jobType}
        </p>
        <p className="mt-1 text-sm font-medium text-gold-dark">{item.salary}</p>
        <p className="mt-2 text-xs leading-relaxed text-charcoal/80">{item.reason}</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Link
            href={`/jobs/${item.id}`}
            className="rounded-full border border-gold/40 px-3 py-2 text-center text-xs font-medium text-gold-dark hover:bg-ivory"
          >
            求人詳細を見る
          </Link>
          <a
            href={item.lineUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-[#06C755] px-3 py-2 text-center text-xs font-medium text-white hover:opacity-90"
          >
            LINEで相談
          </a>
        </div>
      </div>
    </div>
  );
}

export function ChatBot() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<ChatStep>("area");
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [draftAreas, setDraftAreas] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [scrollAnchor, setScrollAnchor] = useState<{
    kind: "user-question" | "recommendations";
    messageId: string;
  } | null>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const recommendTitleRefs = useRef<Map<string, HTMLParagraphElement>>(new Map());
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const bodyScrollLockRef = useRef(0);
  const [isMobile, setIsMobile] = useState(false);
  const [mobilePanelStyle, setMobilePanelStyle] = useState<{
    top: number;
    height: number;
  } | null>(null);

  const scrollToAnchor = useCallback(
    (anchor: { kind: "user-question" | "recommendations"; messageId: string }) => {
      const container = messagesContainerRef.current;
      const element =
        anchor.kind === "recommendations"
          ? recommendTitleRefs.current.get(anchor.messageId)
          : messageRefs.current.get(anchor.messageId);

      if (!element || !container) return;

      const containerRect = container.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      const nextTop =
        container.scrollTop + (elementRect.top - containerRect.top) - 8;

      container.scrollTo({
        top: Math.max(0, nextTop),
        behavior: "smooth",
      });
    },
    [],
  );

  useEffect(() => {
    const stored = loadStoredState();
    setStep(stored.step);
    setSelectedAreas(stored.selectedAreas);
    setDraftAreas(stored.selectedAreas);
    setMessages(
      stored.messages.length > 0
        ? stored.messages
        : stored.step === "chat"
          ? [createAreaStartMessage()]
          : [],
    );
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      saveState({ step, selectedAreas, messages });
    }
  }, [step, selectedAreas, messages, hydrated]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 639px)");
    const updateIsMobile = () => setIsMobile(mediaQuery.matches);
    updateIsMobile();
    mediaQuery.addEventListener("change", updateIsMobile);
    return () => mediaQuery.removeEventListener("change", updateIsMobile);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    bodyScrollLockRef.current = window.scrollY;
    const { style } = document.body;
    const previous = {
      overflow: style.overflow,
      position: style.position,
      top: style.top,
      left: style.left,
      right: style.right,
      width: style.width,
    };

    style.overflow = "hidden";
    style.position = "fixed";
    style.top = `-${bodyScrollLockRef.current}px`;
    style.left = "0";
    style.right = "0";
    style.width = "100%";

    return () => {
      style.overflow = previous.overflow;
      style.position = previous.position;
      style.top = previous.top;
      style.left = previous.left;
      style.right = previous.right;
      style.width = previous.width;
      window.scrollTo(0, bodyScrollLockRef.current);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !isMobile) {
      setMobilePanelStyle(null);
      return;
    }

    const updateMobilePanelStyle = () => {
      const visualViewport = window.visualViewport;
      if (!visualViewport) {
        setMobilePanelStyle(null);
        return;
      }

      const top = Math.max(visualViewport.offsetTop + 8, 8);
      const height = Math.min(
        visualViewport.height - 16,
        Math.min(window.innerHeight * 0.8, visualViewport.height - 16),
      );

      setMobilePanelStyle({
        top,
        height: Math.max(height, 280),
      });
    };

    updateMobilePanelStyle();
    const visualViewport = window.visualViewport;
    visualViewport?.addEventListener("resize", updateMobilePanelStyle);
    window.addEventListener("orientationchange", updateMobilePanelStyle);

    return () => {
      visualViewport?.removeEventListener("resize", updateMobilePanelStyle);
      window.removeEventListener("orientationchange", updateMobilePanelStyle);
    };
  }, [open, isMobile]);

  useEffect(() => {
    if (!scrollAnchor) return;
    if (loading && scrollAnchor.kind !== "user-question") return;

    const frameId = window.requestAnimationFrame(() => {
      window.setTimeout(() => {
        scrollToAnchor(scrollAnchor);
        setScrollAnchor(null);
      }, 80);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [scrollAnchor, loading, messages, scrollToAnchor]);

  useEffect(() => {
    if (!open || step !== "chat") return;
    if (window.matchMedia("(pointer: fine)").matches) {
      const timer = window.setTimeout(() => inputRef.current?.focus(), 200);
      return () => window.clearTimeout(timer);
    }
  }, [open, step]);

  const toggleDraftArea = useCallback((area: string) => {
    setDraftAreas((current) =>
      current.includes(area)
        ? current.filter((item) => item !== area)
        : [...current, area],
    );
  }, []);

  const startChatWithAreas = useCallback(() => {
    if (draftAreas.length === 0) return;
    const areas = [...draftAreas];
    setSelectedAreas(areas);
    setStep("chat");
    setMessages((current) => {
      if (current.length === 0) {
        return [createAreaStartMessage()];
      }
      return [
        ...current,
        {
          id: createId(),
          role: "bot",
          content: `エリアを「${areas.join("、")}」に変更しました。`,
        },
      ];
    });
  }, [draftAreas]);

  const goToAreaSelection = useCallback(() => {
    setDraftAreas(selectedAreas);
    setStep("area");
  }, [selectedAreas]);

  const resetConversation = useCallback(() => {
    setStep("area");
    setSelectedAreas([]);
    setDraftAreas([]);
    setMessages([]);
    setInput("");
    saveState({ step: "area", selectedAreas: [], messages: [] });
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading || step !== "chat") return;

      setLoading(true);

      const userMessage: ChatMessage = {
        id: createId(),
        role: "user",
        content: trimmed,
      };

      const historyForApi = toApiMessages([...messages, userMessage]);

      setMessages((current) => [...current, userMessage]);
      setInput("");
      setScrollAnchor({ kind: "user-question", messageId: userMessage.id });

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: historyForApi,
            selectedAreas,
          }),
        });

        const data = (await response.json()) as {
          reply?: string;
          message?: string;
        };

        if (!response.ok) {
          throw new Error(data.message ?? "送信に失敗しました。");
        }

        const botMessageId = createId();
        setMessages((current) => [
          ...current,
          {
            id: botMessageId,
            role: "bot",
            content: data.reply ?? "申し訳ありません。もう一度お試しください。",
          },
        ]);
        setScrollAnchor({ kind: "user-question", messageId: userMessage.id });
      } catch (error) {
        const botMessageId = createId();
        setMessages((current) => [
          ...current,
          {
            id: botMessageId,
            role: "bot",
            content:
              error instanceof Error
                ? error.message
                : "うまく回答できませんでした。時間をおいてもう一度お試しください",
          },
        ]);
        setScrollAnchor({ kind: "user-question", messageId: userMessage.id });
      } finally {
        setLoading(false);
      }
    },
    [loading, messages, selectedAreas, step],
  );

  const showRecommendations = useCallback(async () => {
    if (loading) return;

    if (selectedAreas.length === 0) {
      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role: "bot",
          content: "先に希望エリアを選択してください",
        },
      ]);
      goToAreaSelection();
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/chat/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedAreas,
          messages: toApiMessages(messages),
        }),
      });

      const data = (await response.json()) as {
        recommendations?: ChatRecommendation[];
        message?: string;
      };

      if (!response.ok) {
        throw new Error(data.message ?? "おすすめ店舗の取得に失敗しました。");
      }

      const recommendations = data.recommendations ?? [];
      const botMessageId = createId();

      setMessages((current) => [
        ...current,
        {
          id: botMessageId,
          role: "bot",
          content:
            recommendations.length > 0
              ? `ご希望のエリアで${recommendations.length}件見つかりました。`
              : "条件に合う店舗が見つかりませんでした。エリアやご希望を変えてお試しください。",
          recommendations,
        },
      ]);
      if (recommendations.length > 0) {
        setScrollAnchor({ kind: "recommendations", messageId: botMessageId });
      } else {
        setScrollAnchor({ kind: "user-question", messageId: botMessageId });
      }
    } catch (error) {
      const botMessageId = createId();
      setMessages((current) => [
        ...current,
        {
          id: botMessageId,
          role: "bot",
          content:
            error instanceof Error
              ? error.message
              : "おすすめ店舗の取得に失敗しました。時間をおいてもう一度お試しください。",
        },
      ]);
      setScrollAnchor({ kind: "user-question", messageId: botMessageId });
    } finally {
      setLoading(false);
    }
  }, [goToAreaSelection, loading, messages, selectedAreas]);

  const showFaqQuickReplies = !hasAiConversationReply(messages);

  const chatPanel = open ? (
    <div
      className={`flex w-full flex-col overflow-hidden rounded-2xl border border-gold/30 bg-ivory shadow-2xl sm:h-[min(75dvh,560px)] sm:w-[min(100vw-2rem,380px)] ${
        isMobile ? "h-full min-h-0" : "h-[min(75dvh,560px)]"
      }`}
      style={
        isMobile
          ? { maxHeight: "calc(100dvh - 24px)" }
          : undefined
      }
      role="dialog"
      aria-label="White Night相談Bot"
      onClick={(event) => event.stopPropagation()}
    >
            <div className="flex items-center justify-between border-b border-gold/20 bg-gradient-to-r from-gold to-gold-dark px-4 py-3 text-white">
              <div className="min-w-0">
                <p className="text-sm font-semibold">White Night相談Bot</p>
                <p className="truncate text-xs text-white/80">
                  {step === "chat" && selectedAreas.length > 0
                    ? `エリア: ${selectedAreas.join("、")}`
                    : "夜職の相談"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={resetConversation}
                  className="rounded-full px-2 py-1 text-xs hover:bg-white/15"
                  title="会話をリセット"
                >
                  リセット
                </button>
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
            </div>

            {step === "area" ? (
              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-4 py-5">
                <p className="text-sm font-medium text-charcoal">
                  まず希望エリアを選んでください。複数選択できます。
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {CHAT_AREA_OPTIONS.map((area) => {
                    const selected = draftAreas.includes(area);
                    return (
                      <button
                        key={area}
                        type="button"
                        onClick={() => toggleDraftArea(area)}
                        className={`min-h-[48px] rounded-xl border px-3 py-3 text-sm font-medium transition ${
                          selected
                            ? "border-gold bg-gold text-white shadow-sm"
                            : "border-gold/30 bg-white text-charcoal hover:border-gold"
                        }`}
                      >
                        {area}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  disabled={draftAreas.length === 0}
                  onClick={startChatWithAreas}
                  className="mt-5 w-full rounded-full bg-gradient-to-r from-gold to-gold-dark px-4 py-3 text-sm font-semibold text-white shadow-md disabled:opacity-50"
                >
                  このエリアで相談を始める
                </button>
              </div>
            ) : (
              <>
                <div
                  ref={messagesContainerRef}
                  className="min-h-0 flex-1 space-y-3 overflow-y-auto overflow-x-hidden overscroll-contain px-3 py-4"
                >
                  {messages.map((message, messageIndex) => (
                    <div
                      key={message.id}
                      ref={(element) => {
                        if (element) {
                          messageRefs.current.set(message.id, element);
                        } else {
                          messageRefs.current.delete(message.id);
                        }
                      }}
                      className={`scroll-mt-2 flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-full rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap sm:max-w-[92%] ${
                          message.role === "user"
                            ? "bg-gold text-white"
                            : "border border-gold/20 bg-white text-charcoal"
                        }`}
                      >
                        {message.content}
                        {shouldShowRecommendLink(message, messages, messageIndex) && (
                          <button
                            type="button"
                            onClick={() => void showRecommendations()}
                            disabled={loading}
                            className="mt-3 inline-flex min-h-[44px] items-center py-1 text-sm font-medium text-gold-dark no-underline transition hover:underline disabled:opacity-50"
                          >
                            条件に合う店舗を見る →
                          </button>
                        )}
                        {message.recommendations && message.recommendations.length > 0 && (
                          <div className="mt-3 flex flex-col gap-3">
                            <p
                              ref={(element) => {
                                if (element) {
                                  recommendTitleRefs.current.set(message.id, element);
                                } else {
                                  recommendTitleRefs.current.delete(message.id);
                                }
                              }}
                              className="scroll-mt-2 text-sm font-semibold text-charcoal"
                            >
                              おすすめ店舗
                            </p>
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
                </div>

                {!loading && (
                  <div className="space-y-2 border-t border-gold/15 px-3 py-2">
                    <button
                      type="button"
                      onClick={goToAreaSelection}
                      className="w-full py-1 text-xs text-muted hover:text-charcoal"
                    >
                      エリアを変更する
                    </button>
                    {showFaqQuickReplies && (
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {FAQ_QUICK_REPLIES.map((reply) => (
                          <button
                            key={reply}
                            type="button"
                            disabled={loading}
                            onClick={() => void sendMessage(reply)}
                            className="shrink-0 rounded-full border border-gold/30 bg-white px-3 py-1.5 text-xs text-charcoal hover:border-gold disabled:opacity-50"
                          >
                            {reply}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <form
                  className="chat-bot-field flex shrink-0 gap-2 border-t border-gold/20 bg-white p-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                  }}
                >
                  <input
                    ref={inputRef}
                    type="text"
                    enterKeyHint="send"
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.nativeEvent.isComposing) {
                        event.preventDefault();
                        void sendMessage(input);
                      }
                    }}
                    placeholder="メッセージを入力..."
                    disabled={loading}
                    className="min-w-0 flex-1 rounded-full border border-gold/30 bg-ivory px-4 py-2.5 text-base outline-none focus:border-gold"
                    style={{ fontSize: 16 }}
                  />
                  <button
                    type="button"
                    disabled={loading || !input.trim()}
                    onClick={() => void sendMessage(input)}
                    className="shrink-0 rounded-full bg-gold px-4 py-2.5 text-base font-medium text-white disabled:opacity-50"
                  >
                    送信
                  </button>
                </form>
              </>
            )}
    </div>
  ) : null;

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

      {open && isMobile && (
        <div
          className="fixed z-[70] sm:hidden"
          style={
            mobilePanelStyle
              ? {
                  top: mobilePanelStyle.top,
                  left: 12,
                  right: 12,
                  height: mobilePanelStyle.height,
                }
              : {
                  left: 12,
                  right: 12,
                  bottom: 12,
                  height: "min(80dvh, calc(100dvh - 24px))",
                  maxHeight: "calc(100dvh - 24px)",
                }
          }
        >
          {chatPanel}
        </div>
      )}

      <div className="fixed bottom-4 right-4 z-[70] flex flex-col items-end gap-3 max-sm:left-auto sm:bottom-6 sm:right-6">
        {open && !isMobile && chatPanel}

        {(!open || !isMobile) && (
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-gold to-gold-dark text-white shadow-lg transition hover:scale-105 sm:h-12 sm:w-12"
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
        )}
      </div>
    </>
  );
}
