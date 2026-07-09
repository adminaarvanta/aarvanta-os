import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ConversationDetail } from "@/components/inbox/conversation-detail";
import { ConversationList } from "@/components/inbox/conversation-list";
import { getRepository } from "@/lib/data/repository";
import { getHrStore } from "@/lib/data/platform-store";
import { getAiRuntimeStatus } from "@/lib/ai/config";
import { resolveConversationForInbox } from "@/lib/inbox/resolve-conversation";
import { getTenantScope } from "@/lib/tenant/context";
import { Badge } from "@/components/ui/badge";
import { CHANNEL_LABELS } from "@/lib/constants";
import { ChevronLeft } from "lucide-react";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const scope = await getTenantScope();
  const repo = getRepository();
  const resolved = await resolveConversationForInbox(id, scope);
  if (!resolved) notFound();
  if (resolved.switchedWorkspace) redirect(`/inbox/${id}`);

  let conversation = resolved.conversation;
  const activeScope = resolved.scope;

  if (conversation.unreadCount > 0) {
    conversation = (await repo.markAsRead(id, activeScope)) ?? conversation;
  }

  const conversations = await repo.listConversations(activeScope);
  const hrCases = await getHrStore().listCasesByConversation(id, activeScope);

  const aiStatus = getAiRuntimeStatus();

  return (
    <>
      <header className="flex shrink-0 items-center gap-3 border-b border-[#243656] bg-[#0D1524] px-4 py-3 sm:px-6">
        <Link
          href="/inbox"
          className="rounded-lg p-1.5 text-[#9AABC4] hover:bg-[#121E32] lg:hidden"
          aria-label="Back to inbox"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold text-[#FFFFFF] sm:text-lg">
            {conversation.contact.name}
          </h2>
          <div className="mt-0.5 flex flex-wrap items-center gap-1 lg:hidden">
            {conversation.contact.email && (
              <span className="truncate text-xs text-[#9AABC4]">
                {conversation.contact.email}
              </span>
            )}
            {conversation.channels.slice(0, 2).map((ch) => (
              <Badge
                key={ch}
                className="bg-[#121E32] text-[#9AABC4] ring-[#243656] text-[10px]"
              >
                {CHANNEL_LABELS[ch]}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-[#9AABC4] hidden sm:block">
            Conversation timeline · notes · tags · AI
          </p>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        <div className="hidden lg:block w-80 shrink-0 min-h-0 overflow-y-auto overscroll-contain border-r border-[#243656] bg-[#0D1524]">
          <ConversationList
            conversations={conversations}
            activeId={conversation.id}
          />
        </div>
        <ConversationDetail
          conversation={conversation}
          aiStatus={aiStatus}
          hrCases={hrCases}
        />
      </div>
    </>
  );
}
