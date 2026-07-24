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
} as const;

export type BrandLogoSize = keyof typeof DISPLAY_HEIGHT;
export type BrandLogoVariant = "full" | "icon";

/** *-clear assets have true alpha (no baked black plate). */
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
  mode?: "dark" | "light";
}) {
  const { mode: contextMode } = useThemeMode();
  const themeMode = mode ?? contextMode;
  const displayHeight = DISPLAY_HEIGHT[size];
  const src = LOGO_PATHS[themeMode][variant];
  /** Icon asset is landscape (~4:3); keep layout box square and contain. */
  const iconBox = displayHeight;
  const intrinsicHeight = displayHeight * 2;
  const intrinsicWidth =
    variant === "icon"
      ? Math.round(intrinsicHeight * (412 / 311))
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
        // Never paint a plate behind the mark — sidebar surface must show through
        "!bg-transparent object-contain",
        // On dark UI, treat pure black pixels as transparent against the surface
        themeMode === "dark" && "mix-blend-lighten",
        fullWidth ? "mx-auto h-auto w-full max-w-[280px]" : null,
        !fullWidth && variant === "icon" && "h-auto w-auto",
        !fullWidth && variant === "full" && "h-auto w-auto",
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
                  width: iconBox,
                  maxHeight: iconBox,
                  maxWidth: iconBox,
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
      style={{ backgroundColor: "transparent" }}
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
        style={{ backgroundColor: "transparent" }}
        aria-label={brand.fullName}
      >
        {wrapped}
      </Link>
    );
  }

  return wrapped;
}
