import { crmNewId, crmNow } from "@/lib/data/crm-helpers";
import type { TimelineEvent, WorkforceExecution } from "@/types/workforce";

export { agentLabel } from "@/lib/workforce/pipeline/labels";

export function appendTimeline(
  execution: WorkforceExecution,
  event: Omit<TimelineEvent, "id" | "at"> & { at?: string }
): WorkforceExecution {
  const entry: TimelineEvent = {
    id: crmNewId("wf_tl"),
    at: event.at ?? crmNow(),
    actorKind: event.actorKind,
    actorId: event.actorId,
    actorLabel: event.actorLabel,
    label: event.label,
    payload: event.payload,
  };
  return {
    ...execution,
    timeline: [...execution.timeline, entry],
  };
}
