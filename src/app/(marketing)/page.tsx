import Link from "next/link";
import {
  Brain,
  Inbox,
  Kanban,
  Sparkles,
  Users,
  Workflow,
} from "lucide-react";
import { COMPANY } from "@/lib/marketing/content";

const features = [
  {
    icon: Sparkles,
    title: "AI Workforce",
    description:
      "AI CEO, COO, Sales, Marketing, and HR managers with memory, chat, and task assignment.",
  },
  {
    icon: Brain,
    title: "Knowledge Hub",
    description:
      "Upload SOPs and docs. Semantic search and RAG-powered Company Brain answers.",
  },
  {
    icon: Users,
    title: "CRM + Leads",
    description:
      "Contacts, pipelines, AI lead scoring, summaries, and suggested actions.",
  },
  {
    icon: Kanban,
    title: "Project OS",
    description:
      "Kanban boards, tasks, and AI-assisted project delivery for your team.",
  },
  {
    icon: Inbox,
    title: "Unified Inbox",
    description:
      "WhatsApp, email, SMS, voice, and website chat in one timeline with AI insights.",
  },
  {
    icon: Workflow,
    title: "Workflow Automation",
    description:
      "Trigger → condition → agent → approval → action. Business process automation.",
  },
];

export default function LandingPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#B3965D_0%,_transparent_50%)] opacity-[0.08]" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:py-32">
          <p className="text-sm font-medium uppercase tracking-wider text-gold">
            {COMPANY.name}
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight text-foreground sm:text-5xl lg:text-6xl">
            {COMPANY.tagline}
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted">
            {COMPANY.subtagline}. CRM. Projects. Communications. Knowledge.
            Automation. AI Employees — more revenue, less staff cost, faster growth.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link href="/dashboard?help=tour" className="inline-flex items-center justify-center rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-black hover:bg-gold-bright">
              Start product tour
            </Link>
            <Link
              href="/dashboard?help=live"
              className="inline-flex items-center justify-center rounded-lg border border-gold/40 px-6 py-3 text-sm font-semibold text-foreground hover:border-gold"
            >
              Run 90-second demo
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-lg border border-border px-6 py-3 text-sm font-semibold text-foreground hover:border-gold/40"
            >
              Open dashboard
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-lg border border-border px-6 py-3 text-sm font-semibold text-foreground hover:border-gold/40"
            >
              View pricing
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted">
            No signup required in demo mode · Pre-loaded AI workforce, CRM, and
            knowledge base
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <h2 className="text-center text-2xl font-semibold text-foreground sm:text-3xl">
          Everything your business runs on
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-muted">
          Not another chatbot or CRM. A complete operating system for AI-native
          companies.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                className="rounded-xl border border-border bg-surface-elevated p-6"
              >
                <div className="rounded-lg bg-gold/15 p-2.5 ring-1 ring-gold/30 w-fit">
                  <Icon className="h-5 w-5 text-gold" />
                </div>
                <h3 className="mt-4 font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted">{feature.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-y border-border bg-background">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
                Try the full demo in one click
              </h2>
              <p className="mt-4 text-sm text-muted leading-relaxed">
                Explore sample AI employees, a live CRM with scored leads, a
                knowledge base with RAG search, project boards, and a unified
                inbox — all pre-loaded for Aarvanta Limited.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-muted">
                <li className="flex gap-2">
                  <span className="text-gold">✓</span> 5 AI executives ready to run
                </li>
                <li className="flex gap-2">
                  <span className="text-gold">✓</span> Meridian Consulting deal in pipeline
                </li>
                <li className="flex gap-2">
                  <span className="text-gold">✓</span> Company SOPs in Knowledge Hub
                </li>
              </ul>
            </div>
            <div className="rounded-2xl border border-border bg-surface-elevated p-8 text-center">
              <p className="text-4xl font-bold text-gold">14 days</p>
              <p className="mt-1 text-sm text-muted">Free trial on all paid plans</p>
              <Link
                href="/dashboard"
                className="mt-8 inline-flex w-full items-center justify-center rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-black hover:bg-gold-bright"
              >
                Open demo workspace
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
        <h2 className="text-2xl font-semibold text-foreground">
          Ready to run your business on AI?
        </h2>
        <p className="mt-3 text-sm text-muted">
          Start with the demo, then deploy to your team on Vercel + Firebase.
        </p>
        <Link
          href="/contact"
          className="mt-8 inline-flex rounded-lg border border-gold/40 px-6 py-3 text-sm font-semibold text-gold-bright hover:bg-gold/10"
        >
          Contact Aarvanta Limited
        </Link>
      </section>
    </>
  );
}

export const metadata = {
  title: "Aarvanta OS — Hire Your First AI Workforce",
  description:
    "Run sales, marketing, operations and customer support from one dashboard. CRM, projects, AI employees, and automation for SMEs.",
};
