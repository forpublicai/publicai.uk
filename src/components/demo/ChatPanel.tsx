"use client";

import Image from "next/image";
import { useRef, useEffect, useState } from "react";
import { type Message, type ToolInvocation } from "ai";
import EmojiPicker, { Theme, type EmojiClickData } from "emoji-picker-react";
import { type ModeId } from "@/lib/modes";

const SESSION_LIMIT = 10;

/** Primary red for the demo chat chrome */
const RED = "#8C1515";

export interface ExamplePromptItem {
  id: string;
  mode: ModeId;
  text: string;
  /** 1–3 word label for welcome buttons */
  shortLabel?: string;
}

interface ChatPanelProps {
  messages: Message[];
  input: string;
  isLoading: boolean;
  questionCount: number;
  onInputChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  allToolInvocations: ToolInvocation[];
  examplePrompts?: ExamplePromptItem[];
  onPickExample?: (mode: ModeId, text: string) => void;
  onNewChat?: () => void;
}

function LoadingDots() {
  return (
    <span aria-label="Loading" className="inline-flex gap-1 items-center">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#a89898]"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </span>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const content = typeof message.content === "string" ? message.content : "";

  return (
    <div className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
      {isUser ? (
        <div className="max-w-[min(85%,520px)] rounded-lg rounded-tr-sm bg-[#5c1f1c] px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap text-[#f5e8e8] shadow-sm ring-1 ring-[#8c1515]/30">
          {content}
        </div>
      ) : (
        <div className="max-w-[min(85%,520px)] rounded-lg rounded-tl-sm bg-[#1f1818] px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap text-[#e9edef] shadow-sm ring-1 ring-white/5">
          {content}
        </div>
      )}
    </div>
  );
}

function IconButton({
  label,
  children,
  onClick = () => {},
}: {
  label: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#a89898] transition hover:bg-[#2a1f1f] hover:text-[#e9edef] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8c1515]/60"
    >
      {children}
    </button>
  );
}

export function ChatPanel({
  messages,
  input,
  isLoading,
  questionCount,
  onInputChange,
  onSubmit,
  allToolInvocations,
  examplePrompts,
  onPickExample,
  onNewChat,
}: ChatPanelProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const emojiMenuRef = useRef<HTMLDivElement>(null);
  const limitReached = questionCount >= SESSION_LIMIT;
  const isEmptyConversation = messages.length === 0;
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const showStarters =
    Boolean(examplePrompts?.length && onPickExample) && isEmptyConversation && !isLoading;

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    if (showStarters) return;
    const lastMessage = messages[messages.length - 1];
    // Scroll once when the user submits; do not keep forcing scroll during streaming.
    if (lastMessage?.role === "user") {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages.length, showStarters]);

  useEffect(() => {
    if (!isEmojiPickerOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      if (!emojiMenuRef.current) return;
      if (!emojiMenuRef.current.contains(e.target as Node)) {
        setIsEmojiPickerOpen(false);
      }
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsEmojiPickerOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [isEmojiPickerOpen]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && !limitReached && input.trim()) {
        onSubmit(e as unknown as React.FormEvent);
      }
    }
  };

  const insertEmoji = (emoji: string) => {
    if (isLoading || limitReached) return;
    const textarea = inputRef.current;
    if (!textarea) {
      if ((input + emoji).length <= 500) onInputChange(input + emoji);
      return;
    }

    const start = textarea.selectionStart ?? input.length;
    const end = textarea.selectionEnd ?? input.length;
    const nextValue = `${input.slice(0, start)}${emoji}${input.slice(end)}`;
    if (nextValue.length > 500) return;

    onInputChange(nextValue);

    // Keep cursor after inserted emoji for a natural typing flow.
    requestAnimationFrame(() => {
      textarea.focus();
      const nextPos = start + emoji.length;
      textarea.setSelectionRange(nextPos, nextPos);
    });
  };

  const handleEmojiSelect = (emojiData: EmojiClickData) => {
    insertEmoji(emojiData.emoji);
    setIsEmojiPickerOpen(false);
  };

  void allToolInvocations;

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#0f0a0a]">
      {/* Header */}
      <div
        className="flex h-[52px] shrink-0 items-center justify-between gap-3 border-b px-3"
        style={{ borderColor: `${RED}33`, backgroundColor: "#1a1212" }}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-1"
            style={{ backgroundColor: `${RED}22`, borderColor: `${RED}44` }}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke={RED}
              strokeWidth={2}
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h2 className="truncate text-[16px] font-semibold leading-tight text-[#e9edef]">
            Public AI UK
          </h2>
        </div>
        {onNewChat && (
          <button
            type="button"
            onClick={onNewChat}
            className="shrink-0 rounded-full px-2.5 py-1 text-[12px] font-medium text-[#e8a8a8] hover:bg-[#2a1f1f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8c1515]/60"
          >
            New chat
          </button>
        )}
      </div>

      <div
        ref={scrollContainerRef}
        className="demo-red-chat-bg flex min-h-[min(260px,36vh)] max-h-[min(520px,58vh)] flex-1 flex-col overflow-y-auto overscroll-contain px-3 py-3"
        aria-live="polite"
        aria-label="Conversation"
      >
        {showStarters ? (
          <div className="flex min-h-[min(260px,40vh)] flex-1 flex-col items-center justify-center gap-5 px-4 py-10">
            {/* Force centered edge-fill so the mark occupies the full tile */}
            <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-2xl bg-[#1a1212] ring-2 ring-[#8c1515]/35">
              <Image
                src="/logo-mark.png"
                alt=""
                fill
                sizes="72px"
                className="object-cover object-center scale-[1.22]"
                priority
              />
            </div>
            <div className="w-full max-w-md text-center">
              <h3 className="text-xl font-semibold tracking-tight text-[#e9edef]">
                Welcome to Public AI
              </h3>
              <p className="mt-3 text-[13px] leading-snug text-[#a89898]">
                <span className="text-[#7a6a6a]">Ask: </span>
                <span className="inline-flex flex-wrap items-baseline justify-center gap-x-0">
                  {examplePrompts!.map((ex, i) => (
                    <span key={ex.id} className="inline">
                      {i > 0 && <span className="text-[#5a4a4a]">, </span>}
                      <button
                        type="button"
                        id={ex.id}
                        onClick={() => onPickExample!(ex.mode, ex.text)}
                        className="inline p-0 font-medium text-[#e8c4c4] underline decoration-[#8c1515]/55 underline-offset-[3px] transition hover:text-[#f5e0e0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8c1515]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0a0a]"
                      >
                        {ex.shortLabel ?? ex.text}
                      </button>
                    </span>
                  ))}
                </span>
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages
              .filter((m) => !(m.role === "assistant" && !String(m.content ?? "").trim()))
              .map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex flex-col items-start">
                <div className="rounded-lg rounded-tl-sm bg-[#1f1818] px-3 py-2 text-sm shadow-sm ring-1 ring-white/5">
                  <LoadingDots />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {limitReached && (
        <div className="border-t border-[#3d2828] bg-[#0f0a0a] px-3 py-2">
          <p
            className="text-center text-[12px] text-[#a89898]"
            aria-label="10 question limit reached"
          >
            Session limit reached.{" "}
            <a href="/" className="text-[#e8a0a0] underline hover:text-[#f0c4c4]">
              Refresh
            </a>
          </p>
        </div>
      )}

      {/* Signal-style composer: controls outside the message pill */}
      <div className="bg-[#0f0a0a] px-2 py-1.5">
        <div className="flex items-center gap-1">
          <div ref={emojiMenuRef} className="relative">
            <IconButton
              label="Emoji"
              onClick={() => setIsEmojiPickerOpen((prev) => !prev)}
            >
              <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </IconButton>
            {isEmojiPickerOpen && (
              <div className="absolute bottom-[calc(100%+0.5rem)] left-0 z-50 rounded-lg border border-[#3d2828] bg-[#141010] p-1 shadow-xl shadow-black/60">
                <EmojiPicker
                  onEmojiClick={handleEmojiSelect}
                  lazyLoadEmojis
                  theme={Theme.DARK}
                  searchPlaceHolder="Search emoji"
                  previewConfig={{ showPreview: false }}
                  skinTonesDisabled
                  width={300}
                  height={360}
                />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 rounded-full bg-[#3b3b3d] px-2 py-0.5">
            <div className="flex items-center gap-1">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  if (e.target.value.length <= 500) onInputChange(e.target.value);
                }}
                onKeyDown={handleKeyDown}
                placeholder={limitReached ? "Session limit reached" : "Message"}
                disabled={isLoading || limitReached}
                rows={1}
                aria-label="Ask a question"
                className="mx-0.5 min-h-[30px] max-h-[100px] min-w-0 flex-1 resize-none rounded-lg border-0 bg-transparent py-1 text-[14px] leading-snug text-[#e9edef] placeholder:text-[#c8c8cb] focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <button
                type="button"
                onClick={onSubmit}
                disabled={isLoading || limitReached || !input.trim()}
                aria-label="Send"
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[14px] font-semibold leading-none text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
                style={{ backgroundColor: RED }}
              >
                <span aria-hidden className="translate-y-px">
                  ↑
                </span>
              </button>
            </div>
          </div>
          <IconButton label="Voice message">
            <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
          </IconButton>
          <IconButton label="Attach file">
            <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </IconButton>
        </div>
        {input.length > 400 && (
          <p className="mt-1 text-right text-[10px] text-[#7a6a6a]">{input.length}/500</p>
        )}
      </div>
    </div>
  );
}
