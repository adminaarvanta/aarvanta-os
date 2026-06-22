import { z } from "zod";
import { AGENT_TYPE_ZOD } from "@/lib/workforce/agent-types";

export const agentTypeSchema = z.enum(AGENT_TYPE_ZOD);
