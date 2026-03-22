"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { type ToolInvocation } from "ai";
import { type ModeId } from "@/lib/modes";

type Liveness = "green" | "yellow" | "red";

const PA_RED = "#8C1515";

const AGENTS: { id: string; label: string }[] = [
  { id: "bbc-news", label: "BBC News" },
  { id: "bbc-studios", label: "BBC Studios" },
  { id: "nhs", label: "NHS" },
  { id: "dsit", label: "DSIT" },
  { id: "govuk", label: "Gov.uk" },
];

const AGENT_ORDER = new Map(AGENTS.map((a, i) => [a.id, i]));

/** Demo phone shortcuts — institutional contact / helpline style */
const AGENT_PHONE: Partial<Record<string, string>> = {
  "bbc-news": "tel:03700100222",
  nhs: "tel:111",
  govuk: "tel:+443003301000",
};

type AgentProfile = {
  mode: ModeId;
  logoClass: string;
  logoText: string;
  suggestions: { short: string; full: string }[];
};

const PROFILES: Record<string, AgentProfile> = {
  "bbc-news": {
    mode: "bbc",
    logoClass: "bg-[#8C1515] text-white",
    logoText: "B",
    suggestions: [
      { short: "Licence fee", full: "What's happening with the BBC licence fee right now?" },
      { short: "UK headlines", full: "What are the biggest stories in UK politics today?" },
      { short: "iPlayer", full: "Tell me about BBC iPlayer and how it works" },
    ],
  },
  "bbc-studios": {
    mode: "bbc",
    logoClass: "bg-[#3d2828] text-[#e9edef] ring-1 ring-[#8C1515]/40",
    logoText: "S",
    suggestions: [
      { short: "Programmes", full: "What’s on BBC One tonight?" },
      { short: "Sounds", full: "How do I use BBC Sounds?" },
      { short: "Studios news", full: "What is BBC Studios?" },
    ],
  },
  nhs: {
    mode: "justice",
    logoClass: "bg-[#005EB8] text-white",
    logoText: "N",
    suggestions: [
      { short: "GP access", full: "How do I register with a GP?" },
      { short: "A&E wait", full: "When should I use NHS 111?" },
      { short: "Prescriptions", full: "How do NHS prescriptions work?" },
    ],
  },
  dsit: {
    mode: "planning",
    logoClass: "bg-[#4a2c2c] text-[#e9edef] ring-1 ring-[#8C1515]/35",
    logoText: "D",
    suggestions: [
      { short: "Planning app", full: "There's a planning application for flats on my street — how do I object?" },
      { short: "Permitted dev", full: "What does 'permitted development' mean for my loft conversion?" },
      { short: "Local plan", full: "How long does a planning application take to be decided?" },
    ],
  },
  govuk: {
    mode: "justice",
    logoClass: "bg-[#1d70b8] text-white",
    logoText: "G",
    suggestions: [
      { short: "Court letter", full: "I've received a county court judgment letter — what does it mean?" },
      { short: "Benefits", full: "Can I appeal a benefits decision?" },
      { short: "Small claims", full: "What is small claims court and how do I use it?" },
    ],
  },
};

function isToolInFlight(inv: ToolInvocation): boolean {
  return inv.state === "call" || inv.state === "partial-call";
}

function toolHasError(inv: ToolInvocation): boolean {
  if (inv.state !== "result" || inv.result == null) return false;
  const r = inv.result as { error?: string };
  return Boolean(r?.error);
}

function inFlight(name: string, invocations: ToolInvocation[]): boolean {
  return invocations.some((inv) => inv.toolName === name && isToolInFlight(inv));
}

function hasErrorForTool(name: string, invocations: ToolInvocation[]): boolean {
  return invocations.some((inv) => inv.toolName === name && toolHasError(inv));
}

function hasCompletedResult(name: string, invocations: ToolInvocation[]): boolean {
  return invocations.some(
    (inv) => inv.toolName === name && inv.state === "result" && !toolHasError(inv)
  );
}

function agentIdsForTool(toolName: string): string[] {
  switch (toolName) {
    case "bbc_news_search":
      return ["bbc-news", "bbc-studios"];
    case "legislation_search":
      return ["nhs"];
    case "gov_guidance_search":
      return ["govuk", "nhs"];
    case "planning_search":
      return ["dsit", "govuk"];
    default:
      return [];
  }
}

