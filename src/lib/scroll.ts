/** Scroll within a container only — avoids scrollIntoView bubbling to the page. */
export function scrollContainerToBottom(
  container: HTMLElement | null,
  behavior: ScrollBehavior = "smooth"
) {
  if (!container) return;
  container.scrollTo({ top: container.scrollHeight, behavior });
}

export function scrollContainerToTop(
  container: HTMLElement | null,
  behavior: ScrollBehavior = "auto"
) {
  if (!container) return;
  container.scrollTo({ top: 0, behavior });
}

/** Reset all main app page scroll regions (used on route change). */
export function resetAppPageScroll() {
  if (typeof document === "undefined") return;

  const seen = new Set<HTMLElement>();
  const selectors = [
    "[data-page-scroll]",
    "main .min-h-0.flex-1.overflow-y-auto.overscroll-contain",
  ];

  for (const selector of selectors) {
    document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
      if (seen.has(el)) return;
      // Skip nested chat/timeline panes — only reset page-level scrollers
      if (el.hasAttribute("data-chat-scroll") || el.hasAttribute("data-conversation-scroll")) {
        return;
      }
      seen.add(el);
      scrollContainerToTop(el);
    });
  }
}
