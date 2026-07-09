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
          "bg-[#B8965D] text-black hover:bg-[#C9AA72] shadow-sm shadow-[#B8965D]/20",
        variant === "secondary" &&
          "border border-[#243656] bg-[#121E32] text-[#FFFFFF] hover:bg-[#162840] hover:border-[#B8965D]/40",
        variant === "ghost" && "text-[#9AABC4] hover:bg-[#162840] hover:text-[#FFFFFF]",
        className
      )}
      {...props}
    />
  );
}
