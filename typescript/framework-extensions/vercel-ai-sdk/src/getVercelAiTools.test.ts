import { z } from "zod";
import { getVercelAITools } from "./getVercelAiTools";

// Define mock action after imports
const mockAction = {
  name: "getBalance",
  description: "Get the current balance",
  schema: z.object({ test: z.string() }),
  invoke: jest.fn(async (arg: { test: string }) => `Invoked with ${arg.test}`),
};

describe("getVercelAITools", () => {
  beforeEach(() => {
    mockAction.invoke.mockClear();
  });

  it("should return a record of tools with correct properties", async () => {
    const mockAgentKit = {
      getActions: jest.fn(() => [mockAction]),
    };
    const tools = getVercelAITools(mockAgentKit);

    expect(tools).toHaveProperty("getBalance");
    const tool = tools.getBalance;

    expect((tool as { description?: string }).description).toBe(mockAction.description);
    expect((tool as { inputSchema?: unknown }).inputSchema).toBe(mockAction.schema);

    // Test execution with required options
    const result = await tool.execute!(
      { test: "data" },
      {
        abortSignal: new AbortController().signal,
        toolCallId: "test-call",
        messages: [],
      },
    );
    expect(result).toBe("Invoked with data");
  });

  it("caches read-only tool results for matching inputs", async () => {
   const mockAgentKit = {
     getActions: jest.fn(() => [mockAction]),
   };
   const tools = getVercelAITools(mockAgentKit, {
     cache: {
       shouldCache: () => true,
       ttlMs: 1_000,
     },
   });

   const execute = tools.getBalance.execute!;
   const options = {
     abortSignal: new AbortController().signal,
     toolCallId: "test-call",
     messages: [],
   };

   await execute({ test: "cached-data" }, options);
   await execute({ test: "cached-data" }, options);

   expect(mockAction.invoke).toHaveBeenCalledTimes(1);
  });
});
