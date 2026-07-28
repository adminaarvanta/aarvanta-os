import type { ReactNode } from "react";

/** Bare layout for public site previews — no marketing/app chrome. */
export default function SitePreviewLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground">{children}</div>
  );
}
