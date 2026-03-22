import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { modes, type ModeId } from "@/lib/modes";

// Validate API key at module load time so cold-start errors are caught early
if (!process.env.ANTHROPIC_API_KEY) {
  console.error("[api/chat] ANTHROPIC_API_KEY is not set");
}

export const runtime = "edge";
export const maxDuration = 60;

export async function POST(req: Request) {
  // Key check per-request so we return a clean error, not an unhandled crash
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({
        error: "The demo is not yet configured. ANTHROPIC_API_KEY is missing.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { messages, mode } = body as { messages?: unknown; mode?: unknown };

  // Validate mode
  if (!mode || !Object.keys(modes).includes(mode as string)) {
    return new Response(
      JSON.stringify({ error: `Invalid mode. Must be one of: ${Object.keys(modes).join(", ")}` }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Validate messages array
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: "messages must be a non-empty array" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Validate last message length
  const lastMessage = messages[messages.length - 1] as { role?: string; content?: string };
  if (
    lastMessage?.role === "user" &&
    typeof lastMessage.content === "string" &&
    lastMessage.content.length > 500
  ) {
    return new Response(JSON.stringify({ error: "Question must be 500 characters or fewer" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const modeConfig = modes[mode as ModeId];

  try {
    const result = await streamText({
      model: anthropic("claude-sonnet-4-6"),
      system: modeConfig.systemPrompt,
      messages: messages as Parameters<typeof streamText>[0]["messages"],
      tools: modeConfig.tools as Parameters<typeof streamText>[0]["tools"],
      maxSteps: 5,
    });

    return result.toDataStreamResponse();
  } catch (err) {
    console.error("[api/chat] streamText error:", err);
    return new Response(
      JSON.stringify({ error: "Something went wrong. Please try again." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
