import type { SessionContext } from "@/lib/tenant/context";
import type { ActorRef } from "@/types/identity";

export function actorFromSession(ctx: SessionContext): ActorRef {
  return {
    type: "user",
    id: ctx.userId,
    name: ctx.name,
    email: ctx.email,
    role: ctx.role,
  };
}

export function systemActor(): ActorRef {
  return { type: "system", id: "system", name: "System" };
}

export function aiAgentActor(agentType: string, name?: string): ActorRef {
  return {
    type: "ai_agent",
    id: agentType,
    name: name ?? agentType,
  };
}