function liveness(
  agentId: string,
  toolInvocations: ToolInvocation[],
  isStreaming: boolean,
  activeMode: ModeId
): Liveness {
  const priming = isStreaming && toolInvocations.length === 0;

  switch (agentId) {
    case "bbc-news": {
      if (hasErrorForTool("bbc_news_search", toolInvocations)) return "red";
      if (inFlight("bbc_news_search", toolInvocations) || (priming && activeMode === "bbc"))
        return "green";
      return "yellow";
    }
    case "bbc-studios": {
      if (hasErrorForTool("bbc_news_search", toolInvocations)) return "yellow";
      const writingAfterBbc =
        activeMode === "bbc" &&
        isStreaming &&
        hasCompletedResult("bbc_news_search", toolInvocations) &&
        !inFlight("bbc_news_search", toolInvocations);
      if (writingAfterBbc) return "green";
      return "yellow";
    }
    case "nhs": {
      if (activeMode === "justice") {
        if (
          hasErrorForTool("legislation_search", toolInvocations) ||
          hasErrorForTool("gov_guidance_search", toolInvocations)
        )
          return "red";
        if (
          inFlight("legislation_search", toolInvocations) ||
          inFlight("gov_guidance_search", toolInvocations)
        )
          return "green";
      }
      return "yellow";
    }
    case "dsit": {
      if (hasErrorForTool("planning_search", toolInvocations)) return "red";
      if (inFlight("planning_search", toolInvocations)) return "green";
      return "yellow";
    }
    case "govuk": {
      if (hasErrorForTool("gov_guidance_search", toolInvocations)) return "red";
      if (inFlight("gov_guidance_search", toolInvocations)) return "green";
      return "yellow";
    }
    default:
      return "yellow";
  }
}

function StatusDot({ status }: { status: Liveness }) {
  const cls =
    status === "green"
      ? "bg-[#e85555] shadow-[0_0_0_2px_rgba(232,85,85,0.35)]"
      : status === "yellow"
        ? "bg-[#6a5a5a] shadow-[0_0_0_2px_rgba(106,90,90,0.25)]"
        : "bg-[#c62828] shadow-[0_0_0_2px_rgba(198,40,40,0.35)]";
  return (
    <span
      className={`inline-block h-2 w-2 shrink-0 rounded-full ${cls}`}
      title={status === "green" ? "Live" : status === "yellow" ? "Idle" : "Error"}
      aria-hidden
    />
  );
}

function statusSubtitle(
  invoked: boolean,
  transient: Liveness,
  isStreaming: boolean
): string {
  if (invoked) return "Active in this chat";
  if (transient === "red") return "Source error";
  if (transient === "green") return isStreaming ? "Connecting…" : "Live";
  return "Idle";
}

