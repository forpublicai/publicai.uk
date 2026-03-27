"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useChat } from "ai/react";
import { type ToolInvocation } from "ai";
import { inflate } from "pako";
import { ChatPanel } from "@/components/demo/ChatPanel";
import { InChatPane, type ExtraChatAgent } from "@/components/demo/InChatPane";
import { modes, type ModeId } from "@/lib/modes";

type TourStepId = "hero" | "bbc" | "justice" | "planning" | "trust" | "technology";

const tourSteps: { id: TourStepId; title: string; body: string }[] = [
  {
    id: "hero",
    title: "Public AI demo, for the UK public",
    body:
      "This demo shows what a UK sovereign public AI could feel like: a companion to the BBC, courts and local councils — with transparent tool calls, not a generic chatbot.",
  },
  {
    id: "bbc",
    title: "BBC companion: news + context",
    body:
      "Here we show how BBC news, archives and programmes are used via structured tool calls, so answers are grounded and attributed — not scraped or built on opaque training from copyrighted content.",
  },
  {
    id: "justice",
    title: "Justice guide: procedure + rights",
    body:
      "This section reframes “access to justice” as an experience: plain-English guidance grounded in official sources, with clear disclaimers and signposting.",
  },
  {
    id: "planning",
    title: "Planning assistant: clarity for residents",
    body:
      "Planning is high-volume and politically salient. This demo shows a bounded assistant that explains proposals, timelines and options using official planning guidance.",
  },
  {
    id: "trust",
    title: "Trust: provenance + governance",
    body:
      "This is where the demo becomes credible for partners and regulators: structured tool calls, visible provenance, and a ‘public AI’ stance.",
  },
  {
    id: "technology",
    title: "Technology: DeepMind partnership",
    body:
      "Finally, we name the model partner: a large language model supplied in partnership with Google DeepMind, with institutional control and governance layered on top.",
  },
];

const SESSION_LIMIT = 10;

function decodeConversation(encoded: string): {
  messages: Array<{ role: string; content: string }>;
  mode: ModeId;
} | null {
  try {
    const bytes = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
    const json = JSON.parse(new TextDecoder().decode(inflate(bytes)));
    if (json?.messages && json?.mode && Object.keys(modes).includes(json.mode)) {
      return json;
    }
    return null;
  } catch {
    return null;
  }
}

function predictModeFromText(text: string): ModeId | null {
  const t = text.toLowerCase();
  if (!t.trim()) return null;

  const bbc = [
    "bbc",
    "iplayer",
    "tv licence",
    "licence fee",
    "licence",
    "news",
    "today",
    "current affairs",
  ];
  const justice = [
    "court",
    "hearing",
    "judgment",
    "judgement",
    "legal aid",
    "solicitor",
    "rights",
    "appeal",
    "small claims",
    "county court",
    "benefits",
    "landlord",
  ];
  const planning = [
    "planning",
    "application",
    "object",
    "objection",
    "permitted development",
    "section 106",
    "loft",
    "parking",
    "light",
    "traffic",
    "council",
    "developer",
  ];

  let bbcScore = 0;
  let justiceScore = 0;
  let planningScore = 0;

  for (const kw of bbc) if (t.includes(kw)) bbcScore += 2;
  for (const kw of justice) if (t.includes(kw)) justiceScore += 2;
  for (const kw of planning) if (t.includes(kw)) planningScore += 2;

  // Additional weak signals
  if (/\bwhat\b|\bwhy\b|\bhow\b/.test(t)) {
    bbcScore += 1;
    justiceScore += 1;
    planningScore += 1;
  }

  const max = Math.max(bbcScore, justiceScore, planningScore);
  if (max < 2) return null;
  if (bbcScore === max) return "bbc";
  if (justiceScore === max) return "justice";
  return "planning";
}

const representativePrompts: Record<ModeId, string> = {
  bbc: "What's happening with the BBC licence fee right now?",
  justice: "I've received a county court judgment letter — what does it mean?",
  planning: "There's a planning application for flats on my street — how do I object?",
};

