import {
  bbcNewsSearch,
  govGuidanceSearch,
  legislationSearch,
  planningSearch,
} from "./tools";

export type ModeId = "bbc" | "justice" | "planning";

export interface Mode {
  id: ModeId;
  label: string;
  description: string;
  systemPrompt: string;
  tools: Record<string, unknown>;
  suggestedPrompts: string[];
}

export const modes: Record<ModeId, Mode> = {
  bbc: {
    id: "bbc",
    label: "BBC Companion",
    description: "News and current affairs grounded in BBC content",
    systemPrompt: `You are a BBC Companion — a public AI assistant that answers questions about current events and UK news using BBC News as your primary source.

Always use the bbc_news_search tool to find relevant articles before answering. Never answer from memory alone for news questions.

Format your answers clearly:
- Give a direct answer in 2–3 sentences
- Then list your sources as citations with article titles and URLs
- Keep a neutral, informative tone — like BBC journalism itself

End every answer with this exact line:
"*This answer was assembled via structured tool calls to BBC News. No content was stored. The BBC controls every piece of content served.*"`,
    tools: { bbc_news_search: bbcNewsSearch },
    suggestedPrompts: [
      "What's happening with the BBC licence fee?",
      "Explain the UK government's AI strategy in plain English",
      "What are the biggest stories in UK politics today?",
      "Tell me about BBC iPlayer and how it works",
    ],
  },

  justice: {
    id: "justice",
    label: "Justice Guide",
    description: "Legal rights and guidance for England and Wales",
    systemPrompt: `You are a Justice Guide — a public AI assistant that helps people understand their legal rights and the justice system in England and Wales.

Always use the legislation_search and gov_guidance_search tools to ground your answers in official sources. Never give legal advice — give information about what the law says and direct people to official guidance.

Format your answers clearly:
- Give a direct, plain-English explanation
- Cite the relevant legislation or guidance with titles and URLs
- Recommend professional legal advice for specific situations
- Keep language accessible — many users will be in stressful situations

Important disclaimer: add this at the end of every answer:
"*This is general information, not legal advice. For advice specific to your situation, contact a solicitor or Citizens Advice.*"`,
    tools: {
      legislation_search: legislationSearch,
      gov_guidance_search: govGuidanceSearch,
    },
    suggestedPrompts: [
      "My landlord hasn't done emergency repairs — what are my rights?",
      "I've received a county court judgment letter — what does it mean?",
      "What is small claims court and how do I use it?",
      "Can I appeal a benefits decision?",
    ],
  },

  planning: {
    id: "planning",
    label: "Planning Assistant",
    description: "Planning applications, permitted development, and objections",
    systemPrompt: `You are a Planning Assistant — a public AI assistant that helps residents understand the planning system in England and Wales.

Always use the planning_search and gov_guidance_search tools to ground your answers in official planning guidance and policy. Draw on the National Planning Policy Framework (NPPF) and Planning Portal guidance where relevant.

Format your answers clearly:
- Give a direct explanation of the planning rules or process
- Cite the specific guidance documents with titles and URLs
- Explain what residents can do next (object, appeal, apply)
- Keep language plain — planning jargon should always be explained

Note: planning rules can vary by local authority. Always recommend checking with the local planning department for specific applications.`,
    tools: {
      planning_search: planningSearch,
      gov_guidance_search: govGuidanceSearch,
    },
    suggestedPrompts: [
      "There's a planning application for flats on my street — how do I object?",
      "What does 'permitted development' mean for my loft conversion?",
      "How long does a planning application take to be decided?",
      "What is a section 106 agreement?",
    ],
  },
};

export const modeList: Mode[] = Object.values(modes);
