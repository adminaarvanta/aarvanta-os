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
      <h1 className="text-3xl font-bold text-[#FFFFFF] sm:text-4xl">Contact us</h1>
      <p className="mt-3 text-sm text-[#9AABC4]">
        Questions about Aarvanta OS, enterprise plans, or partnerships? We&apos;d
        love to hear from you.
      </p>

      <div className="mt-6 rounded-xl border border-[#243656] bg-[#0D1524] p-4 text-sm text-[#9AABC4]">
        <p>
          Email:{" "}
          <a href={`mailto:${COMPANY.email}`} className="text-[#B8965D] hover:underline">
            {COMPANY.email}
          </a>
        </p>
        <p className="mt-1">Location: {COMPANY.location}</p>
      </div>

      {status === "sent" ? (
        <div className="mt-8 rounded-xl border border-[#4DA6FF]/30 bg-[#0A2A33] p-5 text-sm text-[#4DA6FF]">
          Thank you — we&apos;ve received your message and will respond shortly.
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#FFFFFF]">Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#243656] bg-[#121E32] px-3 py-2 text-sm text-[#FFFFFF]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#FFFFFF]">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#243656] bg-[#121E32] px-3 py-2 text-sm text-[#FFFFFF]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#FFFFFF]">Message</label>
            <textarea
              required
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#243656] bg-[#121E32] px-3 py-2 text-sm text-[#FFFFFF]"
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
