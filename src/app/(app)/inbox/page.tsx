import { ConversationList } from "@/components/inbox/conversation-list";
import { OpenConversationLink } from "@/components/inbox/open-conversation-link";
import { getRepository } from "@/lib/data/repository";
import { getTenantScope } from "@/lib/tenant/context";
import { Inbox } from "lucide-react";

export default async function InboxPage() {
  const scope = await getTenantScope();
  const conversations = await getRepository().listConversations(scope);
  const first = conversations[0];

  return (
    <>
      <header className="shrink-0 border-b border-[#3d3528] bg-[#101010] px-4 py-3 sm:px-6 sm:py-4">
        <h2 className="text-lg font-semibold text-[#F5E6C8] sm:text-xl">Unified Inbox</h2>
        <p className="text-xs text-[#A89878] sm:text-sm">
          WhatsApp, email, voice, SMS, and website chat in one place.
        </p>
      </header>
      <div className="flex min-h-0 flex-1">
        <div className="w-full shrink-0 overflow-y-auto bg-[#101010] md:w-80 md:border-r md:border-[#3d3528]">
          <ConversationList conversations={conversations} />
        </div>
        <section className="hidden flex-1 flex-col items-center justify-center bg-[#101010] text-[#A89878] md:flex">
          {first ? (
            <div className="text-center space-y-3">
              <Inbox className="mx-auto h-12 w-12 text-[#D4AF37]/60" />
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
