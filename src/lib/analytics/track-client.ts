import type { TelemetryEventName } from "@/lib/analytics/telemetry";

/** Fire-and-forget first-party event. Never send passwords or message bodies. */
export function trackClient(
  name: TelemetryEventName,
  props?: {
    path?: string;
    step?: string;
    cta?: string;
    module?: string;
    outcome?: string;
  }
) {
  if (typeof window === "undefined") return;
  try {
    void fetch("/api/telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, ...props }),
      keepalive: true,
    });
  } catch {
    /* ignore */
  }
}
