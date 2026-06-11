import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
  const heights = { sm: 48, md: 72, lg: 120 };
  const height = heights[size];

  const image = (
    <Image
      src="/aarvanta-logo.png"
      alt="Aarvanta OS"
      width={fullWidth ? 400 : Math.round(height * 1.6)}
      height={fullWidth ? 250 : height}
      className={cn(
        "object-contain",
        fullWidth ? "h-auto w-full" : "h-auto w-auto",
        className
      )}
      priority
    />
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(fullWidth ? "block w-full" : "inline-block shrink-0")}
      >
        {image}
      </Link>
    );
  }

  return image;
}
