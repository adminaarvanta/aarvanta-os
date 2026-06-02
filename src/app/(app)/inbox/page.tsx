import Link from "next/link";
import { ConversationList } from "@/components/inbox/conversation-list";
import { getRepository } from "@/lib/data/repository";
import { getTenantScope } from "@/lib/tenant/context";
import { Inbox } from "lucide-react";

export default async function InboxPage() {
  const scope = await getTenantScope();
  const conversations = await getRepository().listConversations(scope);
  const first = conversations[0];

  return (
    <>
      <header className="shrink-0 border-b border-[#EDE6D6] bg-white px-6 py-4">
        <h2 className="text-xl font-semibold text-[#2A2418]">Unified Inbox</h2>
        <p className="text-sm text-[#6B6356]">
          WhatsApp, email, voice, SMS, and website chat in one place.
        </p>
      </header>
      <div className="flex flex-1 min-h-0">
        <div className="w-80 shrink-0 overflow-y-auto border-r border-[#EDE6D6] bg-white">
          <ConversationList conversations={conversations} />
        </div>
        <section className="flex flex-1 flex-col items-center justify-center bg-white text-[#6B6356]">
          {first ? (
            <div className="text-center space-y-3">
              <Inbox className="mx-auto h-12 w-12 text-[#C29B40]/60" />
              <p className="text-sm">Select a conversation or open the latest</p>
              <Link
                href={`/inbox/${first.id}`}
                className="inline-flex rounded-lg bg-[#C29B40] px-4 py-2 text-sm font-medium text-white hover:bg-[#9A7A32]"
              >
                Open {first.contact.name}
              </Link>
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
