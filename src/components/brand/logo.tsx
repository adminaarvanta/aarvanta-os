"use client";

import Image from "next/image";
import Link from "next/link";
import { useThemeMode } from "@/components/theme/theme-provider";
import { brand } from "@/lib/theme";
import { cn } from "@/lib/utils";

/** Full product mark is near-square; keep aspect 1 so CSS never crops. */
const FULL_LOGO_ASPECT = 1;

/**
 * Bump when mark assets change so browsers/CDN drop stale cropped PNGs.
 * Marks include transparent padding so the full circle fits in object-contain.
 */
const LOGO_ASSET_VERSION = "4";

const DISPLAY_HEIGHT = {
  header: 56,
  sm: 40,
  md: 72,
  lg: 96,
  xl: 140,
  /** Expanded sidebar wordmark */
  sidebar: 112,
  /** Collapsed rail / mobile header icon — matches h-11/w-11 chrome slots */
  rail: 44,
} as const;

export type BrandLogoSize = keyof typeof DISPLAY_HEIGHT;
export type BrandLogoVariant = "full" | "icon";

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

function logoSrc(path: string) {
  return `${path}?v=${LOGO_ASSET_VERSION}`;
}

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
  const { resolved: contextResolved } = useThemeMode();
  const themeMode = mode ?? contextResolved;
  const displayHeight = DISPLAY_HEIGHT[size];
  const src = logoSrc(LOGO_PATHS[themeMode][variant]);
  const isIcon = variant === "icon";

  /** Fixed square slot for icon — image always contained, never cropped. */
  if (isIcon && !fullWidth) {
    const image = (
      <Image
        src={src}
        alt={brand.fullName}
        width={512}
        height={512}
        quality={100}
        unoptimized
        priority
        className={cn("!bg-transparent object-contain", className)}
        style={{
          // Slight inset so outer nodes/arcs never meet a clipping edge.
          width: "100%",
          height: "100%",
          maxWidth: "100%",
          maxHeight: "100%",
          objectFit: "contain",
          objectPosition: "center",
          backgroundColor: "transparent",
        }}
      />
    );

    const box = (
      <span
        className="relative inline-flex shrink-0 items-center justify-center overflow-visible bg-transparent p-0.5"
        style={{
          width: displayHeight,
          height: displayHeight,
          backgroundColor: "transparent",
        }}
      >
        {image}
      </span>
    );

    if (href) {
      return (
        <Link
          href={href}
          className="inline-flex shrink-0 items-center justify-center bg-transparent"
          aria-label={brand.fullName}
        >
          {box}
        </Link>
      );
    }
    return box;
  }

  const intrinsicHeight = displayHeight * 2;
  const intrinsicWidth = Math.round(intrinsicHeight * FULL_LOGO_ASPECT);

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
