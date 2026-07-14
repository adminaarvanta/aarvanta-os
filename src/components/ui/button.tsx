import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
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
        variant === "secondary" &&
          "border border-border bg-surface-muted text-foreground hover:bg-surface-hover hover:border-gold/40",
        variant === "ghost" && "text-muted hover:bg-surface-hover hover:text-foreground",
        className
      )}
      {...props}
    />
  );
}
