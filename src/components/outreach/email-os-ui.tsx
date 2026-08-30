import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  VoiceEmptyState,
  VoiceKpiCard,
  VoicePageShell,
  VoicePanel,
  VoicePrimaryButton,
  VoiceStatChip,
  VoiceStatusBadge,
  type VoiceTone,
} from "@/components/voice/voice-ui";

export function EmailPageShell({
  title,
  subtitle,
  actions,
  children,
  tone = "cyan",
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  tone?: VoiceTone;
}) {
  return (
    <VoicePageShell
      title={title}
      subtitle={subtitle}
      actions={actions}
      tone={tone}
      product="Email OS"
    >
      {children}
    </VoicePageShell>
  );
}

export function EmailPrimaryButton({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <VoicePrimaryButton href={href} className={className}>
      {children}
    </VoicePrimaryButton>
  );
}

export {
  VoiceEmptyState as EmailEmptyState,
  VoiceKpiCard as EmailKpiCard,
  VoicePanel as EmailPanel,
  VoiceStatChip as EmailStatChip,
  VoiceStatusBadge as EmailStatusBadge,
};

export function EmailBackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-xl border border-border bg-surface px-3 py-2 text-sm text-muted hover:text-foreground"
      )}
    >
      {children}
    </Link>
  );
}
