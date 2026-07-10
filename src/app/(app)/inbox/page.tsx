import { ConversationList } from "@/components/inbox/conversation-list";
import { OpenConversationLink } from "@/components/inbox/open-conversation-link";
import { getRepository } from "@/lib/data/repository";
import { isProductionMode } from "@/lib/config/app-mode";
import { getTenantScope } from "@/lib/tenant/context";
import { Inbox } from "lucide-react";

export default async function InboxPage() {
  const scope = await getTenantScope();
  const conversations = await getRepository().listConversations(scope);
  const first = conversations[0];
  const inboundWorkspaceId = process.env.WORKSPACE_ID;
  const showInboundHint =
    isProductionMode() &&
    inboundWorkspaceId &&
    scope.workspaceId !== inboundWorkspaceId;

  return (
    <>
      <header className="shrink-0 border-b border-[#243656] bg-[#0D1524] px-4 py-3 sm:px-6 sm:py-4">
        <h2 className="text-lg font-semibold text-[#FFFFFF] sm:text-xl">Unified Inbox</h2>
        <p className="text-xs text-[#9AABC4] sm:text-sm">
          WhatsApp, email, voice, SMS, and website chat in one place.
        </p>
        {showInboundHint && (
          <p className="mt-2 rounded-lg border border-[#B8965D]/30 bg-[#B8965D]/10 px-3 py-2 text-xs text-[#C9AA72]">
            Website chat and other inbound channels route to your main workspace. Switch
            back to see those conversations.
          </p>
        )}
      </header>
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="min-h-0 w-full shrink-0 overflow-y-auto overscroll-contain bg-[#0D1524] md:w-80 md:border-r md:border-[#243656]">
          <ConversationList conversations={conversations} />
        </div>
        <section className="hidden flex-1 flex-col items-center justify-center bg-[#0D1524] text-[#9AABC4] md:flex">
          {first ? (
            <div className="text-center space-y-3">
              <Inbox className="mx-auto h-12 w-12 text-[#B8965D]/60" />
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
