export type FabricTaskResult = {
  buddyId: string;
  buddyName: string;
  task: string;
  recommendation: string;
  reasoning: string;
  confidence: number;
  riskLevel: "low" | "medium" | "high";
  suggestedActions: string[];
  usedAi: boolean;
  engine?: { engine: string; executed: boolean; output?: Record<string, unknown> };
};

export type EngineDispatchResult = {
  engine: string;
  executed: boolean;
  output?: Record<string, unknown>;
};
