import { AgentRequest, AgentResponse } from "@/app/types/api";
import { streamText, type Message } from "ai";
import { buildEmpireKnowledgeContext } from "@/app/lib/server/empire-knowledge-core";
import { getRuntimeConfig } from "@/app/lib/server/runtime-config";
import { NextResponse } from "next/server";
import { createAgent } from "./create-agent";

type ChatHistoryMessage = Omit<Message, "id">;

const sessionMessages = new Map<string, { messages: ChatHistoryMessage[]; updatedAt: number }>();

export const dynamic = "force-dynamic";
export const maxDuration = 30;
export const runtime = "nodejs";

function cleanupExpiredSessions() {
  const config = getRuntimeConfig();
  const now = Date.now();
  for (const [sessionId, session] of sessionMessages.entries()) {
    if (now - session.updatedAt > config.sessionTtlMs) {
      sessionMessages.delete(sessionId);
    }
  }
}

function getSessionHistory(sessionId: string): ChatHistoryMessage[] {
  cleanupExpiredSessions();
  return sessionMessages.get(sessionId)?.messages ?? [];
}

function saveSessionHistory(sessionId: string, messages: ChatHistoryMessage[]) {
  const config = getRuntimeConfig();
  sessionMessages.set(sessionId, {
    messages: messages.slice(-config.maxSessionMessages),
    updatedAt: Date.now(),
  });
}

/**
 * Handles incoming POST requests to interact with the AgentKit-powered AI agent.
 * This function processes user messages and streams responses from the agent.
 *
 * @function POST
 * @param {Request & { json: () => Promise<AgentRequest> }} req - The incoming request object containing the user message.
 * @returns {Promise<NextResponse<AgentResponse>>} JSON response containing the AI-generated reply or an error message.
 *
 * @description Sends a single message to the agent and returns the agents' final response.
 *
 * @example
 * const response = await fetch("/api/agent", {
 *     method: "POST",
 *     headers: { "Content-Type": "application/json" },
 *     body: JSON.stringify({ userMessage: input }),
 * });
 */
export async function POST(
  req: Request & { json: () => Promise<AgentRequest> },
): Promise<Response | NextResponse<AgentResponse>> {
  try {
    // 1️. Extract user message from the request body
    const { sessionId = crypto.randomUUID(), userMessage } = await req.json();
    if (!userMessage?.trim()) {
      return NextResponse.json({ error: "Please provide a message." }, { status: 400 });
    }

    // 2. Get the agent
    const agent = (await createAgent()) as Parameters<typeof streamText>[0];
    const requestId = crypto.randomUUID();
    const knowledgeContext = buildEmpireKnowledgeContext(userMessage);

    // 3. Build a bounded session history for this conversation
    const messages = [
      ...getSessionHistory(sessionId),
      { role: "user", content: userMessage } as const,
    ];
    const result = streamText({
      ...agent,
      maxRetries: 1,
      messages,
      system: knowledgeContext
        ? `${agent.system}\n\nEmpire Knowledge Core:\n${knowledgeContext}`
        : agent.system,
      onStepFinish: async ({ toolResults }) => {
        if (process.env.NODE_ENV !== "production") {
          for (const tr of toolResults as Array<{ output: unknown; toolName: string }>) {
            console.log(`Tool ${tr.toolName}: ${tr.output}`);
          }
        }
      },
    });

    // 4. Stream text back to the client while persisting bounded history
    const encoder = new TextEncoder();
    let assistantResponse = "";

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const delta of result.textStream) {
            assistantResponse += delta;
            controller.enqueue(encoder.encode(delta));
          }

          saveSessionHistory(sessionId, [
            ...messages,
            { role: "assistant", content: assistantResponse } as const,
          ]);
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "text/plain; charset=utf-8",
        "X-Agent-Request-Id": requestId,
        "X-Agent-Session-Id": sessionId,
        "X-Empire-Knowledge-Core": knowledgeContext ? "hit" : "miss",
      },
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "I'm sorry, I encountered an issue processing your message. Please try again later.",
      },
      { status: 500 },
    );
  }
}