const ORG_DIRECTORY: ExtraChatAgent[] = [
  { id: "hmrc", label: "HMRC", kind: "org", source: "directory" },
  { id: "dvla", label: "DVLA", kind: "org", source: "directory" },
  { id: "nhs-england", label: "NHS England", kind: "org", source: "directory" },
  { id: "nhs-111", label: "NHS 111", kind: "org", source: "directory", phone: "tel:111" },
  { id: "ofcom", label: "Ofcom", kind: "org", source: "directory" },
  { id: "ofgem", label: "Ofgem", kind: "org", source: "directory" },
  { id: "dwp", label: "DWP", kind: "org", source: "directory" },
  { id: "home-office", label: "Home Office", kind: "org", source: "directory" },
  { id: "companies-house", label: "Companies House", kind: "org", source: "directory" },
  { id: "land-registry", label: "HM Land Registry", kind: "org", source: "directory" },
  { id: "environment-agency", label: "Environment Agency", kind: "org", source: "directory" },
  { id: "food-standards", label: "Food Standards Agency", kind: "org", source: "directory" },
  { id: "citizens-advice", label: "Citizens Advice", kind: "org", source: "directory" },
  { id: "age-uk", label: "Age UK", kind: "org", source: "directory" },
  { id: "shelter", label: "Shelter", kind: "org", source: "directory" },
  { id: "mind", label: "Mind", kind: "org", source: "directory" },
  { id: "scope", label: "Scope", kind: "org", source: "directory" },
  { id: "rnib", label: "RNIB", kind: "org", source: "directory" },
  { id: "macmillan", label: "Macmillan Cancer Support", kind: "org", source: "directory" },
  { id: "barnardos", label: "Barnardo's", kind: "org", source: "directory" },
  { id: "nspcc", label: "NSPCC", kind: "org", source: "directory" },
  { id: "british-red-cross", label: "British Red Cross", kind: "org", source: "directory" },
  { id: "national-trust", label: "National Trust", kind: "org", source: "directory" },
  { id: "which", label: "Which?", kind: "org", source: "directory" },
  { id: "sainsburys", label: "Sainsbury's", kind: "org", source: "directory" },
  { id: "waitrose", label: "Waitrose", kind: "org", source: "directory" },
  { id: "tesco", label: "Tesco", kind: "org", source: "directory" },
  { id: "asda", label: "Asda", kind: "org", source: "directory" },
  { id: "morrisons", label: "Morrisons", kind: "org", source: "directory" },
  { id: "marks-spencer", label: "Marks & Spencer", kind: "org", source: "directory" },
  { id: "boots", label: "Boots", kind: "org", source: "directory" },
  { id: "john-lewis", label: "John Lewis", kind: "org", source: "directory" },
  { id: "coop", label: "Co-op", kind: "org", source: "directory" },
  { id: "ocado", label: "Ocado", kind: "org", source: "directory" },
  { id: "aldi", label: "Aldi UK", kind: "org", source: "directory" },
  { id: "lidl", label: "Lidl GB", kind: "org", source: "directory" },
  { id: "nationwide", label: "Nationwide", kind: "org", source: "directory" },
  { id: "barclays", label: "Barclays", kind: "org", source: "directory" },
  { id: "lloyds", label: "Lloyds Bank", kind: "org", source: "directory" },
  { id: "natwest", label: "NatWest", kind: "org", source: "directory" },
  { id: "halifax", label: "Halifax", kind: "org", source: "directory" },
  { id: "monzo", label: "Monzo", kind: "org", source: "directory" },
  { id: "starling", label: "Starling Bank", kind: "org", source: "directory" },
  { id: "vodafone", label: "Vodafone UK", kind: "org", source: "directory" },
  { id: "ee", label: "EE", kind: "org", source: "directory" },
  { id: "o2", label: "O2", kind: "org", source: "directory" },
  { id: "three", label: "Three UK", kind: "org", source: "directory" },
  { id: "openreach", label: "Openreach", kind: "org", source: "directory" },
  { id: "thames-water", label: "Thames Water", kind: "org", source: "directory" },
  { id: "octopus-energy", label: "Octopus Energy", kind: "org", source: "directory" },
];

