import { notFound } from "next/navigation";
import Link from "next/link";
import { ConversationDetail } from "@/components/inbox/conversation-detail";
import { ConversationList } from "@/components/inbox/conversation-list";
import { getConversation, listConversations } from "@/lib/data/store";
import { ChevronLeft } from "lucide-react";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [conversation, conversations] = await Promise.all([
    getConversation(id),
    listConversations(),
  ]);

  if (!conversation) notFound();

  return (
    <>
      <header className="shrink-0 flex items-center gap-3 border-b border-[#EDE6D6] bg-white px-4 py-3 lg:px-6">
        <Link
          href="/inbox"
          className="lg:hidden rounded-lg p-1.5 text-[#6B6356] hover:bg-[#FCF9F2]"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="text-lg font-semibold text-[#2A2418]">Unified Inbox</h2>
          <p className="text-xs text-[#6B6356] hidden sm:block">
            Conversation timeline · notes · tags · AI
          </p>
        </div>
      </header>
      <div className="flex flex-1 min-h-0">
        <div className="hidden lg:block w-80 shrink-0 overflow-y-auto border-r border-[#EDE6D6] bg-white">
          <ConversationList
            conversations={conversations}
            activeId={conversation.id}
          />
        </div>
        <ConversationDetail conversation={conversation} />
      </div>
    </>
  );
}
