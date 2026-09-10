"use client";

import Link from "next/link";
import { buttonClassName } from "@/components/ui/button";
import { trackClient } from "@/lib/analytics/track-client";

export function TrackedCta({
  href,
  cta,
  children,
  variant = "primary",
  size = "md",
}: {
  href: string;
  cta: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
}) {
  return (
    <Link
      href={href}
      className={buttonClassName({ variant, size })}
      onClick={() => trackClient("cta_click", { cta, path: "/" })}
    >
      {children}
    </Link>
  );
}
