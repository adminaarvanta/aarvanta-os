"use client";

import Image from "next/image";
import Link from "next/link";
import { useThemeMode } from "@/components/theme/theme-provider";
import { brand } from "@/lib/theme";
import { cn } from "@/lib/utils";

/** Full wordmark aspect (globe + AARVANTA + BUSINESS OS). */
const FULL_LOGO_ASPECT = 1;

const DISPLAY_HEIGHT = {
  header: 56,
  sm: 40,
  md: 72,
  lg: 96,
  xl: 140,
  /** Sidebar brand mark — fills most of the rail header */
  sidebar: 112,
  /** Collapsed rail / mobile header — must fit inside ~40–48px */
  rail: 36,
} as const;

export type BrandLogoSize = keyof typeof DISPLAY_HEIGHT;
export type BrandLogoVariant = "full" | "icon";

/**
 * Canonical product logos (true alpha).
 * - light* → for light UI surfaces
 * - dark* → for dark UI surfaces
 * Icon uses square mark crops so collapsed/mobile slots never clip the globe.
 */
const LOGO_PATHS = {
  dark: {
    full: "/aarvanta-logo-dark-clear.png",
    icon: "/aarvanta-logo-mark-dark-clear.png",
  },
  light: {
    full: "/aarvanta-logo-light-clear.png",
    icon: "/aarvanta-logo-mark-light-clear.png",
  },
} as const;

export function BrandLogo({
  className,
  href,
  size = "md",
  variant = "full",
  fullWidth = false,
  mode,
}: {
  className?: string;
  href?: string;
  size?: BrandLogoSize;
  variant?: BrandLogoVariant;
  fullWidth?: boolean;
  /** Force logo variant for a known surface; defaults to active theme. */
  mode?: "dark" | "light";
}) {
  const { resolved: contextResolved } = useThemeMode();
  const themeMode = mode ?? contextResolved;
  const displayHeight = DISPLAY_HEIGHT[size];
  const src = LOGO_PATHS[themeMode][variant];
  const isIcon = variant === "icon";
  const box = displayHeight;
  const intrinsic = isIcon
    ? { width: box * 2, height: box * 2 }
    : {
        width: Math.round(displayHeight * 2 * FULL_LOGO_ASPECT),
        height: displayHeight * 2,
      };

  const image = (
    <Image
      src={src}
      alt={brand.fullName}
      width={intrinsic.width}
      height={intrinsic.height}
      quality={100}
      unoptimized
      priority
      className={cn(
        "!bg-transparent object-contain",
        fullWidth ? "mx-auto h-auto w-full max-w-[280px]" : null,
        !fullWidth && isIcon && "h-full w-full",
        !fullWidth && !isIcon && "h-auto w-auto",
        className
      )}
      style={
        fullWidth
          ? { backgroundColor: "transparent" }
          : size === "sidebar"
            ? {
                height: displayHeight,
                width: "auto",
                maxWidth: 236,
                backgroundColor: "transparent",
              }
            : isIcon
              ? {
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  backgroundColor: "transparent",
                }
              : {
                  height: displayHeight,
                  width: "auto",
                  maxWidth: displayHeight * FULL_LOGO_ASPECT,
                  backgroundColor: "transparent",
                }
      }
    />
  );

  const wrapped = (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center bg-transparent",
        fullWidth && "block w-full"
      )}
      style={
        !fullWidth && isIcon
          ? {
              width: box,
              height: box,
              padding: Math.max(2, Math.round(box * 0.08)),
              boxSizing: "border-box",
              backgroundColor: "transparent",
            }
          : { backgroundColor: "transparent" }
      }
    >
      {image}
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          "bg-transparent",
          fullWidth ? "block w-full" : "inline-flex shrink-0 items-center"
        )}
        aria-label={brand.fullName}
      >
        {wrapped}
      </Link>
    );
  }

  return wrapped;
}
