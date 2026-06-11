import { AiInsightsPanel } from "@/components/inbox/ai-insights-panel";
import { ConversationTimeline } from "@/components/inbox/timeline";
import { NoteForm } from "@/components/inbox/note-form";
import { ReplyForm } from "@/components/inbox/reply-form";
import { TagPicker } from "@/components/inbox/tag-picker";
import { Badge } from "@/components/ui/badge";
import { CHANNEL_LABELS } from "@/lib/constants";
import type { Conversation } from "@/types/communication";

export function ConversationDetail({ conversation }: { conversation: Conversation }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
      <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#0a0a0a] lg:overflow-hidden">
        <header className="hidden shrink-0 border-b border-[#3d3528] px-4 py-3 sm:px-6 sm:py-4 lg:block">
          <h2 className="text-base font-semibold text-[#F5E6C8] sm:text-lg">
            {conversation.contact.name}
          </h2>
          <div className="mt-1 flex flex-col gap-0.5 text-xs text-[#A89878] sm:flex-row sm:flex-wrap sm:gap-2 sm:text-sm">
            {conversation.contact.email && (
              <span className="break-all">{conversation.contact.email}</span>
            )}
            {conversation.contact.phone && <span>{conversation.contact.phone}</span>}
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

        <div className="bg-[#0a0a0a] p-4 sm:p-6 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-[#A89878]">
            Conversation timeline
          </p>
          <ConversationTimeline events={conversation.timeline} />
        </div>

        <ReplyForm
          conversationId={conversation.id}
          contact={conversation.contact}
          channels={conversation.channels}
        />
      </section>

      <aside className="w-full shrink-0 space-y-6 border-t border-[#3d3528] bg-[#101010] p-4 lg:w-80 lg:max-h-full lg:overflow-y-auto lg:border-t-0 lg:border-l">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#A89878]">
            Tags
          </p>
          <TagPicker
            conversationId={conversation.id}
            selected={conversation.tags}
          />
        </div>

        <AiInsightsPanel conversation={conversation} />

        <div className="border-t border-[#3d3528] pt-4">
          <NoteForm conversationId={conversation.id} />
        </div>

        {conversation.assignedTo && (
          <p className="text-xs text-[#A89878]">
            Assigned to <span className="font-medium">{conversation.assignedTo}</span>
          </p>
        )}
      </aside>
    </div>
  );
}
