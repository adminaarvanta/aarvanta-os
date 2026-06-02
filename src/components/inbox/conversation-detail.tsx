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
    <div className="flex flex-1 min-h-0">
      <section className="flex flex-1 flex-col min-w-0 bg-white">
        <header className="shrink-0 border-b border-[#EDE6D6] px-6 py-4">
          <h2 className="text-lg font-semibold text-[#2A2418]">
            {conversation.contact.name}
          </h2>
          <div className="mt-1 flex flex-wrap gap-2 text-sm text-[#6B6356]">
            {conversation.contact.email && <span>{conversation.contact.email}</span>}
            {conversation.contact.phone && (
              <span>{conversation.contact.phone}</span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {conversation.channels.map((ch) => (
              <Badge
                key={ch}
                className="bg-[#FCF9F2] text-[#6B6356] ring-[#EDE6D6] text-[10px]"
              >
                {CHANNEL_LABELS[ch]}
              </Badge>
            ))}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-[#6B6356]">
            Conversation timeline
          </p>
          <ConversationTimeline events={conversation.timeline} />
        </div>

        <ReplyForm
          conversationId={conversation.id}
          channels={conversation.channels}
        />
      </section>

      <aside className="w-80 shrink-0 overflow-y-auto border-l border-[#EDE6D6] bg-[#FCF9F2]/50 p-4 space-y-6">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#6B6356]">
            Tags
          </p>
          <TagPicker
            conversationId={conversation.id}
            selected={conversation.tags}
          />
        </div>

        <AiInsightsPanel conversation={conversation} />

        <div className="border-t border-[#EDE6D6] pt-4">
          <NoteForm conversationId={conversation.id} />
        </div>

        {conversation.assignedTo && (
          <p className="text-xs text-[#6B6356]">
            Assigned to <span className="font-medium">{conversation.assignedTo}</span>
          </p>
        )}
      </aside>
    </div>
  );
}
