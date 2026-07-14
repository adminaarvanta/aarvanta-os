"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  HelpCircle,
  Loader2,
  MessageCircle,
  Send,
  X,
} from "lucide-react";
import { SUPPORT_FAQS } from "@/lib/support/knowledge";
import { cn } from "@/lib/utils";

type ChatLink = { title: string; href: string };

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  links?: ChatLink[];
};

const STARTER: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi — I’m your Aarvanta guide. Ask me how to do something, or where a feature lives. I can open the right page for you.",
  links: [
    { title: "Inbox", href: "/inbox" },
    { title: "CRM", href: "/crm" },
    { title: "AI Workforce", href: "/workforce" },
    { title: "Knowledge Hub", href: "/knowledge" },
  ],
};

export function SupportAssistant() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([STARTER]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading, open]);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setInput("");
    setLoading(true);
    setMessages((prev) => [
      ...prev,
      { id: `u_${Date.now()}`, role: "user", content: trimmed },
    ]);

    try {
      const res = await fetch("/api/support/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = (await res.json()) as {
        answer?: string;
        links?: ChatLink[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setMessages((prev) => [
        ...prev,
        {
          id: `a_${Date.now()}`,
          role: "assistant",
          content: data.answer || "Here’s what I found.",
          links: data.links,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `e_${Date.now()}`,
          role: "assistant",
          content:
            err instanceof Error
              ? err.message
              : "I couldn’t answer just now. Try Knowledge Hub or the Help menu.",
          links: [{ title: "Knowledge Hub", href: "/knowledge" }],
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-gold text-black shadow-lg transition hover:bg-gold-bright md:bottom-6 md:right-6",
          open && "pointer-events-none opacity-0"
        )}
        aria-label="Open support"
      >
        <MessageCircle className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] right-3 z-50 flex h-[min(34rem,calc(100dvh-7rem))] w-[min(calc(100vw-1.5rem),22rem)] flex-col overflow-hidden rounded-2xl border border-border bg-surface-elevated shadow-2xl md:bottom-6 md:right-6">
          <header className="flex items-center gap-2 border-b border-border-subtle bg-surface px-3 py-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/15 text-gold">
              <HelpCircle className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                Support guide
              </p>
              <p className="truncate text-[11px] text-muted">
                Ask anything · jump to the right page
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-2 text-muted hover:bg-surface-hover hover:text-foreground"
              aria-label="Close support"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "max-w-[95%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "ml-auto bg-gold/15 text-foreground"
                    : "bg-surface-muted text-foreground"
                )}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.links && msg.links.length > 0 && (
                  <div className="mt-2 flex flex-col gap-1.5">
                    {msg.links.map((link) => (
                      <button
                        key={`${msg.id}-${link.href}`}
                        type="button"
                        onClick={() => go(link.href)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-left text-xs font-medium text-gold transition hover:border-gold/40 hover:bg-surface-hover"
                      >
                        <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">Go to {link.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="inline-flex items-center gap-2 rounded-2xl bg-surface-muted px-3 py-2 text-xs text-muted">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Thinking…
              </div>
            )}
          </div>

          <div className="border-t border-border-subtle px-3 pt-2">
            <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-dim">
              Quick questions
            </p>
            <div className="flex gap-1.5 overflow-x-auto pb-2">
              {SUPPORT_FAQS.slice(0, 4).map((faq) => (
                <button
                  key={faq.question}
                  type="button"
                  onClick={() => void send(faq.question)}
                  className="shrink-0 rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] text-muted hover:border-gold/40 hover:text-foreground"
                >
                  {faq.question.replace(/\?$/, "")}
                </button>
              ))}
            </div>
          </div>

          <form
            className="flex gap-2 border-t border-border-subtle p-3"
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="How do I…?"
              className="min-w-0 flex-1 rounded-xl border border-border bg-surface-muted px-3 py-2 text-sm text-foreground outline-none placeholder:text-dim focus:border-gold/50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gold text-black disabled:opacity-50"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
