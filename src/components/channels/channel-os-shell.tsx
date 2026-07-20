import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MessageCircle, Phone } from "lucide-react";
import { ChannelStatusBanner } from "@/components/channels/channel-status-banner";
import { StartChannelThread } from "@/components/channels/start-channel-thread";
import { ConversationDetail } from "@/components/inbox/conversation-detail";
import { IdentityBadge } from "@/components/inbox/identity-badge";
import { ConversationList } from "@/components/inbox/conversation-list";
import { OpenConversationLink } from "@/components/inbox/open-conversation-link";
import { Badge } from "@/components/ui/badge";
import { conversationsForChannel } from "@/lib/channels/filter-conversations";
import { CHANNEL_LABELS } from "@/lib/constants";
import { getAiRuntimeStatus } from "@/lib/ai/config";
import { getHrStore } from "@/lib/data/platform-store";
import { getRepository } from "@/lib/data/repository";
import { resolveConversationForInbox } from "@/lib/inbox/resolve-conversation";
import { getTenantScope } from "@/lib/tenant/context";
import type { Channel } from "@/types/communication";
import { ChevronLeft } from "lucide-react";

type ChannelOsConfig = {
  channel: Extract<Channel, "whatsapp" | "voice">;
  basePath: string;
  title: string;
  description: string;
  liveHint: string;
  setupHint: string;
};

const CONFIGS: Record<"whatsapp" | "voice", ChannelOsConfig> = {
  whatsapp: {
    channel: "whatsapp",
    basePath: "/whatsapp",
    title: "WhatsApp OS",
    description: "Business messaging — inbound webhooks, outbound replies, and new threads.",
    liveHint: "Messages send via Meta Cloud API when configured.",
    setupHint:
      "Set WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, and webhook verify tokens to go live.",
  },
  voice: {
    channel: "voice",
    basePath: "/voice",
    title: "Voice OS",
    description: "AI calling — outbound TTS calls, call log, and Twilio status webhooks.",
    liveHint: "Outbound calls use Twilio + TwiML when configured.",
    setupHint:
      "Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, and NEXT_PUBLIC_APP_URL to go live.",
  },
};

export async function ChannelOsListPage({
  os,
}: {
  os: "whatsapp" | "voice";
}) {
  const config = CONFIGS[os];
  const scope = await getTenantScope();
  const all = await getRepository().listConversations(scope);
  const conversations = conversationsForChannel(all, config.channel);
  const first = conversations[0];
  const Icon = os === "whatsapp" ? MessageCircle : Phone;

  return (
    <>
      <header className="shrink-0 border-b border-border bg-surface-elevated px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-foreground sm:text-xl">
              {config.title}
            </h2>
            <p className="text-xs text-muted sm:text-sm">{config.description}</p>
            <ChannelStatusBanner
              channel={config.channel}
              liveHint={config.liveHint}
              setupHint={config.setupHint}
            />
          </div>
          <StartChannelThread
            channel={config.channel}
            basePath={config.basePath}
          />
        </div>
      </header>
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="min-h-0 w-full shrink-0 overflow-y-auto overscroll-contain bg-surface-elevated md:w-80 md:border-r md:border-border">
          {conversations.length === 0 ? (
            <p className="p-4 text-sm text-muted">
              No {CHANNEL_LABELS[config.channel]} conversations yet. Start a
              thread with a phone number.
            </p>
          ) : (
            <ConversationList
              conversations={conversations}
              basePath={config.basePath}
              channelFilter={config.channel}
            />
          )}
        </div>
        <section className="hidden flex-1 flex-col items-center justify-center bg-surface-elevated text-muted md:flex">
          {first ? (
            <div className="space-y-3 text-center">
              <Icon className="mx-auto h-12 w-12 text-gold/60" />
              <p className="text-sm">Select a conversation or open the latest</p>
              <OpenConversationLink
                conversationId={first.id}
                label={first.contact.name}
                basePath={config.basePath}
              />
            </div>
          ) : (
            <p className="text-sm">
              Start your first {CHANNEL_LABELS[config.channel]} conversation
            </p>
          )}
        </section>
      </div>
    </>
  );
}

export async function ChannelOsDetailPage({
  os,
  id,
}: {
  os: "whatsapp" | "voice";
  id: string;
}) {
  const config = CONFIGS[os];
  const scope = await getTenantScope();
  const repo = getRepository();
  const resolved = await resolveConversationForInbox(id, scope);
  if (!resolved) notFound();
  if (resolved.switchedWorkspace) redirect(`${config.basePath}/${id}`);

  let conversation = resolved.conversation;
  const activeScope = resolved.scope;

  const belongsToChannel =
    conversation.channels.includes(config.channel) ||
    conversationsForChannel([conversation], config.channel).length > 0;
  if (!belongsToChannel) notFound();

  if (conversation.unreadCount > 0) {
    conversation = (await repo.markAsRead(id, activeScope)) ?? conversation;
  }

  const all = await repo.listConversations(activeScope);
  const conversations = conversationsForChannel(all, config.channel);
  const hrCases = await getHrStore().listCasesByConversation(id, activeScope);
  const aiStatus = getAiRuntimeStatus();

  return (
    <>
      <header className="flex shrink-0 items-center gap-3 border-b border-border bg-surface-elevated px-4 py-3 sm:px-6">
        <Link
          href={config.basePath}
          className="rounded-lg p-1.5 text-muted hover:bg-surface-muted lg:hidden"
          aria-label={`Back to ${config.title}`}
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-base font-semibold text-foreground sm:text-lg">
              {conversation.contact.name}
            </h2>
            <IdentityBadge identity={conversation.identity} compact />
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1 lg:hidden">
            {conversation.contact.phone && (
              <span className="truncate text-xs text-muted">
                {conversation.contact.phone}
              </span>
            )}
            <Badge className="bg-surface-muted text-muted ring-border text-[10px]">
              {CHANNEL_LABELS[config.channel]}
            </Badge>
          </div>
          <p className="hidden text-xs text-muted sm:block">
            {config.title} · timeline · notes · tags · identity · AI
          </p>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        <div className="hidden w-80 shrink-0 min-h-0 overflow-y-auto overscroll-contain border-r border-border bg-surface-elevated lg:block">
          <ConversationList
            conversations={conversations}
            activeId={conversation.id}
            basePath={config.basePath}
            channelFilter={config.channel}
          />
        </div>
        <ConversationDetail
          conversation={conversation}
          aiStatus={aiStatus}
          hrCases={hrCases}
          forcedChannel={config.channel}
        />
      </div>
    </>
  );
}
