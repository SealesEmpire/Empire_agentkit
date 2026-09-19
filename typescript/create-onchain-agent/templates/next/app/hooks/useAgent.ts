import { useMemo, useState } from "react";
import { AgentRequest, AgentResponse } from "../types/api";

/**
 * Sends a user message to the AgentKit backend API and retrieves the agent's response.
 *
 * @async
 * @function callAgentAPI
 * @param {string} userMessage - The message sent by the user.
 * @returns {Promise<string | null>} The agent's response message or `null` if an error occurs.
 *
 * @throws {Error} Logs an error if the request fails.
 */
async function messageAgent(
  userMessage: string,
  sessionId: string,
  onChunk: (chunk: string) => void,
): Promise<string | null> {
  try {
    const response = await fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, userMessage } as AgentRequest),
    });

    if (!response.ok) {
      const data = (await response.json()) as AgentResponse;
      return data.error ?? "Unable to contact the agent.";
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const data = (await response.json()) as AgentResponse;
      return data.response ?? data.error ?? null;
    }

    if (!response.body) {
      const text = await response.text();
      onChunk(text);
      return text;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      fullResponse += decoder.decode(value, { stream: true });
      onChunk(fullResponse);
    }

    fullResponse += decoder.decode();
    onChunk(fullResponse);

    return fullResponse || null;
  } catch (error) {
    console.error("Error communicating with agent:", error);
    return null;
  }
}

/**
 *
 * This hook manages interactions with the AI agent by making REST calls to the backend.
 * It also stores the local conversation state, tracking messages sent by the user and
 * responses from the agent.
 *
 * #### How It Works
 * - `sendMessage(input)` sends a message to `/api/agent` and updates state.
 * - `messages` stores the chat history.
 * - `isThinking` tracks whether the agent is processing a response.
 *
 * #### See Also
 * - The API logic in `/api/agent.ts`
 *
 * @returns {object} An object containing:
 * - `messages`: The conversation history.
 * - `sendMessage`: A function to send a new message.
 * - `isThinking`: Boolean indicating if the agent is processing a response.
 */
export type ChatMessage = {
  id: string;
  text: string;
  sender: "user" | "agent";
};

export function useAgent() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const sessionId = useMemo(() => crypto.randomUUID(), []);

  /**
   * Sends a user message, updates local state, and retrieves the agent's response.
   *
   * @param {string} input - The message from the user.
   */
  const sendMessage = async (input: string) => {
    if (!input.trim()) return;

    const userMessageId = crypto.randomUUID();
    const agentMessageId = crypto.randomUUID();

    setMessages(prev => [
      ...prev,
      { id: userMessageId, text: input, sender: "user" },
      { id: agentMessageId, text: "", sender: "agent" },
    ]);
    setIsThinking(true);

    const responseMessage = await messageAgent(input, sessionId, responseChunk => {
      setMessages(prev =>
        prev.map(message =>
          message.id === agentMessageId ? { ...message, text: responseChunk } : message,
        ),
      );
    });

    if (responseMessage) {
      setMessages(prev =>
        prev.map(message =>
          message.id === agentMessageId ? { ...message, text: responseMessage } : message,
        ),
      );
    } else {
      setMessages(prev =>
        prev.map(message =>
          message.id === agentMessageId
            ? {
                ...message,
                text: "I'm sorry, I encountered an issue processing your message. Please try again later.",
              }
            : message,
        ),
      );
    }

    setIsThinking(false);
  };

  return { messages, sendMessage, isThinking };
}
