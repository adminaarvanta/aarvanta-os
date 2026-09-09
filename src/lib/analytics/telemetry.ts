export const TELEMETRY_EVENT_NAMES = [
  "signup_start",
  "signup_complete",
  "onboarding_step",
  "first_useful_action",
  "cta_click",
  "approval_action",
  "core_error",
] as const;

export type TelemetryEventName = (typeof TELEMETRY_EVENT_NAMES)[number];

export type TelemetryEvent = {
  name: TelemetryEventName;
  at: string;
  path?: string;
  step?: string;
  cta?: string;
  module?: string;
  outcome?: string;
};

const SENSITIVE_KEY = /password|secret|token|message|body|content|document/i;

function sanitizeProps(
  props: Record<string, unknown> | undefined
): Record<string, string> {
  const out: Record<string, string> = {};
  if (!props) return out;
  for (const [key, value] of Object.entries(props)) {
    if (SENSITIVE_KEY.test(key)) continue;
    if (value === undefined || value === null) continue;
    const text = String(value);
    if (text.length > 80) continue;
    out[key] = text;
  }
  return out;
}

const buffer: TelemetryEvent[] = [];
const MAX_BUFFER = 200;

export function recordTelemetry(
  name: TelemetryEventName,
  props?: Record<string, unknown>
): TelemetryEvent {
  const extra = sanitizeProps(props);
  const event: TelemetryEvent = {
    name,
    at: new Date().toISOString(),
    path: extra.path,
    step: extra.step,
    cta: extra.cta,
    module: extra.module,
    outcome: extra.outcome,
  };
  buffer.unshift(event);
  if (buffer.length > MAX_BUFFER) buffer.pop();
  return event;
}

export function listTelemetry(limit = 50): TelemetryEvent[] {
  return buffer.slice(0, limit);
}

export function resetTelemetry(): void {
  buffer.length = 0;
}

export function isTelemetryEventName(value: string): value is TelemetryEventName {
  return (TELEMETRY_EVENT_NAMES as readonly string[]).includes(value);
}
