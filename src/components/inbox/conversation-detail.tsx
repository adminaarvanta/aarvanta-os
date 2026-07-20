import { AiInsightsPanel } from "@/components/inbox/ai-insights-panel";
import { IdentityPanel } from "@/components/inbox/identity-panel";
import { IdentityBadge } from "@/components/inbox/identity-badge";
import { HrCasePanel } from "@/components/inbox/hr-case-panel";
import { MarkReadOnView } from "@/components/inbox/mark-read-on-view";
import { ConversationTimeline } from "@/components/inbox/timeline";
import { NoteForm } from "@/components/inbox/note-form";
import { ReplyForm } from "@/components/inbox/reply-form";
import { TagPicker } from "@/components/inbox/tag-picker";
import { Badge } from "@/components/ui/badge";
import { CHANNEL_LABELS } from "@/lib/constants";
import type { AiRuntimeStatus } from "@/lib/ai/config";
import type { Conversation } from "@/types/communication";
import type { HrCase } from "@/types/hr-case";

function ConversationSidebar({
  conversation,
  aiStatus,
  hrCases,
}: {
  conversation: Conversation;
  aiStatus: AiRuntimeStatus;
  hrCases: HrCase[];
}) {
  return (
    <>
      <IdentityPanel conversation={conversation} />

      <HrCasePanel conversationId={conversation.id} initialCases={hrCases} />

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          Tags
        </p>
        <TagPicker
          conversationId={conversation.id}
          selected={conversation.tags}
        />
      </div>

      <AiInsightsPanel conversation={conversation} aiStatus={aiStatus} />

      <div className="border-t border-border pt-4">
        <NoteForm conversationId={conversation.id} />
      </div>

      {conversation.assignedTo && (
        <p className="text-xs text-muted">
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
  hrCases = [],
  forcedChannel,
}: {
  conversation: Conversation;
  aiStatus: AiRuntimeStatus;
  hrCases?: HrCase[];
  forcedChannel?: import("@/types/communication").Channel;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
      <MarkReadOnView conversationId={conversation.id} />
      <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background">
        <header className="hidden shrink-0 border-b border-border px-4 py-3 sm:px-6 sm:py-4 lg:block">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-foreground sm:text-lg">
              {conversation.contact.name}
            </h2>
            <IdentityBadge identity={conversation.identity} />
          </div>
          <div className="mt-1 flex flex-col gap-0.5 text-xs text-muted sm:flex-row sm:flex-wrap sm:gap-2 sm:text-sm">
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
                className="bg-surface-muted text-muted ring-border text-[10px]"
              >
                {CHANNEL_LABELS[ch]}
              </Badge>
            ))}
          </div>
        </header>

        <div
          data-conversation-scroll
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-background p-4 sm:p-6"
        >
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted">
            Conversation timeline
          </p>
          <ConversationTimeline events={conversation.timeline} />
        </div>

        <details className="group shrink-0 border-t border-border bg-surface-elevated lg:hidden">
          <summary className="cursor-pointer list-none px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted marker:content-none [&::-webkit-details-marker]:hidden">
            Tags, AI insights & notes
          </summary>
          <div className="space-y-6 border-t border-border p-4">
            <ConversationSidebar
              conversation={conversation}
              aiStatus={aiStatus}
              hrCases={hrCases}
            />
          </div>
        </details>

        <ReplyForm
          conversationId={conversation.id}
          contact={conversation.contact}
          channels={conversation.channels}
          forcedChannel={forcedChannel}
        />
      </section>

      <aside className="hidden w-80 shrink-0 min-h-0 space-y-6 overflow-y-auto overscroll-contain border-l border-border bg-surface-elevated p-4 lg:block">
        <ConversationSidebar
          conversation={conversation}
          aiStatus={aiStatus}
          hrCases={hrCases}
        />
      </aside>
    </div>
  );
}