const PEOPLE_DIRECTORY: ExtraChatAgent[] = [
  { id: "person-anna", label: "Anna Patel", kind: "person", source: "directory" },
  { id: "person-james", label: "James Taylor", kind: "person", source: "directory" },
  { id: "person-rachel", label: "Rachel Khan", kind: "person", source: "directory" },
  { id: "person-tom", label: "Tom Williams", kind: "person", source: "directory" },
  { id: "person-hannah", label: "Hannah Lewis", kind: "person", source: "directory" },
  { id: "person-david", label: "David Morgan", kind: "person", source: "directory" },
];

const SIGNAL_CONTACTS: ExtraChatAgent[] = [
  { id: "sig-olivia", label: "Olivia Evans", kind: "person", source: "signal", phone: "tel:+447700900111" },
  { id: "sig-liam", label: "Liam Ahmed", kind: "person", source: "signal", phone: "tel:+447700900112" },
  { id: "sig-grace", label: "Grace Thompson", kind: "person", source: "signal", phone: "tel:+447700900113" },
  { id: "sig-noah", label: "Noah Singh", kind: "person", source: "signal", phone: "tel:+447700900114" },
  { id: "sig-emily", label: "Emily Jones", kind: "person", source: "signal", phone: "tel:+447700900115" },
  { id: "sig-arthur", label: "Arthur Green", kind: "person", source: "signal", phone: "tel:+447700900116" },
];

