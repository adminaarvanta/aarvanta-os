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
          "bg-[#D4AF37] text-black hover:bg-[#F9E076] shadow-sm shadow-[#D4AF37]/20",
        variant === "secondary" &&
          "border border-[#3d3528] bg-[#141414] text-[#F5E6C8] hover:bg-[#1a1714] hover:border-[#D4AF37]/40",
        variant === "ghost" && "text-[#A89878] hover:bg-[#1a1714] hover:text-[#F5E6C8]",
        className
      )}
      {...props}
    />
  );
}
