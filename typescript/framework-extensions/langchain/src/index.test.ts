import { z } from "zod";
import { getLangChainTools } from "./index";

// Define mock action after imports
const mockAction = {
  name: "getBalance",
  description: "Get the current balance",
  schema: z.object({ test: z.string() }),
  invoke: jest.fn(async (arg: { test: string }) => `Invoked with ${arg.test}`),
};

describe("getLangChainTools", () => {
  beforeEach(() => {
    mockAction.invoke.mockClear();
  });

  it("should return an array of tools with correct properties", async () => {
    const mockAgentKit = {
      getActions: jest.fn(() => [mockAction]),
    };
    const tools = await getLangChainTools(mockAgentKit);

    expect(tools).toHaveLength(1);
    const tool = tools[0];

    expect(tool.name).toBe(mockAction.name);
    expect(tool.description).toBe(mockAction.description);
    expect(tool.schema).toBe(mockAction.schema);

    const result = await tool.invoke({ test: "data" });
    expect(result).toBe("Invoked with data");
  });

  it("caches read-only tool results for matching inputs", async () => {
    const mockAgentKit = {
      getActions: jest.fn(() => [mockAction]),
    };
    const tools = await getLangChainTools(mockAgentKit, {
      cache: {
        shouldCache: () => true,
        ttlMs: 1_000,
      },
    });

    await tools[0].invoke({ test: "data" });
    await tools[0].invoke({ test: "data" });

    expect(mockAction.invoke).toHaveBeenCalledTimes(1);
  });
});
