"use client";

import Image from "next/image";
import Link from "next/link";
import { useThemeMode } from "@/components/theme/theme-provider";
import { brand } from "@/lib/theme";
import { cn } from "@/lib/utils";

/** Full wordmark aspect (globe + AARVANTA + BUSINESS OS). */
const FULL_LOGO_ASPECT = 1;
/** Icon mark aspect from aarvanta-logo-icon-*-clear.png */
const ICON_LOGO_ASPECT = 412 / 311;

const DISPLAY_HEIGHT = {
  header: 56,
  sm: 40,
  md: 72,
  lg: 96,
  xl: 140,
  /** Sidebar brand mark — fills most of the rail header */
  sidebar: 112,
} as const;

export type BrandLogoSize = keyof typeof DISPLAY_HEIGHT;
export type BrandLogoVariant = "full" | "icon";

/**
 * Canonical product logos (true alpha).
 * - light* → for light UI surfaces
 * - dark* → for dark UI surfaces
 */
const LOGO_PATHS = {
  dark: {
    full: "/aarvanta-logo-dark-clear.png",
    icon: "/aarvanta-logo-icon-dark-clear.png",
  },
  light: {
    full: "/aarvanta-logo-light-clear.png",
    icon: "/aarvanta-logo-icon-light-clear.png",
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
  const iconBox = displayHeight;
  const intrinsicHeight = displayHeight * 2;
  const intrinsicWidth =
    variant === "icon"
      ? Math.round(intrinsicHeight * ICON_LOGO_ASPECT)
      : Math.round(intrinsicHeight * FULL_LOGO_ASPECT);

  const image = (
    <Image
      src={src}
      alt={brand.fullName}
      width={intrinsicWidth}
      height={intrinsicHeight}
      quality={100}
      unoptimized
      priority
      className={cn(
        "!bg-transparent object-contain",
        fullWidth ? "mx-auto h-auto w-full max-w-[280px]" : "h-auto w-auto",
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
            : variant === "icon"
              ? {
                  height: iconBox,
                  width: "auto",
                  maxHeight: iconBox,
                  maxWidth: Math.round(iconBox * ICON_LOGO_ASPECT),
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