export default function Home() {
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const activeStep = tourSteps[activeStepIndex];

  const nextStep = () => {
    setActiveStepIndex((prev) => Math.min(prev + 1, tourSteps.length - 1));
  };

  const prevStep = () => {
    setActiveStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const openStep = (id: TourStepId) => {
    const index = tourSteps.findIndex((step) => step.id === id);
    if (index !== -1) {
      setActiveStepIndex(index);
      setIsTourOpen(true);
    }
  };

  // ─── Demo chat state (moved from /demo into the homepage) ────────────────
  const [activeMode, setActiveMode] = useState<ModeId>("bbc");
  const [questionCount, setQuestionCount] = useState(0);
  const [restoredMessages, setRestoredMessages] = useState<
    Array<{ id: string; role: "user" | "assistant"; content: string }> | undefined
  >(undefined);
  const [restoredMode, setRestoredMode] = useState<ModeId | undefined>(undefined);
  const [isRestoringFromUrl, setIsRestoringFromUrl] = useState(true);
  const [chatSessionId, setChatSessionId] = useState(0);
  const [extraAgents, setExtraAgents] = useState<ExtraChatAgent[]>([]);

  // Restore from ?c= permalink on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const param = new URLSearchParams(window.location.search).get("c");
    if (param) {
      const decoded = decodeConversation(param);
      if (decoded) {
        setRestoredMode(decoded.mode);
        setActiveMode(decoded.mode);
        setRestoredMessages(
          decoded.messages.map((m, i) => ({
            id: String(i),
            role: m.role as "user" | "assistant",
            content: m.content,
          }))
        );
        setQuestionCount(decoded.messages.filter((m) => m.role === "user").length);
      }
    }
    setIsRestoringFromUrl(false);
  }, []);

  const {
    messages,
    input,
    setInput,
    handleSubmit,
    isLoading,
    setMessages,
  } = useChat({
    api: "/api/chat",
    body: { mode: activeMode },
    initialMessages: restoredMessages ?? [],
    onFinish: () => {
      setQuestionCount((c) => c + 1);
    },
  });

  // Sync restored mode into useChat when it becomes available
  useEffect(() => {
    if (restoredMode && restoredMessages) {
      setMessages(restoredMessages);
    }
  }, [restoredMode, restoredMessages, setMessages]);

  const allToolInvocations: ToolInvocation[] = useMemo(
    () =>
      messages.flatMap((m) => (m.toolInvocations as ToolInvocation[] | undefined) ?? []),
    [messages]
  );

  const hasAsked = useMemo(() => messages.some((m) => m.role === "user"), [messages]);

  const predictedMode = useMemo(() => {
    if (hasAsked) return null;
    return predictModeFromText(input);
  }, [input, hasAsked]);

  useEffect(() => {
    if (hasAsked) return;
    if (!predictedMode) return;
    if (predictedMode !== activeMode) setActiveMode(predictedMode);
  }, [predictedMode, hasAsked, activeMode]);

  const handleNewChat = () => {
    setMessages([]);
    setInput("");
    setQuestionCount(0);
    setChatSessionId((c) => c + 1);
    setExtraAgents([]);
  };

  const handleModeButton = (mode: ModeId) => {
    setActiveMode(mode);
    setMessages([]);
    setInput("");
    setQuestionCount(0);
    setChatSessionId((c) => c + 1);
    setExtraAgents([]);

    setTimeout(() => {
      const el = document.querySelector(
        'textarea[aria-label="Ask a question"]'
      ) as HTMLTextAreaElement | null;
      el?.focus();
    }, 0);
  };

  const handlePickExample = (mode: ModeId, text: string) => {
    setActiveMode(mode);
    setInput(text);
    setTimeout(() => {
      document
        .querySelector<HTMLTextAreaElement>('textarea[aria-label="Ask a question"]')
        ?.focus();
    }, 0);
  };

  const handleAddAgents = (agentsToAdd: ExtraChatAgent[]) => {
    if (agentsToAdd.length === 0) return;
    setExtraAgents((prev) => {
      const known = new Set(prev.map((a) => a.id));
      const additions = agentsToAdd.filter((a) => !known.has(a.id));
      return [...prev, ...additions];
    });
  };

  useEffect(() => {
    if (!isAccountMenuOpen) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsAccountMenuOpen(false);
    };
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [isAccountMenuOpen]);

  if (isRestoringFromUrl) return null;

  return (
    <div className="min-h-screen">
      {/* Header — logo centered (BBC-style bar) */}
      <header className="relative border-b border-stone-200 bg-white/90 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center min-h-[52px]">
          <div className="flex flex-1 justify-start">
            <button
              type="button"
              onClick={() => setIsMenuOpen((v) => !v)}
              aria-label="Open menu"
              className="inline-flex items-center justify-center h-10 w-10 rounded-md hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#f0442c]"
            >
              <span className="block">
                <span className="block h-0.5 w-5 bg-stone-900 mb-1" />
                <span className="block h-0.5 w-5 bg-stone-900 mb-1" />
                <span className="block h-0.5 w-5 bg-stone-900" />
              </span>
            </button>
          </div>

          <a
            href="#top"
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
          >
            <div className="relative h-8 w-32 overflow-hidden rounded-sm">
              <Image
                src="/public-AI-logo.png"
                alt="Public AI"
                fill
                sizes="128px"
                className="object-contain"
                priority
              />
            </div>
          </a>

          <div className="flex flex-1 justify-end items-center gap-3">
            <div className="relative md:hidden">
              <button
                type="button"
                onClick={() => setIsAccountMenuOpen((v) => !v)}
                aria-label="Open account actions"
                aria-expanded={isAccountMenuOpen}
                aria-haspopup="menu"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-300 text-stone-700 hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#f0442c]"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.118a7.5 7.5 0 0115 0A17.933 17.933 0 0112 21.75a17.933 17.933 0 01-7.5-1.632z"
                  />
                </svg>
              </button>
              {isAccountMenuOpen && (
                <div
                  className="absolute right-0 top-[calc(100%+0.4rem)] z-40 w-40 rounded-xl border border-stone-200 bg-white p-1.5 shadow-xl"
                  role="menu"
                  aria-label="Account actions"
                >
                  <a
                    href="/subscribe"
                    role="menuitem"
                    onClick={() => setIsAccountMenuOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100"
                  >
                    Subscribe
                  </a>
                  <a
                    href="/sign-in"
                    role="menuitem"
                    onClick={() => setIsAccountMenuOpen(false)}
                    className="mt-1 block rounded-lg bg-[#f0442c] px-3 py-2 text-sm font-semibold text-white hover:bg-[#d33a24]"
                  >
                    Sign in
                  </a>
                </div>
              )}
            </div>
            <a
              href="/subscribe"
              className="hidden md:inline-flex items-center rounded-full border border-stone-300 px-4 py-1.5 text-xs md:text-sm font-semibold text-stone-800 hover:bg-stone-100"
            >
              Subscribe
            </a>
            <a
              href="/sign-in"
              className="hidden md:inline-flex items-center rounded-full bg-[#f0442c] px-4 py-1.5 text-xs md:text-sm font-semibold text-white hover:bg-[#d33a24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#f0442c]"
            >
              Sign in
            </a>
          </div>
        </div>
      </header>

      {isAccountMenuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-10 cursor-default bg-transparent md:hidden"
          aria-label="Close account menu"
          onClick={() => setIsAccountMenuOpen(false)}
        />
      )}

      {isMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:bg-black/40"
          onClick={() => setIsMenuOpen(false)}
        >
          <div
            className="absolute top-0 left-0 right-0 bg-white md:rounded-b-2xl shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                Menu
              </p>
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="text-xs font-semibold text-stone-600 hover:text-stone-900"
              >
                Close
              </button>
            </div>
            <div className="max-w-5xl mx-auto px-6 pb-4 grid gap-2">
              <a
                href="#demo"
                className="rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-800 hover:bg-stone-50"
                onClick={() => setIsMenuOpen(false)}
              >
                Live demo
              </a>
              <a
                href="#bbc"
                className="rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-800 hover:bg-stone-50"
                onClick={() => setIsMenuOpen(false)}
              >
                BBC companion
              </a>
              <a
                href="#justice"
                className="rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-800 hover:bg-stone-50"
                onClick={() => setIsMenuOpen(false)}
              >
                Justice guide
              </a>
              <a
                href="#planning"
                className="rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-800 hover:bg-stone-50"
                onClick={() => setIsMenuOpen(false)}
              >
                Planning assistant
              </a>
              <a
                href="#trust"
                className="rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-800 hover:bg-stone-50"
                onClick={() => setIsMenuOpen(false)}
              >
                Trust
              </a>
              <a
                href="#technology"
                className="rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-800 hover:bg-stone-50"
                onClick={() => setIsMenuOpen(false)}
              >
                Technology
              </a>
              <button
                type="button"
                onClick={() => {
                  setActiveStepIndex(0);
                  setIsTourOpen(true);
                  setIsMenuOpen(false);
                }}
                className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-800 hover:bg-stone-100"
              >
                Start the demo tour
              </button>
            </div>
          </div>
        </div>
      )}

      <main id="top">
        {/* Full-screen demo hero */}
        <section
          id="demo"
          className="min-h-[calc(100dvh-52px)] min-h-[calc(100vh-52px)] flex flex-col border-b border-stone-200/80 bg-gradient-to-b from-stone-100 via-[#e8e6e3] to-stone-200/90"
        >
          <div className="flex-1 flex flex-col justify-center w-full max-w-6xl mx-auto px-5 sm:px-10 md:px-14 lg:px-20 py-10 md:py-14 lg:py-20">
            <div className="rounded-[1.75rem] md:rounded-[2rem] shadow-[0_25px_80px_-12px_rgba(0,0,0,0.35)] shadow-stone-900/25 border border-[#3d2828]/80 bg-stone-900/5 overflow-hidden ring-1 ring-black/10">
              <div className="flex flex-col md:flex-row md:items-stretch min-h-[min(560px,72vh)] w-full font-sans antialiased">
                <aside
                  id="demo-in-chat"
                  className="relative z-10 min-h-0 w-full md:w-[200px] md:min-w-[200px] md:max-w-[220px] shrink-0 order-2 md:order-1 border-t md:border-t-0 md:border-r border-[#3d2828]"
                >
                  <InChatPane
                    activeMode={activeMode}
                    toolInvocations={allToolInvocations}
                    isStreaming={isLoading}
                    chatSessionId={chatSessionId}
                    onSuggestedQuery={handlePickExample}
                    extraAgents={extraAgents}
                    onAddAgents={handleAddAgents}
                    organizationDirectory={ORG_DIRECTORY}
                    peopleDirectory={PEOPLE_DIRECTORY}
                    signalContacts={SIGNAL_CONTACTS}
                  />
                </aside>

                <div className="order-1 md:order-2 flex min-h-0 min-h-[min(380px,50vh)] flex-1 flex-col md:min-h-[min(560px,72vh)]">
                  <form
                    id="chat-form"
                    className="flex h-full min-h-0 w-full flex-1 flex-col"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (questionCount >= SESSION_LIMIT || !input.trim() || isLoading) return;
                      handleSubmit(e);
                    }}
                  >
                    <ChatPanel
                      messages={messages}
                      input={input}
                      isLoading={isLoading}
                      questionCount={questionCount}
                      onInputChange={setInput}
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (questionCount >= SESSION_LIMIT || !input.trim() || isLoading) return;
                        handleSubmit(e as React.FormEvent<HTMLFormElement>);
                      }}
                      allToolInvocations={allToolInvocations}
                      examplePrompts={[
                        {
                          id: "demo-bbc",
                          mode: "bbc",
                          text: representativePrompts.bbc,
                          shortLabel: "BBC licence fee",
                        },
                        {
                          id: "demo-justice",
                          mode: "justice",
                          text: representativePrompts.justice,
                          shortLabel: "Judgment letter",
                        },
                        {
                          id: "demo-planning",
                          mode: "planning",
                          text: representativePrompts.planning,
                          shortLabel: "Local planning objection",
                        },
                      ]}
                      onPickExample={handlePickExample}
                      onNewChat={handleNewChat}
                    />
                  </form>
                </div>
              </div>
            </div>
            <p className="mx-auto mt-6 max-w-md text-center text-[11px] leading-relaxed text-stone-500 md:mt-8">
              Encrypted and private
            </p>
          </div>
        </section>

        {/* ─── Homepage marketing (below the demo hero) ─────────────────────── */}

        <section className="max-w-5xl mx-auto px-6 py-16 md:py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f0442c] mb-4">
            Public AI for the UK
          </p>
          <h1 className="font-serif text-4xl md:text-5xl font-semibold leading-tight text-stone-900 mb-6 max-w-3xl">
            Public AI that works with the institutions you already trust.
          </h1>
          <p className="text-xl text-stone-600 leading-relaxed max-w-2xl mb-8">
            A working prototype of what public AI infrastructure could look like in the UK —
            deployed alongside the BBC, the courts and local councils, grounded in real public
            data feeds.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <a
              href="#demo"
              className="inline-flex items-center rounded-full bg-[#f0442c] px-6 py-3 text-sm font-semibold text-white hover:bg-[#d33a24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#f0442c]"
            >
              Try the live demo
            </a>
            <button
              type="button"
              onClick={() => openStep("trust")}
              className="inline-flex items-center rounded-full border border-stone-300 px-6 py-3 text-sm font-semibold text-stone-800 hover:bg-stone-50"
            >
              How your content is protected
            </button>
          </div>
        </section>

        <section id="features" className="max-w-5xl mx-auto px-6 pb-16 md:pb-24">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                BBC News &amp; programmes
              </p>
              <h3 className="mt-3 font-serif text-xl font-semibold text-stone-900">
                A companion to public service media
              </h3>
              <p className="mt-3 text-sm text-stone-600 leading-relaxed">
                Ground answers in BBC news, archives and iPlayer metadata — with clear attribution
                and respect for rights, not opaque scraping.
              </p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Justice &amp; health
              </p>
              <h3 className="mt-3 font-serif text-xl font-semibold text-stone-900">
                Clearer paths through complex systems
              </h3>
              <p className="mt-3 text-sm text-stone-600 leading-relaxed">
                Help people understand hearings, forms and timelines using official guidance and
                trusted NHS information — always with appropriate disclaimers.
              </p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Councils &amp; planning
              </p>
              <h3 className="mt-3 font-serif text-xl font-semibold text-stone-900">
                Local decisions, explained
              </h3>
              <p className="mt-3 text-sm text-stone-600 leading-relaxed">
                Turn planning applications and local consultations into plain-language explanations
                residents can actually use.
              </p>
            </div>
          </div>
        </section>

        <section id="bbc" className="border-t border-stone-200 bg-stone-50">
          <div className="max-w-5xl mx-auto px-6 py-16 md:py-24 grid gap-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500 mb-3">
                BBC companion
              </p>
              <h2 className="font-serif text-3xl md:text-4xl font-semibold text-stone-900 mb-4">
                News, archives and programmes — with provenance you can see.
              </h2>
              <p className="text-lg text-stone-600 leading-relaxed mb-4">
                Public AI can sit alongside BBC services to help audiences explore stories in depth:
                pulling in articles, explainers and programme metadata through structured tool calls,
                not generic web scraping.
              </p>
              <p className="text-lg text-stone-600 leading-relaxed mb-6">
                The goal is a companion that feels unmistakably{" "}
                <span className="font-semibold text-stone-800">of the BBC</span>: trusted, careful
                with rights and transparent about where answers come from.
              </p>
              <button
                type="button"
                onClick={() => openStep("bbc")}
                className="inline-flex items-center rounded-full border border-stone-300 bg-white px-5 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-100"
              >
                View this section in the demo tour
              </button>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 mb-3">
                Example conversation
              </p>
              <div className="space-y-3 text-sm text-stone-700">
                <p>
                  <span className="font-semibold text-stone-900">You:</span> I keep seeing headlines
                  about the TV licence — what is the BBC actually asking for?
                </p>
                <p>
                  <span className="font-semibold text-stone-900">Public AI:</span> Here is a concise
                  summary based on recent BBC reporting and official statements, with links back to
                  the original articles and corporate press notices…
                </p>
              </div>
              <p className="mt-4 text-xs text-stone-500">
                Illustrative only; not a live product response.
              </p>
            </div>
          </div>
        </section>

        <section id="justice" className="border-t border-stone-200">
          <div className="max-w-5xl mx-auto px-6 py-16 md:py-24 grid gap-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500 mb-3">
                Justice guide
              </p>
              <h2 className="font-serif text-3xl md:text-4xl font-semibold text-stone-900 mb-4">
                From forms and hearings to clearer next steps.
              </h2>
              <p className="text-lg text-stone-600 leading-relaxed mb-4">
                Courts and tribunals run on procedures that are hard to navigate without help. A
                public AI layer can explain what letters mean, what deadlines matter and where to
                seek advice — grounded in official guidance, not anonymous blog posts.
              </p>
              <p className="text-lg text-stone-600 leading-relaxed mb-6">
                The emphasis is on <span className="font-semibold text-stone-800">access</span> and{" "}
                <span className="font-semibold text-stone-800">legibility</span>, with clear
                signposting to solicitors, Citizens Advice and other services where human support is
                essential.
              </p>
              <button
                type="button"
                onClick={() => openStep("justice")}
                className="inline-flex items-center rounded-full border border-stone-300 bg-white px-5 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-100"
              >
                View this section in the demo tour
              </button>
            </div>
            <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 mb-3">
                Example focus areas
              </p>
              <ul className="space-y-2 text-sm text-stone-700">
                <li>• Letters from courts and tribunals explained in plain English</li>
                <li>• Timelines for small claims, possession and benefits appeals</li>
                <li>• Checklists before hearings and deadlines for evidence</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="planning" className="border-t border-stone-200 bg-stone-50">
          <div className="max-w-5xl mx-auto px-6 py-16 md:py-24 grid gap-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500 mb-3">
                Planning assistant
              </p>
              <h2 className="font-serif text-3xl md:text-4xl font-semibold text-stone-900 mb-4">
                Making planning applications legible on your street.
              </h2>
              <p className="text-lg text-stone-600 leading-relaxed mb-4">
                Planning notices are written for professionals. Residents often see jargon-heavy
                leaflets and PDFs with little sense of what is proposed, how to respond or what
                happens next.
              </p>
              <p className="text-lg text-stone-600 leading-relaxed mb-6">
                A bounded planning assistant can summarise applications, surface key impacts and
                point to official consultation routes — always anchored in local and national
                policy documents.
              </p>
              <button
                type="button"
                onClick={() => openStep("planning")}
                className="inline-flex items-center rounded-full border border-stone-300 bg-white px-5 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-100"
              >
                View this section in the demo tour
              </button>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 mb-3">
                Example questions
              </p>
              <ul className="space-y-2 text-sm text-stone-700">
                <li>• &ldquo;What is actually being built on this plot?&rdquo;</li>
                <li>• &ldquo;How could this affect daylight, parking and traffic?&rdquo;</li>
                <li>• &ldquo;How do I object or support this application formally?&rdquo;</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="trust" className="border-t border-stone-200">
          <div className="max-w-5xl mx-auto px-6 py-16 md:py-24">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500 mb-3">
              Trust &amp; governance
            </p>
            <h2 className="font-serif text-3xl md:text-4xl font-semibold text-stone-900 mb-4 max-w-3xl">
              Built for scrutiny — not just engagement metrics.
            </h2>
            <p className="text-lg text-stone-600 leading-relaxed max-w-3xl mb-4">
              Public AI has to earn trust in how it uses data about people, institutions and places.
              That means visible provenance, explicit tool calls and governance designed for
              regulators and partners — not a black box tuned only for clicks.
            </p>
            <p className="text-lg text-stone-600 leading-relaxed max-w-3xl mb-6">
              The demo on this site is a deliberately narrow slice: enough to show how answers are
              assembled, which sources are consulted and where human oversight still matters.
            </p>
            <button
              type="button"
              onClick={() => openStep("trust")}
              className="inline-flex items-center rounded-full border border-stone-300 bg-white px-5 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-100"
            >
              View this section in the demo tour
            </button>
          </div>
        </section>

        <section id="technology" className="border-t border-stone-200 bg-stone-50">
          <div className="max-w-5xl mx-auto px-6 py-16 md:py-24 grid gap-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500 mb-3">
                Technology
              </p>
              <h2 className="font-serif text-3xl md:text-4xl font-semibold text-stone-900 mb-4">
                A public layer on top of frontier models.
              </h2>
              <p className="text-lg text-stone-600 leading-relaxed mb-4">
                Public AI is not defined by any one model, but today&apos;s prototypes lean on large
                language models with strong reasoning capabilities. In this demo, responses are
                shaped by a model stack that includes a large language model supplied in partnership
                with Google DeepMind.
              </p>
              <p className="text-lg text-stone-600 leading-relaxed mb-6">
                The important part is what sits around that model: UK-specific tooling, institutional
                connectors, evaluation harnesses and governance so that outputs are appropriate for
                public service use.
              </p>
              <button
                type="button"
                onClick={() => openStep("technology")}
                className="inline-flex items-center rounded-full border border-stone-300 bg-white px-5 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-100"
              >
                View this section in the demo tour
              </button>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 mb-3">
                Model partnership (illustrative)
              </p>
              <p className="text-sm text-stone-700 leading-relaxed">
                Frontier language models can act as a flexible reasoning layer, while Public AI
                focuses on tools, data contracts and safety constraints that match UK institutions.
              </p>
              <p className="mt-3 text-xs text-stone-500">
                Relationship details here are for demonstration and do not constitute an announcement
                of a particular commercial agreement.
              </p>
            </div>
          </div>
        </section>

        <footer className="border-t border-stone-200 bg-white">
          <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <p className="text-sm text-stone-600">
              © {new Date().getFullYear()} Public AI. Research prototype — not an official government
              or BBC service.
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveStepIndex(0);
                setIsTourOpen(true);
              }}
              className="text-sm font-semibold text-[#f0442c] hover:text-[#d33a24]"
            >
              Start the guided demo tour
            </button>
          </div>
        </footer>
      </main>

      {/* Guided tour overlay */}
      {isTourOpen && activeStep && (
        <div className="fixed inset-0 z-30 bg-black/60 flex items-end md:items-center justify-center">
          <div className="w-full md:max-w-xl bg-white rounded-t-2xl md:rounded-2xl shadow-xl p-6 md:p-7 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500 mb-1">
                  Demo tour
                </p>
                <h2 className="font-serif text-lg md:text-xl font-semibold text-stone-900">
                  {activeStep.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsTourOpen(false)}
                className="text-xs text-stone-500 hover:text-stone-800"
              >
                Close
              </button>
            </div>
            <p className="text-sm text-stone-700 leading-relaxed">
              {activeStep.body}
            </p>
            <p className="text-xs text-stone-500">
              Step {activeStepIndex + 1} of {tourSteps.length}
            </p>
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={prevStep}
                disabled={activeStepIndex === 0}
                className="inline-flex items-center rounded-full border border-stone-300 px-4 py-1.5 text-xs font-semibold text-stone-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Back
              </button>
              <div className="flex-1" />
              {activeStepIndex < tourSteps.length - 1 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="inline-flex items-center rounded-full bg-[#f0442c] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#d33a24]"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsTourOpen(false)}
                  className="inline-flex items-center rounded-full bg-stone-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-stone-800"
                >
                  Finish tour
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
