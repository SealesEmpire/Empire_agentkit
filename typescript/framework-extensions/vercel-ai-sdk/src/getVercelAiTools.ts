/**
 * Main exports for the CDP Vercel AI SDK package
 */

import { z } from "zod";
import type { AgentKit } from "@coinbase/agentkit/agentkit";
import type { Action } from "@coinbase/agentkit/action-providers/actionProvider";
import { tool, type ToolSet } from "ai";

type ToolCacheEntry = {
  expiresAt: number;
  value: string;
};

export type ToolCacheOptions = {
  enabled?: boolean;
  maxEntries?: number;
  shouldCache?: (action: Action) => boolean;
  ttlMs?: number;
};

export type GetVercelAIToolsOptions = {
  cache?: ToolCacheOptions;
};

const DEFAULT_CACHE_TTL_MS = 15_000;
const DEFAULT_MAX_CACHE_ENTRIES = 200;
const READ_ONLY_ACTION_PATTERN =
  /\b(get|list|read|fetch|quote|price|balance|details|info|status|search|estimate|preview)\b/i;
const MUTATING_ACTION_PATTERN =
  /\b(send|transfer|swap|deploy|create|update|withdraw|deposit|mint|burn|bridge|trade|stake|unstake|borrow|repay|approve|register|set|fund)\b/i;
const toolCache = new Map<string, ToolCacheEntry>();

function shouldCacheActionByDefault(action: Action): boolean {
  const actionSummary = `${action.name} ${action.description}`;
  return (
    READ_ONLY_ACTION_PATTERN.test(actionSummary) && !MUTATING_ACTION_PATTERN.test(actionSummary)
  );
}

function getCacheKey(action: Action, args: unknown): string {
  return `${action.name}:${JSON.stringify(args)}`;
}

function getCachedValue(cacheKey: string): string | null {
  const entry = toolCache.get(cacheKey);
  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= Date.now()) {
    toolCache.delete(cacheKey);
    return null;
  }

  return entry.value;
}

function setCachedValue(cacheKey: string, value: string, ttlMs: number, maxEntries: number) {
  while (toolCache.size >= maxEntries) {
    const oldestKey = toolCache.keys().next().value;
    if (!oldestKey) {
      break;
    }
    toolCache.delete(oldestKey);
  }

  toolCache.set(cacheKey, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

/**
 * Get Vercel AI SDK tools from an AgentKit instance
 *
 * @param agentKit - The AgentKit instance
 * @returns An array of Vercel AI SDK tools
 */
export function getVercelAITools(
  agentKit: AgentKit,
  options: GetVercelAIToolsOptions = {},
): ToolSet {
  const actions: Action[] = agentKit.getActions();
  const cacheOptions = options.cache;
  const cacheEnabled = cacheOptions?.enabled !== false;
  const shouldCache = cacheOptions?.shouldCache ?? shouldCacheActionByDefault;
  const ttlMs = cacheOptions?.ttlMs ?? DEFAULT_CACHE_TTL_MS;
  const maxEntries = cacheOptions?.maxEntries ?? DEFAULT_MAX_CACHE_ENTRIES;

  return actions.reduce((acc, action) => {
    acc[action.name] = tool({
      description: action.description,
      inputSchema: action.schema,
      execute: async (args: z.output<typeof action.schema>) => {
        if (cacheEnabled && ttlMs > 0 && shouldCache(action)) {
          const cacheKey = getCacheKey(action, args);
          const cachedValue = getCachedValue(cacheKey);
          if (cachedValue !== null) {
            return cachedValue;
          }

          const result = await action.invoke(args);
          setCachedValue(cacheKey, result, ttlMs, maxEntries);
          return result;
        }

        const result = await action.invoke(args);
        return result;
      },
    });
    return acc;
  }, {} as ToolSet);
}
