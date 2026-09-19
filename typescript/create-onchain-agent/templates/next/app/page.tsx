"use client";

import dynamic from "next/dynamic";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { ChatMessage, useAgent } from "./hooks/useAgent";

const ReactMarkdown = dynamic(() => import("react-markdown"), { ssr: false });
const STARTER_PROMPTS = [
  "What does the Empire Knowledge Core know about deploying this app on Vercel?",
  "Give me a wallet readiness checklist before I go live.",
  "What environment variables do I need for production?",
];
const VISIBLE_MESSAGE_LIMIT = 18;

const MessageBubble = memo(function MessageBubble({ message }: { message: ChatMessage }) {
  return (
    <div
      className={`p-3 rounded-2xl shadow ${
        message.sender === "user"
          ? "bg-[#0052FF] text-white self-end"
          : "bg-gray-100 dark:bg-gray-700 self-start"
      }`}
    >
      <ReactMarkdown
        components={{
          a: props => (
            <a
              {...props}
              className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300"
              target="_blank"
              rel="noopener noreferrer"
            />
          ),
        }}
      >
        {message.text}
      </ReactMarkdown>
    </div>
  );
});

/**
 * Home page for the AgentKit Quickstart
 *
 * @returns {React.ReactNode} The home page
 */
export default function Home() {
  const [input, setInput] = useState("");
  const [showFullHistory, setShowFullHistory] = useState(false);
  const { messages, sendMessage, isThinking } = useAgent();
  const visibleMessages = useMemo(
    () => (showFullHistory ? messages : messages.slice(-VISIBLE_MESSAGE_LIMIT)),
    [messages, showFullHistory],
  );

  // Ref for the messages container
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Function to scroll to the bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Auto-scroll whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const onSendMessage = async () => {
    if (!input.trim() || isThinking) return;
    const message = input;
    setInput("");
    await sendMessage(message);
  };

  const onPromptClick = async (prompt: string) => {
    if (isThinking) return;
    setInput("");
    await sendMessage(prompt);
  };

  return (
    <div className="flex flex-col flex-grow items-center justify-center text-black dark:text-white w-full h-full">
      <div className="w-full max-w-4xl h-[78vh] bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 flex flex-col">
        <div className="mb-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">
            Empire Knowledge Core
          </span>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
            Streamed responses
          </span>
          <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-900/40 dark:text-violet-200">
            Vercel-ready
          </span>
        </div>
        {/* Chat Messages */}
        <div className="flex-grow overflow-y-auto space-y-3 p-2">
          {messages.length === 0 ? (
            <div className="space-y-4 text-center text-gray-500">
              <p>Start chatting with Empire AgentKit...</p>
              <div className="flex flex-wrap justify-center gap-2">
                {STARTER_PROMPTS.map(prompt => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => onPromptClick(prompt)}
                    className="rounded-full border border-blue-200 px-3 py-2 text-sm text-blue-700 transition hover:bg-blue-50 dark:border-blue-800 dark:text-blue-200 dark:hover:bg-blue-950/40"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.length > VISIBLE_MESSAGE_LIMIT && (
                <button
                  type="button"
                  className="mx-auto rounded-full border border-gray-300 px-3 py-1 text-xs text-gray-500 transition hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-900"
                  onClick={() => setShowFullHistory(value => !value)}
                >
                  {showFullHistory ? "Show recent messages only" : "Show older messages"}
                </button>
              )}
              {visibleMessages.map(message => (
                <MessageBubble key={message.id} message={message} />
              ))}
            </>
          )}

          {/* Thinking Indicator */}
          {isThinking && <div className="text-right mr-2 text-gray-500 italic">🤖 Thinking...</div>}

          {/* Invisible div to track the bottom */}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Box */}
        <div className="flex items-center space-x-2 mt-2">
          <input
            type="text"
            className="flex-grow p-2 rounded border dark:bg-gray-700 dark:border-gray-600"
            placeholder={"Ask about deployment, wallet readiness, or onchain actions..."}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && onSendMessage()}
            disabled={isThinking}
          />
          <button
            onClick={onSendMessage}
            className={`px-6 py-2 rounded-full font-semibold transition-all ${
              isThinking
                ? "bg-gray-300 cursor-not-allowed text-gray-500"
                : "bg-[#0052FF] hover:bg-[#003ECF] text-white shadow-md"
            }`}
            disabled={isThinking}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
