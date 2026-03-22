"use client";

import { type ToolInvocation } from "ai";

interface ToolTracePanelProps {
  toolInvocations: ToolInvocation[];
  isStreaming: boolean;
}

function toolDisplayName(toolName: string): string {
  const names: Record<string, string> = {
    bbc_news_search: "bbc_news_search",
    gov_guidance_search: "gov_guidance_search",
    legislation_search: "legislation_search",
    planning_search: "planning_search",
  };
  return names[toolName] ?? toolName;
}

function toolSource(toolName: string): string {
  const sources: Record<string, string> = {
    bbc_news_search: "BBC News",
    gov_guidance_search: "GOV.UK",
    legislation_search: "legislation.gov.uk",
    planning_search: "GOV.UK Planning",
  };
  return sources[toolName] ?? "Public API";
}

function ToolCallLine({ invocation }: { invocation: ToolInvocation }) {
  const name = toolDisplayName(invocation.toolName);
  const queryArg =
    (invocation.args as Record<string, string>)?.query ?? "";
  const truncatedQuery = queryArg.length > 40 ? queryArg.slice(0, 40) + "…" : queryArg;

  if (invocation.state === "call" || invocation.state === "partial-call") {
    return (
      <p className="font-mono text-sm text-stone-600 animate-pulse">
        → {name}(&quot;{truncatedQuery}&quot;)…
      </p>
    );
  }

  // result state
  const result = invocation.result as {
    resultCount?: number;
    error?: string;
  } | undefined;

  if (result?.error) {
    return (
      <p className="font-mono text-sm text-red-500">
        ✗ {name} · {result.error.slice(0, 60)}
      </p>
    );
  }

  const count = result?.resultCount ?? 0;
  const source = toolSource(invocation.toolName);

  return (
    <p className="font-mono text-sm text-stone-700">
      ✓ {name} · {count} result{count !== 1 ? "s" : ""} · {source}
    </p>
  );
}

export function ToolTracePanel({ toolInvocations, isStreaming }: ToolTracePanelProps) {
  const isEmpty = toolInvocations.length === 0 && !isStreaming;

  return (
    <aside
      className="flex flex-col border border-stone-200 rounded-2xl bg-white overflow-hidden"
      aria-live="off"
      aria-label="Tool trace"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-stone-200">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
          How this works
        </p>
      </div>

      {/* Body */}
      <div className="flex-1 p-4 space-y-2 min-h-[120px]">
        {isEmpty ? (
          <p className="text-sm text-stone-400 text-center mt-4 leading-relaxed">
            Ask a question to see how Public AI works — this panel shows each
            source it calls in real time.
          </p>
        ) : (
          toolInvocations.map((inv) => (
            <ToolCallLine key={inv.toolCallId} invocation={inv} />
          ))
        )}
      </div>

      {/* Provenance note */}
      <div className="px-4 py-3 border-t border-stone-100">
        <p className="text-xs text-stone-400 leading-relaxed">
          Answers assembled via structured tool calls. No content stored. Each
          institution controls its own data.
        </p>
      </div>
    </aside>
  );
}
