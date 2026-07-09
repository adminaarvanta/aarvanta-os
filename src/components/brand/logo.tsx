import Image from "next/image";
import Link from "next/link";
import { brand } from "@/lib/theme";
import { cn } from "@/lib/utils";

/** Logo aspect ratio from official mark (globe + wordmark). */
const LOGO_ASPECT = 1.65;

export function BrandLogo({
  className,
  href,
  size = "md",
  fullWidth = false,
}: {
  className?: string;
  href?: string;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}) {
  const heights = { sm: 52, md: 88, lg: 140 };
  const height = heights[size];
  const width = fullWidth ? 320 : Math.round(height * LOGO_ASPECT);

  const image = (
    <Image
      src="/aarvanta-logo.png"
      alt={brand.fullName}
      width={width}
      height={height}
      className={cn(
        "object-contain bg-transparent",
        fullWidth ? "mx-auto h-auto w-full max-w-[280px]" : "h-auto w-auto",
        className
      )}
      style={fullWidth ? undefined : { maxHeight: height }}
      priority
    />
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(fullWidth ? "block w-full" : "inline-block shrink-0")}
        aria-label={brand.fullName}
      >
        {image}
      </Link>
    );
  }

  return image;
}
