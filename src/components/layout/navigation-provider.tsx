"use client";

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useTransition,
  type ComponentProps,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type NavigationContextValue = {
  isNavigating: boolean;
  startNavigation: () => void;
};

const NavigationContext = createContext<NavigationContextValue>({
  isNavigating: false,
  startNavigation: () => {},
});

export function useNavigation() {
  return useContext(NavigationContext);
}

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  const startNavigation = useCallback(() => {
    setIsNavigating(true);
  }, []);

  return (
    <NavigationContext.Provider value={{ isNavigating, startNavigation }}>
      <NavigationProgress />
      {children}
    </NavigationContext.Provider>
  );
}

export function NavigationProgress() {
  const { isNavigating } = useNavigation();

  if (!isNavigating) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden bg-border"
      role="progressbar"
      aria-label="Loading page"
    >
      <div className="h-full w-1/3 animate-[nav-progress_0.9s_ease-in-out_infinite] bg-primary" />
    </div>
  );
}

type PendingLinkProps = ComponentProps<typeof Link> & {
  pendingClassName?: string;
};

export function PendingLink({
  href,
  onClick,
  className,
  pendingClassName,
  target,
  ...props
}: PendingLinkProps) {
  const router = useRouter();
  const { startNavigation } = useNavigation();
  const [isPending, startTransition] = useTransition();

  function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      target === "_blank"
    ) {
      return;
    }

    const url = typeof href === "string" ? href : href.pathname ?? "";
    if (!url || url === "#") return;

    // Visitor chat lives outside the app shell — always use a full navigation.
    if (url === "/chat" || url.startsWith("/chat?")) return;

    event.preventDefault();
    startNavigation();
    startTransition(() => {
      router.push(url);
    });
  }

  return (
    <Link
      href={href}
      target={target}
      onClick={handleClick}
      className={cn(className, isPending && pendingClassName)}
      aria-busy={isPending || undefined}
      {...props}
    />
  );
}
