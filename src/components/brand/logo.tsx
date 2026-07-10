import Image from "next/image";
import Link from "next/link";
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

export function BrandLogo({
  className,
  href,
  size = "md",
  variant = "full",
  fullWidth = false,
}: {
  className?: string;
  href?: string;
  size?: BrandLogoSize;
  variant?: BrandLogoVariant;
  fullWidth?: boolean;
}) {
  const displayHeight = DISPLAY_HEIGHT[size];
  const src = variant === "icon" ? "/aarvanta-logo-icon.png" : "/aarvanta-logo.png";
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
