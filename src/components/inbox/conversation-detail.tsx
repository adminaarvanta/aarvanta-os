import { AiInsightsPanel } from "@/components/inbox/ai-insights-panel";
import { MarkReadOnView } from "@/components/inbox/mark-read-on-view";
import { ConversationTimeline } from "@/components/inbox/timeline";
import { NoteForm } from "@/components/inbox/note-form";
import { ReplyForm } from "@/components/inbox/reply-form";
import { TagPicker } from "@/components/inbox/tag-picker";
import { Badge } from "@/components/ui/badge";
import { CHANNEL_LABELS } from "@/lib/constants";
import type { AiRuntimeStatus } from "@/lib/ai/config";
import type { Conversation } from "@/types/communication";

function ConversationSidebar({
  conversation,
  aiStatus,
}: {
  conversation: Conversation;
  aiStatus: AiRuntimeStatus;
}) {
  return (
    <>
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#A89878]">
          Tags
        </p>
        <TagPicker
          conversationId={conversation.id}
          selected={conversation.tags}
        />
      </div>

      <AiInsightsPanel conversation={conversation} aiStatus={aiStatus} />

      <div className="border-t border-[#3d3528] pt-4">
        <NoteForm conversationId={conversation.id} />
      </div>

      {conversation.assignedTo && (
        <p className="text-xs text-[#A89878]">
          Assigned to{" "}
          <span className="font-medium">{conversation.assignedTo}</span>
        </p>
      )}
    </>
  );
}

export function ConversationDetail({
  conversation,
  aiStatus,
}: {
  conversation: Conversation;
  aiStatus: AiRuntimeStatus;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
      <MarkReadOnView conversationId={conversation.id} />
      <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#0a0a0a]">
        <header className="hidden shrink-0 border-b border-[#3d3528] px-4 py-3 sm:px-6 sm:py-4 lg:block">
          <h2 className="text-base font-semibold text-[#F5E6C8] sm:text-lg">
            {conversation.contact.name}
          </h2>
          <div className="mt-1 flex flex-col gap-0.5 text-xs text-[#A89878] sm:flex-row sm:flex-wrap sm:gap-2 sm:text-sm">
            {conversation.contact.email && (
              <span className="break-all">{conversation.contact.email}</span>
            )}
            {conversation.contact.phone && (
              <span>{conversation.contact.phone}</span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {conversation.channels.map((ch) => (
              <Badge
                key={ch}
                className="bg-[#141414] text-[#A89878] ring-[#3d3528] text-[10px]"
              >
                {CHANNEL_LABELS[ch]}
              </Badge>
            ))}
          </div>
        </header>

        <div
          data-conversation-scroll
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#0a0a0a] p-4 sm:p-6"
        >
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-[#A89878]">
            Conversation timeline
          </p>
          <ConversationTimeline events={conversation.timeline} />
        </div>

        <details className="group shrink-0 border-t border-[#3d3528] bg-[#101010] lg:hidden">
          <summary className="cursor-pointer list-none px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-[#A89878] marker:content-none [&::-webkit-details-marker]:hidden">
            Tags, AI insights & notes
          </summary>
          <div className="space-y-6 border-t border-[#3d3528] p-4">
            <ConversationSidebar
              conversation={conversation}
              aiStatus={aiStatus}
            />
          </div>
        </details>

        <ReplyForm
          conversationId={conversation.id}
          contact={conversation.contact}
          channels={conversation.channels}
        />
      </section>

      <aside className="hidden w-80 shrink-0 min-h-0 space-y-6 overflow-y-auto overscroll-contain border-l border-[#3d3528] bg-[#101010] p-4 lg:block">
        <ConversationSidebar conversation={conversation} aiStatus={aiStatus} />
      </aside>
    </div>
  );
}
