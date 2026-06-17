"use client";

import { useState } from "react";
import { COMPANY } from "@/lib/marketing/content";
import { Button } from "@/components/ui/button";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      if (!res.ok) throw new Error("Failed");
      setStatus("sent");
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-6 sm:py-20">
      <h1 className="text-3xl font-bold text-[#F5E6C8] sm:text-4xl">Contact us</h1>
      <p className="mt-3 text-sm text-[#A89878]">
        Questions about Aarvanta OS, enterprise plans, or partnerships? We&apos;d
        love to hear from you.
      </p>

      <div className="mt-6 rounded-xl border border-[#3d3528] bg-[#101010] p-4 text-sm text-[#A89878]">
        <p>
          Email:{" "}
          <a href={`mailto:${COMPANY.email}`} className="text-[#D4AF37] hover:underline">
            {COMPANY.email}
          </a>
        </p>
        <p className="mt-1">Location: {COMPANY.location}</p>
      </div>

      {status === "sent" ? (
        <div className="mt-8 rounded-xl border border-emerald-800/50 bg-emerald-950/30 p-5 text-sm text-emerald-300">
          Thank you — we&apos;ve received your message and will respond shortly.
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#F5E6C8]">Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#3d3528] bg-[#141414] px-3 py-2 text-sm text-[#F5E6C8]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#F5E6C8]">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#3d3528] bg-[#141414] px-3 py-2 text-sm text-[#F5E6C8]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#F5E6C8]">Message</label>
            <textarea
              required
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#3d3528] bg-[#141414] px-3 py-2 text-sm text-[#F5E6C8]"
            />
          </div>
          {status === "error" && (
            <p className="text-sm text-red-300">Something went wrong. Please email us directly.</p>
          )}
          <Button type="submit" disabled={status === "loading"}>
            {status === "loading" ? "Sending…" : "Send message"}
          </Button>
        </form>
      )}
    </div>
  );
}
