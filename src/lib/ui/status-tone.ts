/** Shared dark-theme status tones using logo navy / gold / cyan. */
export const statusTone = {
  neutral:
    "bg-[#121E32] text-[#9AABC4] ring-[#243656]",
  gold:
    "bg-[#B8965D]/15 text-[#C9AA72] ring-[#B8965D]/35",
  success:
    "bg-[#0A2A33] text-[#4DA6FF] ring-[#4DA6FF]/30",
  warning:
    "bg-[#2A2210] text-[#C9AA72] ring-[#B8965D]/35",
  danger:
    "bg-[#2A1218] text-[#F0A0A8] ring-[#8B3A45]/45",
  info:
    "bg-[#0D1A2E] text-[#4DA6FF] ring-[#4DA6FF]/30",
  navy:
    "bg-[#1A2B48]/60 text-[#FFFFFF] ring-[#243656]",
} as const;

export type StatusTone = keyof typeof statusTone;
