type RuntimeConfig = {
  deploymentTarget: "local" | "vercel";
  enableFileWalletStorage: boolean;
  empireKnowledgeCoreEnabled: boolean;
  isVercel: boolean;
  maxAgentSteps: number;
  maxDurationSeconds: number;
  maxKnowledgeSnippets: number;
  maxSessionMessages: number;
  openAiModel: string;
  preferredRegion: string;
  sessionTtlMs: number;
  toolCacheTtlMs: number;
  walletData: string | null;
};

const DEFAULT_MAX_AGENT_STEPS = 4;
const DEFAULT_MAX_DURATION_SECONDS = 30;
const DEFAULT_MAX_KNOWLEDGE_SNIPPETS = 3;
const DEFAULT_MAX_SESSION_MESSAGES = 10;
const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
const DEFAULT_SESSION_TTL_MS = 30 * 60 * 1000;
const DEFAULT_TOOL_CACHE_TTL_MS = 15_000;
const DEFAULT_PREFERRED_REGION = "auto";

let cachedConfig: RuntimeConfig | null = null;

function readBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === "") {
    return fallback;
  }

  return value.toLowerCase() === "true";
}

function readNumber(
  value: string | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(parsed, minimum), maximum);
}

export function getRuntimeConfig(): RuntimeConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const isVercel = process.env.VERCEL === "1";
  const deploymentTarget =
    process.env.AGENTKIT_DEPLOYMENT_TARGET === "vercel" || isVercel ? "vercel" : "local";

  cachedConfig = {
    deploymentTarget,
    enableFileWalletStorage: readBoolean(
      process.env.AGENTKIT_ENABLE_FILE_WALLET_STORAGE,
      !isVercel,
    ),
    empireKnowledgeCoreEnabled: readBoolean(process.env.EMPIRE_KNOWLEDGE_CORE_ENABLED, true),
    isVercel,
    maxAgentSteps: readNumber(process.env.AGENTKIT_MAX_STEPS, DEFAULT_MAX_AGENT_STEPS, 1, 8),
    maxDurationSeconds: readNumber(
      process.env.AGENTKIT_MAX_DURATION_SECONDS,
      DEFAULT_MAX_DURATION_SECONDS,
      5,
      60,
    ),
    maxKnowledgeSnippets: readNumber(
      process.env.EMPIRE_KNOWLEDGE_CORE_MAX_SNIPPETS,
      DEFAULT_MAX_KNOWLEDGE_SNIPPETS,
      1,
      5,
    ),
    maxSessionMessages: readNumber(
      process.env.AGENTKIT_MAX_SESSION_MESSAGES,
      DEFAULT_MAX_SESSION_MESSAGES,
      4,
      20,
    ),
    openAiModel: process.env.AGENTKIT_OPENAI_MODEL || DEFAULT_OPENAI_MODEL,
    preferredRegion: process.env.AGENTKIT_PREFERRED_REGION || DEFAULT_PREFERRED_REGION,
    sessionTtlMs: readNumber(
      process.env.AGENTKIT_SESSION_TTL_MS,
      DEFAULT_SESSION_TTL_MS,
      60_000,
      24 * 60 * 60 * 1000,
    ),
    toolCacheTtlMs: readNumber(
      process.env.AGENTKIT_TOOL_CACHE_TTL_MS,
      DEFAULT_TOOL_CACHE_TTL_MS,
      0,
      60_000,
    ),
    walletData: process.env.AGENTKIT_WALLET_DATA || null,
  };

  return cachedConfig;
}

export function getMissingRequiredEnv(keys: string[]): string[] {
  return keys.filter(key => !process.env[key]);
}
