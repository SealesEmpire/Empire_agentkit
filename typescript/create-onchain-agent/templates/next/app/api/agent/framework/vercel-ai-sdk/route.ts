import { AgentRequest, AgentResponse } from "@/app/types/api";
import { streamText, type ModelMessage } from "ai";
import { NextResponse } from "next/server";
import { createAgent } from "./create-agent";

const SESSION_TTL_MS = 30 * 60 * 1000;
const MAX_SESSION_MESSAGES = 10;
const sessionMessages = new Map<string, { messages: ModelMessage[]; updatedAt: number }>();

function cleanupExpiredSessions() {
  const now = Date.now();
  for (const [sessionId, session] of sessionMessages.entries()) {
    if (now - session.updatedAt > SESSION_TTL_MS) {
      sessionMessages.delete(sessionId);
    }
  }
}

function getSessionHistory(sessionId: string): ModelMessage[] {
  cleanupExpiredSessions();
  return sessionMessages.get(sessionId)?.messages ?? [];
}

function saveSessionHistory(sessionId: string, messages: ModelMessage[]) {
  sessionMessages.set(sessionId, {
    messages: messages.slice(-MAX_SESSION_MESSAGES),
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

    // 2. Get the agent
    const agent = await createAgent();

    // 3. Build a bounded session history for this conversation
    const messages = [...getSessionHistory(sessionId), { role: "user", content: userMessage } as const];
    const result = streamText({
      ...agent,
      messages,
      onStepFinish: async ({ toolResults }) => {
        for (const tr of toolResults) {
          console.log(`Tool ${tr.toolName}: ${tr.output}`);
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
        "Content-Type": "text/plain; charset=utf-8",
        "X-Agent-Session-Id": sessionId,
      },
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json({
      error:
        error instanceof Error
          ? error.message
          : "I'm sorry, I encountered an issue processing your message. Please try again later.",
    });
  }
}
