import type { IntegrationConnection } from "@/types/integration";

export function looksLikeCalendarMailbox(email: string): boolean {
  const value = email.trim();
  return (
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) &&
    !/group\.v?\.?calendar\.google\.com/i.test(value)
  );
}

export function calendarConnectMode(
  conn: IntegrationConnection | null | undefined
): "oauth" | "ics" | "invite" | "local" | null {
  if (!conn || conn.status !== "connected") return null;
  if (conn.metadata?.mode === "ics" || conn.metadata?.icsUrl) return "ics";
  if (conn.metadata?.refreshToken || conn.metadata?.accessToken) return "oauth";
  if (
    conn.metadata?.mode === "invite" ||
    looksLikeCalendarMailbox(conn.metadata?.email || conn.accountLabel || "")
  ) {
    return "invite";
  }
  return "local";
}
