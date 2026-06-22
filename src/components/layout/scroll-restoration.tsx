"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { resetAppPageScroll } from "@/lib/scroll";

/** Keep the main page scroller at the top on load and navigation. */
export function ScrollRestoration() {
  const pathname = usePathname();

  useEffect(() => {
    requestAnimationFrame(() => {
      resetAppPageScroll();
    });
  }, [pathname]);

  return null;
}
