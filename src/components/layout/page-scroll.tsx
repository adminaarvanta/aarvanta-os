import { cn } from "@/lib/utils";

/** Primary scroll region for app pages inside the fixed viewport shell. */
export function PageScroll({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-h-0 flex-1 overflow-y-auto overscroll-contain bg-black",
        className
      )}
      data-page-scroll
    >
      {children}
    </div>
  );
}

/** Full-height page column: header/nav stay fixed, body scrolls. */
export function PageFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden bg-black",
        className
      )}
    >
      {children}
    </div>
  );
}
