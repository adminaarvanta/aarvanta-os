import Link from "next/link";
import { COMPANY } from "@/lib/marketing/content";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
      <h1 className="text-3xl font-bold text-foreground sm:text-4xl">About Aarvanta OS</h1>
      <p className="mt-2 text-sm text-gold">{COMPANY.name}</p>

      <div className="mt-10 space-y-6 text-sm leading-relaxed text-muted">
        <p>
          Aarvanta OS is built by {COMPANY.name} with a single mission: create the
          world&apos;s first AI Workforce &amp; Business Operating System — one
          platform where AI employees, human teams, knowledge, processes, projects,
          customers, and operations work together.
        </p>
        <p>
          Most tools solve one piece of the puzzle — a chatbot here, a CRM there, a
          workflow builder somewhere else. Aarvanta OS unifies them into a coherent
          system designed for SMEs who want to operate at the speed of AI without
          losing control.
        </p>
        <p>
          Our stack is built on Next.js, Firebase, and OpenAI — deployed on Vercel
          for global performance with enterprise-grade security foundations including
          RBAC, audit logs, and multi-tenant architecture.
        </p>
      </div>

      <section className="mt-12 rounded-xl border border-border bg-surface-elevated p-6">
        <h2 className="text-sm font-semibold text-foreground">What we believe</h2>
        <ul className="mt-4 space-y-3 text-sm text-muted">
          <li>AI employees should be managed like real team members.</li>
          <li>Company knowledge should be searchable, cited, and actionable.</li>
          <li>Founders should control their business through a single command center.</li>
          <li>Enterprise security should be built in from day one, not bolted on later.</li>
        </ul>
      </section>

      <Link
        href="/inbox"
        className="mt-10 inline-flex rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-black hover:bg-gold-bright"
      >
        Explore the demo
      </Link>
    </div>
  );
}

export const metadata = { title: "About" };
