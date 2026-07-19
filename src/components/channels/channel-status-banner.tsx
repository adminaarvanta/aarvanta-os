import { getChannelStatus } from "@/lib/channels/config";
import type { Channel } from "@/types/communication";

const STATUS_COPY: Record<
  ReturnType<typeof getChannelStatus>,
  { label: string; className: string }
> = {
  live: {
    label: "Live",
    className: "border-success/30 bg-success/10 text-success",
  },
  simulate: {
    label: "Demo / simulate",
    className: "border-gold/30 bg-gold/10 text-gold-bright",
  },
  not_configured: {
    label: "Not configured",
    className: "border-border bg-surface-muted text-muted",
  },
};

export function ChannelStatusBanner({
  channel,
  liveHint,
  setupHint,
}: {
  channel: Channel;
  liveHint: string;
  setupHint: string;
}) {
  const status = getChannelStatus(channel);
  const meta = STATUS_COPY[status];

  return (
    <p
      className={`mt-2 rounded-lg border px-3 py-2 text-xs ${meta.className}`}
      role="status"
    >
      <span className="font-semibold">{meta.label}</span>
      {" · "}
      {status === "not_configured" ? setupHint : liveHint}
    </p>
  );
}
