import { NextResponse } from "next/server";
import { AGENT_DEFINITIONS } from "@/lib/workforce/agents";
import { getAiRuntimeStatus } from "@/lib/ai/config";

export async function GET() {
  return NextResponse.json({
    agents: AGENT_DEFINITIONS,
    ai: getAiRuntimeStatus(),
  });
}
