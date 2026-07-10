import { syncGmailInbox } from "@/lib/channels/gmail-sync";
import { isGmailConfigured } from "@/lib/channels/gmail-client";
import { isProductionMode } from "@/lib/config/app-mode";

export type InboxEmailSyncResult =
  | { ran: false; reason: "demo" | "not_configured" }
  | { ran: true; processed: number; skipped: number; errors: string[] };

/** Pull new Gmail messages into the inbox (IMAP). Safe to call on every inbox visit. */
export async function syncInboxEmailIfConfigured(): Promise<InboxEmailSyncResult> {
  if (!isProductionMode() || !isGmailConfigured()) {
    return {
      ran: false,
      reason: !isProductionMode() ? "demo" : "not_configured",
    };
  }

  try {
    const result = await syncGmailInbox();
    return { ran: true, ...result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    console.warn("[inbox-email-sync]", message);
    return { ran: true, processed: 0, skipped: 0, errors: [message] };
  }
}
