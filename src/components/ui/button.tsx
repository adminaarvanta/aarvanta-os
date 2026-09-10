import Link from "next/link";
import { cn } from "@/lib/utils";
import { FOCUS_RING } from "@/lib/ui/focus";

type ButtonVariant = "primary" | "secondary" | "ghost" | "navy" | "destructive";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  href?: string;
};

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    "bg-gold text-black hover:bg-gold-bright shadow-sm shadow-gold/20 disabled:hover:bg-gold",
  navy: "bg-gradient-to-r from-[#1a2f59] to-[#2f7f92] text-white shadow-[0_6px_16px_rgba(26,47,89,0.24)] hover:brightness-[1.06] active:brightness-95",
  secondary:
    "border border-border bg-surface-muted text-foreground hover:bg-surface-hover hover:border-[#2f7f92]/40",
  ghost: "text-muted hover:bg-surface-hover hover:text-foreground",
  destructive:
    "bg-danger text-white hover:brightness-110 shadow-sm shadow-danger/20",
};

const SIZE: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-sm",
};

export function buttonClassName({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
    FOCUS_RING,
    VARIANT[variant],
    SIZE[size],
    className
  );
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  loading,
  href,
  disabled,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  const classes = buttonClassName({ variant, size, className });
  const content = (
    <>
      {loading ? (
        <span
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden
        />
      ) : null}
      {children}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={classes}
        aria-disabled={disabled || loading}
        aria-busy={loading || undefined}
        onClick={
          props.onClick as React.MouseEventHandler<HTMLAnchorElement> | undefined
        }
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {content}
    </button>
  );
}
