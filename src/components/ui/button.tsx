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
          "bg-[#C29B40] text-white hover:bg-[#9A7A32] shadow-sm",
        variant === "secondary" &&
          "border border-[#EDE6D6] bg-white text-[#2A2418] hover:bg-[#FCF9F2]",
        variant === "ghost" && "text-[#6B6356] hover:bg-[#FCF9F2]",
        className
      )}
      {...props}
    />
  );
}
