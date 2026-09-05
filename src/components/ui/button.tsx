import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "navy";
  size?: "sm" | "md";
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:opacity-50",
        size === "sm" && "px-3 py-1.5 text-xs",
        size === "md" && "px-4 py-2 text-sm",
        variant === "primary" &&
          "bg-gold text-black hover:bg-gold-bright shadow-sm shadow-gold/20",
        variant === "navy" &&
          "bg-gradient-to-r from-[#1a2f59] to-[#2f7f92] text-white shadow-[0_6px_16px_rgba(26,47,89,0.24)] hover:brightness-[1.06] active:brightness-95",
        variant === "secondary" &&
          "border border-border bg-surface-muted text-foreground hover:bg-surface-hover hover:border-[#2f7f92]/40",
        variant === "ghost" && "text-muted hover:bg-surface-hover hover:text-foreground",
        className
      )}
      {...props}
    />
  );
}
