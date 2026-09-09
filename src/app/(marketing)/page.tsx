import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2, Shield, Users } from "lucide-react";
import { TrackedCta } from "@/components/marketing/tracked-cta";
import { COMPANY } from "@/lib/marketing/content";
import { PRICING_TIERS } from "@/lib/marketing/content";
import { publicCapabilities } from "@/lib/product/maturity";
import { TRIAL_POLICY } from "@/lib/product/trial";
import { MaturityBadge } from "@/components/ui/maturity-badge";
import { Button } from "@/components/ui/button";
import { canonicalUrl } from "@/lib/product/site";
import { isProductionMode } from "@/lib/config/app-mode";

const flow = [
  "Enquiry",
  "Customer",
  "AI / Team",
  "Work",
  "Invoice",
  "Analytics",
];

const faqs = [
  {
    q: "How long does setup take?",
    a: "Create an account, complete four workspace questions, and land on Today with a checklist. Optional CSV import can be skipped.",
  },
  {
    q: "Can I migrate later?",
    a: "Yes. Start with one workflow. Import contacts when you are ready. There is no full-migration requirement.",
  },
  {
    q: "What data does AI use?",
    a: "AI reads workspace records you already store — CRM, inbox, knowledge documents. High-impact actions need approval. You can pause AI for the workspace.",
  },
  {
    q: "Which integrations are live?",
    a: "Inbox channels, CRM CSV import, and Google Calendar where configured. We do not advertise connectors that are not actually wired.",
  },
  {
    q: "How do I cancel or export?",
    a: "Paid plans are managed in Billing. Account export lives in Settings. Support: hello@aarvanta.com.",
  },
];

export default function LandingPage() {
  const production = isProductionMode();
  const demoHref = production ? "/login" : "/dashboard";
  const capabilities = publicCapabilities().filter((module) => module.id !== "home");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Aarvanta Business OS",
            applicationCategory: "BusinessApplication",
            offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" },
            url: canonicalUrl("/"),
          }),
        }}
      />
      <section className="relative overflow-hidden border-b border-border">
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:py-32">
          <p className="text-sm font-medium uppercase tracking-wider text-gold">
            Your business, one operating system
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight text-foreground sm:text-5xl lg:text-6xl">
            {COMPANY.tagline}
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted">{COMPANY.subtagline}</p>
          <p className="mt-3 max-w-2xl text-sm text-muted">
            AI Workforce is the execution layer — not the entire product. High-impact
            actions stay on approval.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <TrackedCta href="/register" size="lg" cta="start_free">
              Start Free
            </TrackedCta>
            <TrackedCta href={demoHref} variant="secondary" size="lg" cta="view_demo">
              View Interactive Demo
            </TrackedCta>
          </div>
          <p className="mt-4 text-xs text-muted">{TRIAL_POLICY.copy}</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-semibold text-foreground">The problem</h2>
        <p className="mt-3 max-w-2xl text-sm text-muted">
          Disconnected tools create duplicated customer records, missed follow-ups,
          and unclear ownership. Aarvanta keeps one customer record and one
          command surface.
        </p>
      </section>

      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-semibold text-foreground">Connected flow</h2>
          <ol className="mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {flow.map((step, index) => (
              <li
                key={step}
                className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium"
              >
                <span className="text-xs text-gold">{index + 1}</span>
                <p className="mt-1">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-semibold text-foreground">Product proof</h2>
        <p className="mt-2 text-sm text-muted">
          These frames match live product surfaces in the demo workspace — not
          concept art.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {[
            ["Today", "Pulse, needs attention, approvals, next actions"],
            ["Customer 360", "One identity, merged timeline, deals and inbox"],
            ["AI approval", "Proposed action, consequence, approve or reject"],
            ["Inbox", "Relationship timeline with channel badges"],
          ].map(([title, body]) => (
            <article
              key={title}
              className="rounded-2xl border border-border bg-surface-elevated p-5"
            >
              <div className="h-28 rounded-xl bg-surface-muted ring-1 ring-border" />
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-background">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-semibold">Core capabilities</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((module) => (
              <article
                key={module.id}
                className="rounded-xl border border-border bg-surface-elevated p-5"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold">{module.label}</h3>
                  <MaturityBadge status={module.status} />
                </div>
                <p className="mt-2 text-sm text-muted">{module.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-semibold">Why it is different</h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {[
            ["One data graph", "Modules reference the same customer IDs."],
            ["Company memory", "Knowledge answers cite documents you uploaded."],
            ["Approval-controlled AI", "Observe, recommend, draft, approve, or automatic — never silent money or outbound."],
            ["One customer timeline", "Inbox, notes, deals, and events in Customer 360."],
          ].map(([title, body]) => (
            <li key={title} className="flex gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
              <div>
                <p className="font-medium">{title}</p>
                <p className="text-sm text-muted">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-semibold">Use cases</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ["Startups and SMEs", "Run sales and inbox without hiring a full ops team."],
              ["Agencies", "Keep every client in one CRM timeline and delivery board."],
              ["Consultants", "Turn an enquiry into work, then an invoice, with AI drafts on approval."],
            ].map(([title, body]) => (
              <article key={title} className="rounded-xl border border-border bg-background p-5">
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-semibold">Trust</h2>
        <p className="mt-3 max-w-2xl text-sm text-muted">
          We do not publish unnamed logos, unverified usage statistics, or security
          certifications we do not hold. Read how we handle data instead.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button href="/security" variant="secondary" size="sm">
            <Shield className="h-4 w-4" /> Security
          </Button>
          <Button href="/privacy" variant="secondary" size="sm">
            Privacy
          </Button>
          <Button href="/status" variant="secondary" size="sm">
            Status
          </Button>
          <Button href="/subprocessors" variant="secondary" size="sm">
            Subprocessors
          </Button>
        </div>
      </section>

      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-semibold">Pricing</h2>
          <p className="mt-2 text-sm text-muted">{TRIAL_POLICY.copy}</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {PRICING_TIERS.filter((tier) => tier.id !== "enterprise")
              .slice(0, 3)
              .map((tier) => (
                <article key={tier.id} className="rounded-xl border border-border p-5">
                  <h3 className="font-semibold">{tier.name}</h3>
                  <p className="mt-1 text-2xl font-bold">
                    {tier.price}
                    <span className="text-sm font-normal text-muted">{tier.period}</span>
                  </p>
                  <p className="mt-2 text-xs text-muted">{tier.description}</p>
                </article>
              ))}
          </div>
          <Link href="/pricing" className="mt-6 inline-block text-sm font-medium text-gold">
            Full comparison
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-semibold">FAQ</h2>
        <dl className="mt-6 space-y-4">
          {faqs.map((item) => (
            <div key={item.q} className="rounded-xl border border-border p-4">
              <dt className="font-medium">{item.q}</dt>
              <dd className="mt-1 text-sm text-muted">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="border-t border-border bg-background py-16 text-center">
        <Users className="mx-auto h-8 w-8 text-gold" />
        <h2 className="mt-4 text-2xl font-semibold">Start with your first workflow — not a full migration.</h2>
        <div className="mt-6 flex justify-center gap-3">
          <TrackedCta href="/register" cta="start_workflow">
            Start Free
          </TrackedCta>
          <Button href="/contact" variant="secondary">
            Talk to us
          </Button>
        </div>
      </section>
    </>
  );
}

export const metadata: Metadata = {
  title: "Aarvanta Business OS",
  description: COMPANY.subtagline,
  alternates: { canonical: canonicalUrl("/") },
};
