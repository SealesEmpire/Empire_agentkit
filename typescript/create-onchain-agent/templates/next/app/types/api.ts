export type AgentRequest = {
  sessionId?: string;
  userMessage: string;
};

export type AgentResponse = { response?: string; error?: string };
