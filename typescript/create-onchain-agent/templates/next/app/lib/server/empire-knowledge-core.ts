import { getRuntimeConfig } from "@/app/lib/server/runtime-config";

type KnowledgeDocument = {
  body: string;
  id: string;
  tags: string[];
  title: string;
};

type CacheEntry = {
  expiresAt: number;
  value: string | null;
};

const knowledgeCache = new Map<string, CacheEntry>();
const MAX_KNOWLEDGE_CACHE_ENTRIES = 100;

const KNOWLEDGE_DOCUMENTS: KnowledgeDocument[] = [
  {
    id: "empire-core",
    title: "Empire Knowledge Core",
    tags: ["empire", "knowledge", "core", "memory", "context"],
    body:
      "Use the Empire Knowledge Core as a lightweight retrieval layer for stable business context, operating rules, and curated deployment guidance. Prefer short grounded answers and include only the most relevant snippets in model context.",
  },
  {
    id: "deployment",
    title: "Vercel Deployment Guidance",
    tags: ["vercel", "deployment", "serverless", "runtime", "health"],
    body:
      "Vercel deployments should avoid depending on persistent local files. Validate required environment variables, expose a health endpoint, and keep agent routes on the Node.js runtime with bounded execution time.",
  },
  {
    id: "wallet-persistence",
    title: "Wallet Persistence",
    tags: ["wallet", "persistence", "secrets", "storage", "env"],
    body:
      "For serverless environments, prefer storing exported wallet state in a secret such as AGENTKIT_WALLET_DATA instead of relying on wallet_data.txt. File persistence should remain a local-development fallback only.",
  },
  {
    id: "performance",
    title: "Performance Defaults",
    tags: ["performance", "streaming", "cache", "history", "latency"],
    body:
      "Keep prompts concise, stream responses, bound conversation history, reduce the action-provider surface, and cache read-only tool results with a short TTL to reduce cost and latency.",
  },
  {
    id: "security",
    title: "Security and Secrets",
    tags: ["security", "headers", "secrets", "environment", "safety"],
    body:
      "Never expose secrets to the client. Configure environment variables in Vercel Project Settings, disable powered-by headers, use restrictive headers for framing and MIME sniffing, and avoid logging sensitive tool payloads in production.",
  },
];

function normalize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(token => token.length > 2);
}

function scoreDocument(document: KnowledgeDocument, queryTokens: string[]): number {
  const bodyTokens = new Set([...normalize(document.title), ...normalize(document.body), ...document.tags]);
  return queryTokens.reduce((score, token) => score + (bodyTokens.has(token) ? 1 : 0), 0);
}

export function buildEmpireKnowledgeContext(query: string): string | null {
  const config = getRuntimeConfig();
  if (!config.empireKnowledgeCoreEnabled) {
    return null;
  }

  const cacheKey = query.trim().toLowerCase();
  const cached = knowledgeCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const queryTokens = normalize(query);
  const context =
    queryTokens.length === 0
      ? null
      : KNOWLEDGE_DOCUMENTS.map(document => ({
          document,
          score: scoreDocument(document, queryTokens),
        }))
          .filter(({ score }) => score > 0)
          .sort((left, right) => right.score - left.score)
          .slice(0, config.maxKnowledgeSnippets)
          .map(({ document }) => `- ${document.title}: ${document.body}`)
          .join("\n") || null;

  while (knowledgeCache.size >= MAX_KNOWLEDGE_CACHE_ENTRIES) {
    const oldestKey = knowledgeCache.keys().next().value;
    if (!oldestKey) {
      break;
    }

    knowledgeCache.delete(oldestKey);
  }

  knowledgeCache.set(cacheKey, {
    value: context,
    expiresAt: Date.now() + config.toolCacheTtlMs,
  });

  return context;
}
