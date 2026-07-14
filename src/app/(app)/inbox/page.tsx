import { ConversationList } from "@/components/inbox/conversation-list";
import { InboxLiveSync } from "@/components/inbox/inbox-live-sync";
import { OpenConversationLink } from "@/components/inbox/open-conversation-link";
import { syncInboxEmailIfConfigured } from "@/lib/channels/sync-inbox-email";
import { isGmailConfigured } from "@/lib/channels/gmail-client";
import { getRepository } from "@/lib/data/repository";
import { isProductionMode } from "@/lib/config/app-mode";
import { getTenantScope } from "@/lib/tenant/context";
import { Inbox } from "lucide-react";

export default async function InboxPage() {
  const scope = await getTenantScope();
  const liveEmailSync = isProductionMode() && isGmailConfigured();
  if (liveEmailSync) {
    await syncInboxEmailIfConfigured();
  }
  const conversations = await getRepository().listConversations(scope);
  const first = conversations[0];
  const inboundWorkspaceId = process.env.WORKSPACE_ID;
  const showInboundHint =
    isProductionMode() &&
    inboundWorkspaceId &&
    scope.workspaceId !== inboundWorkspaceId;

  return (
    <>
      <header className="shrink-0 border-b border-border bg-surface-elevated px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground sm:text-xl">Unified Inbox</h2>
            <p className="text-xs text-muted sm:text-sm">
              WhatsApp, email, voice, SMS, and website chat in one place.
              {liveEmailSync && (
                <span className="ml-1 text-muted/80">· Email syncs every 60s while open</span>
              )}
            </p>
          </div>
          <InboxLiveSync enabled={liveEmailSync} />
        </div>
        {showInboundHint && (
          <p className="mt-2 rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-xs text-gold-bright">
            Website chat and other inbound channels route to your main workspace. Switch
            back to see those conversations.
          </p>
        )}
      </header>
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="min-h-0 w-full shrink-0 overflow-y-auto overscroll-contain bg-surface-elevated md:w-80 md:border-r md:border-border">
          <ConversationList conversations={conversations} />
        </div>
        <section className="hidden flex-1 flex-col items-center justify-center bg-surface-elevated text-muted md:flex">
          {first ? (
            <div className="text-center space-y-3">
              <Inbox className="mx-auto h-12 w-12 text-gold/60" />
              <p className="text-sm">Select a conversation or open the latest</p>
              <OpenConversationLink
                conversationId={first.id}
                label={first.contact.name}
              />
            </div>
          ) : (
            <p className="text-sm">No conversations yet</p>
          )}
        </section>
      </div>
    </>
  );
}

export const metadata = { title: "Unified Inbox" };
