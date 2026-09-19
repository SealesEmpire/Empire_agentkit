import { openai } from "@ai-sdk/openai";
import { getVercelAITools } from "@coinbase/agentkit-vercel-ai-sdk";
import { stepCountIs } from "ai";
import { getMissingRequiredEnv, getRuntimeConfig } from "@/app/lib/server/runtime-config";
import { prepareAgentkitAndWalletProvider } from "./prepare-agentkit";

/**
 * Agent Configuration Guide
 *
 * This file handles the core configuration of your AI agent's behavior and capabilities.
 *
 * Key Steps to Customize Your Agent:
 *
 * 1. Select your LLM:
 *    - Modify the `openai` instantiation to choose your preferred LLM
 *    - Configure model parameters like temperature and max tokens
 *
 * 2. Instantiate your Agent:
 *    - Pass the LLM, tools, and memory into `createAgent()`
 *    - Configure agent-specific parameters
 */

// The agent
type Agent = {
  tools: ReturnType<typeof getVercelAITools>;
  system: string;
  model: ReturnType<typeof openai>;
  stopWhen?: ReturnType<typeof stepCountIs>;
};
let agent: Agent;

/**
 * Initializes and returns an instance of the AI agent.
 * If an agent instance already exists, it returns the existing one.
 *
 * @function getOrInitializeAgent
 * @returns {Promise<Agent>} The initialized AI agent.
 *
 * @description Handles agent setup
 *
 * @throws {Error} If the agent initialization fails.
 */
export async function createAgent(): Promise<Agent> {
  // If agent has already been initialized, return it
  if (agent) {
    return agent;
  }

  const missingEnv = getMissingRequiredEnv(["OPENAI_API_KEY"]);
  if (missingEnv.length > 0) {
    throw new Error(`Missing required environment variables: ${missingEnv.join(", ")}`);
  }

  const { agentkit, walletProvider } = await prepareAgentkitAndWalletProvider();
  const config = getRuntimeConfig();

  try {
    // Initialize LLM: https://platform.openai.com/docs/models#gpt-4o
    const model = openai.chat(config.openAiModel);

    // Initialize Agent
    const canUseFaucet = walletProvider.getNetwork().networkId == "base-sepolia";
    const fundingInstruction = canUseFaucet
      ? "If funds are needed, suggest the faucet."
      : "If funds are needed, share wallet details and ask the user to fund the wallet.";
    const system = [
      "You are a concise onchain assistant powered by Coinbase Developer Platform AgentKit.",
      "Use any supplied Empire Knowledge Core context when it is relevant to the user's request.",
      fundingInstruction,
      "Before your first action, inspect the wallet to confirm the network.",
      "If a request needs unavailable tooling, say so and link to https://github.com/coinbase/agentkit/tree/main/typescript/agentkit#action-providers.",
      "If a tool returns a 5XX error, ask the user to retry later.",
      "For CDP or AgentKit questions, recommend docs.cdp.coinbase.com.",
    ].join(" ");
    const tools = getVercelAITools(agentkit, {
      cache: { ttlMs: config.toolCacheTtlMs },
    });

    agent = {
      tools,
      system,
      model,
      stopWhen: stepCountIs(config.maxAgentSteps),
    };

    return agent;
  } catch (error) {
    console.error("Error initializing agent:", error);
    throw new Error("Failed to initialize agent");
  }
}
