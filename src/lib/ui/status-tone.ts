/** Shared dark-theme status tones using logo navy / gold / cyan. */
export const statusTone = {
  neutral:
    "bg-surface-muted text-muted ring-border",
  gold:
    "bg-gold/15 text-gold-bright ring-gold/35",
  success:
    "bg-accent-cyan/15 text-accent-cyan ring-accent-cyan/30",
  warning:
    "bg-gold/10 text-gold-bright ring-gold/35",
  danger:
    "bg-danger/15 text-danger ring-danger/45",
  info:
    "bg-accent-cyan/10 text-accent-cyan ring-accent-cyan/30",
  navy:
    "bg-navy/60 text-foreground ring-border",
} as const;

export type StatusTone = keyof typeof statusTone;