function AgentLogo({ profile }: { profile: AgentProfile }) {
  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${profile.logoClass}`}
      aria-hidden
    >
      {profile.logoText}
    </div>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
      />
    </svg>
  );
}

interface InChatPaneProps {
  activeMode: ModeId;
  toolInvocations: ToolInvocation[];
  isStreaming: boolean;
  chatSessionId: number;
  onSuggestedQuery?: (mode: ModeId, text: string) => void;
}

export function InChatPane({
  activeMode,
  toolInvocations,
  isStreaming,
  chatSessionId,
  onSuggestedQuery,
}: InChatPaneProps) {
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [invokedIds, setInvokedIds] = useState<Set<string>>(() => new Set());
  /** Fixed-position profile uses viewport coords so it isn’t clipped by sidebar overflow */
  const [profileAnchor, setProfileAnchor] = useState<{
    id: string;
    rect: DOMRect;
  } | null>(null);
  const profileCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelProfileClose = useCallback(() => {
    if (profileCloseTimerRef.current) {
      clearTimeout(profileCloseTimerRef.current);
      profileCloseTimerRef.current = null;
    }
  }, []);

  const scheduleProfileClose = useCallback(() => {
    cancelProfileClose();
    profileCloseTimerRef.current = setTimeout(() => setProfileAnchor(null), 280);
  }, [cancelProfileClose]);

  useEffect(() => () => cancelProfileClose(), [cancelProfileClose]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setProfileAnchor(null);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    setInvokedIds(new Set());
  }, [chatSessionId]);

  useEffect(() => {
    setInvokedIds((prev) => {
      const next = new Set(prev);
      for (const inv of toolInvocations) {
        const name = inv.toolName ?? "";
        for (const id of agentIdsForTool(name)) next.add(id);
      }
      return next;
    });
  }, [toolInvocations]);

  const removeAgent = useCallback((id: string) => {
    setRemovedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const restoreAllAgents = useCallback(() => {
    setRemovedIds([]);
  }, []);

  const profilePopover =
    profileAnchor &&
    PROFILES[profileAnchor.id] &&
    typeof document !== "undefined"
      ? (() => {
          const profile = PROFILES[profileAnchor.id]!;
          const rect = profileAnchor.rect;
          const panelW = 240;
          const gap = 8;
          const vw = window.innerWidth;
          /* Flush to the row’s right edge so the cursor can move into the panel without crossing a dead zone */
          const left = Math.max(gap, Math.min(rect.right, vw - gap - panelW));
          const label = AGENTS.find((a) => a.id === profileAnchor.id)?.label ?? profileAnchor.id;
          return createPortal(
            <div
              role="dialog"
              aria-label={`${label} profile`}
              className="fixed z-[10000] w-[min(240px,calc(100vw-16px))] rounded-xl border border-[#3d2828] bg-[#1a1212] p-3 shadow-2xl shadow-black/50"
              style={{ top: rect.top, left }}
              onMouseEnter={cancelProfileClose}
              onMouseLeave={scheduleProfileClose}
            >
              <div className="flex gap-2.5">
                <AgentLogo profile={profile} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-[#e9edef]">{label}</p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wide text-[#7a6a6a]">
                    Suggested
                  </p>
                  <ul className="mt-2 flex flex-col gap-1">
                    {profile.suggestions.map((s) => (
                      <li key={s.short}>
                        {onSuggestedQuery ? (
                          <button
                            type="button"
                            onClick={() => {
                              onSuggestedQuery(profile.mode, s.full);
                              setProfileAnchor(null);
                            }}
                            className="w-full rounded-md border border-[#3d2828] bg-[#141010] px-2 py-1.5 text-left text-[11px] font-medium text-[#e9edef] hover:border-[#8c1515]/45 hover:bg-[#1f1818] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8c1515]/50"
                          >
                            {s.short}
                          </button>
                        ) : (
                          <span className="block rounded-md px-2 py-1.5 text-[11px] text-[#8a7a7a]">
                            {s.short}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>,
            document.body
          );
        })()
      : null;

  const sortedVisibleAgents = useMemo(() => {
    const list = AGENTS.filter((a) => !removedIds.includes(a.id));
    return list.sort((a, b) => {
      const aGreen = invokedIds.has(a.id) ? 1 : 0;
      const bGreen = invokedIds.has(b.id) ? 1 : 0;
      if (bGreen !== aGreen) return bGreen - aGreen;
      return (AGENT_ORDER.get(a.id) ?? 0) - (AGENT_ORDER.get(b.id) ?? 0);
    });
  }, [removedIds, invokedIds]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#0f0a0a]">
      <div
        className="flex h-[52px] shrink-0 items-center justify-between gap-2 border-b px-3"
        style={{ borderColor: `${PA_RED}33` }}
      >
        <h2 className="text-[15px] font-semibold text-[#e9edef]">In chat</h2>
        <button
          type="button"
          onClick={restoreAllAgents}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#a89898] hover:bg-[#2a1f1f] hover:text-[#e9edef] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8c1515]/50 disabled:pointer-events-none disabled:opacity-25"
          aria-label="Add agents back to chat"
          disabled={removedIds.length === 0}
          title="Restore all agents"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
      <div
        className="flex-1 overflow-y-auto px-1.5 pb-2 pt-1"
        onScroll={() => setProfileAnchor(null)}
      >
        {sortedVisibleAgents.length === 0 ? (
          <p className="px-2 py-4 text-center text-[12px] text-[#8a7a7a]">
            No agents in chat. Tap + to restore.
          </p>
        ) : (
          <ul className="space-y-1">
            {sortedVisibleAgents.map((agent) => {
              const transient = liveness(agent.id, toolInvocations, isStreaming, activeMode);
              const status: Liveness = invokedIds.has(agent.id) ? "green" : transient;
              const profile = PROFILES[agent.id];
              const subtitle = statusSubtitle(invokedIds.has(agent.id), transient, isStreaming);
              return (
                <li key={agent.id} className="relative list-none">
                  <div
                    className="relative"
                    onMouseEnter={(e) => {
                      cancelProfileClose();
                      if (profile) setProfileAnchor({ id: agent.id, rect: e.currentTarget.getBoundingClientRect() });
                    }}
                    onMouseLeave={scheduleProfileClose}
                  >
                    <div className="rounded-lg px-1.5 py-1.5 text-[13px] text-[#e9edef] transition-colors duration-150 hover:bg-[#1f1818]">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 items-center gap-1.5">
                            <span className="min-w-0 truncate font-medium leading-tight">
                              {agent.label}
                            </span>
                            {AGENT_PHONE[agent.id] && (
                              <a
                                href={AGENT_PHONE[agent.id]}
                                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded border border-[#3d2828] bg-[#141010] text-[#b89898] hover:border-[#8c1515]/45 hover:bg-[#1f1818] hover:text-[#e9edef] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8c1515]/45"
                                aria-label={`Call ${agent.label}`}
                                title="Phone"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <PhoneIcon className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5 self-start">
                          <StatusDot status={status} />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (profileAnchor?.id === agent.id) setProfileAnchor(null);
                              removeAgent(agent.id);
                            }}
                            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded border border-[#3d2828] bg-[#141010] text-[#8a7a7a] text-sm leading-none hover:border-[#8c1515]/40 hover:bg-[#1f1818] hover:text-[#e9edef] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8c1515]/45"
                            aria-label={`Remove ${agent.label} from chat`}
                            title="Remove from chat"
                          >
                            −
                          </button>
                        </div>
                      </div>
                      <p className="mt-0.5 truncate text-[10px] leading-tight text-[#7a6a6a]">
                        {subtitle}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {profilePopover}
    </div>
  );
}
