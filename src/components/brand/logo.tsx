"use client";

import Image from "next/image";
import Link from "next/link";
import { useThemeMode } from "@/components/theme/theme-provider";
import { brand } from "@/lib/theme";
import { cn } from "@/lib/utils";

/** Full wordmark aspect (globe + AARVANTA + BUSINESS OS). */
const FULL_LOGO_ASPECT = 1.05;

const DISPLAY_HEIGHT = {
  header: 72,
  sm: 64,
  md: 96,
  lg: 128,
  xl: 168,
  sidebar: 64,
} as const;

export type BrandLogoSize = keyof typeof DISPLAY_HEIGHT;
export type BrandLogoVariant = "full" | "icon";

const LOGO_PATHS = {
  dark: { full: "/aarvanta-logo.svg", icon: "/aarvanta-logo-icon.svg" },
  light: { full: "/aarvanta-logo-light.svg", icon: "/aarvanta-logo-icon-light.svg" },
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
  const intrinsicHeight = displayHeight * 2;
  const intrinsicWidth =
    variant === "icon"
      ? intrinsicHeight
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
        "bg-transparent object-contain",
        fullWidth ? "mx-auto h-auto w-full max-w-[320px]" : "h-auto w-auto",
        className
      )}
      style={
        fullWidth
          ? undefined
          : {
              height: displayHeight,
              width: variant === "icon" ? displayHeight : "auto",
              maxWidth: variant === "full" ? displayHeight * FULL_LOGO_ASPECT : displayHeight,
            }
      }
    />
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(fullWidth ? "block w-full" : "inline-flex shrink-0 items-center")}
        aria-label={brand.fullName}
      >
        {image}
      </Link>
    );
  }

  return image;
}
