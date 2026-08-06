import type { CallOutcome, QueueItemStatus, RetryPolicy } from "@/types/calling-agent";

export function outcomeToQueueStatus(outcome: CallOutcome): QueueItemStatus {
  switch (outcome) {
    case "meeting_booked":
      return "booked_meeting";
    case "not_interested":
    case "spam":
    case "already_using_competitor":
      return "not_interested";
    case "callback_requested":
    case "bad_timing":
    case "need_follow_up":
      return "callback_requested";
    case "no_answer":
      return "no_answer";
    case "voicemail":
      return "voicemail";
    case "wrong_number":
      return "wrong_number";
    case "busy":
      return "busy";
    case "failed":
    case "disconnected":
      return "failed";
    case "completed":
      return "completed";
    default:
      return "completed";
  }
}

export function isTerminalOutcome(outcome: CallOutcome): boolean {
  return (
    outcome === "meeting_booked" ||
    outcome === "not_interested" ||
    outcome === "wrong_number" ||
    outcome === "spam" ||
    outcome === "already_using_competitor" ||
    outcome === "completed"
  );
}

export function nextAttemptAtForOutcome(
  outcome: CallOutcome,
  policy: RetryPolicy,
  attemptCount: number,
  from: Date = new Date()
): { retry: boolean; nextAttemptAt: string; status: QueueItemStatus } {
  const status = outcomeToQueueStatus(outcome);

  if (isTerminalOutcome(outcome) || attemptCount >= policy.maxRetries) {
    return {
      retry: false,
      nextAttemptAt: from.toISOString(),
      status: isTerminalOutcome(outcome) ? status : "failed",
    };
  }

  const next = new Date(from);
  switch (outcome) {
    case "busy":
      next.setMinutes(next.getMinutes() + policy.busyMinutes);
      break;
    case "no_answer":
      next.setHours(next.getHours() + policy.noAnswerHours);
      break;
    case "failed":
    case "disconnected":
      next.setMinutes(next.getMinutes() + policy.failedMinutes);
      break;
    case "voicemail":
      next.setHours(next.getHours() + policy.voicemailHours);
      break;
    case "callback_requested":
    case "bad_timing":
    case "need_follow_up":
      next.setHours(next.getHours() + policy.noAnswerHours);
      break;
    default:
      return { retry: false, nextAttemptAt: from.toISOString(), status };
  }

  return { retry: true, nextAttemptAt: next.toISOString(), status: "pending" };
}
