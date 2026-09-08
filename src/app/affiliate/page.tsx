import Link from "next/link";
import { Handshake } from "lucide-react";
import { AffiliateApplyForm } from "@/components/affiliate/affiliate-apply-form";
import { BrandLogo } from "@/components/brand/logo";

export const metadata = { title: "Partner & Affiliate · Aarvanta" };

export default function AffiliateLandingPage() {
  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-6">
        <BrandLogo size="md" />
        <div className="flex gap-3 text-sm">
          <Link href="/partners" className="text-gold hover:underline">
            Dashboard
          </Link>
          <Link href="/login" className="text-muted hover:text-foreground">
            Sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-16">
        <div className="flex items-center gap-3">
          <Handshake className="h-8 w-8 text-gold" />
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Partner & Affiliate
          </h1>
        </div>
        <p className="mt-3 max-w-xl text-muted">
          Refer teams to Aarvanta. Earn CPA on qualified free signups and
          revenue share on paid plans. Create your password, add phone and
          location, and finish signup here — no email password links.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="#apply"
            className="inline-flex items-center justify-center rounded-lg bg-gold px-4 py-2 text-sm font-medium text-black hover:bg-gold-bright"
          >
            Apply now
          </Link>
          <Link
            href="/partners"
            className="inline-flex items-center justify-center rounded-lg border border-border bg-surface-muted px-4 py-2 text-sm font-medium text-foreground hover:border-gold/40"
          >
            Existing customer? Opt in
          </Link>
          <Link
            href="/r/DEMOREF"
            className="inline-flex items-center justify-center rounded-lg border border-border bg-surface-muted px-4 py-2 text-sm font-medium text-foreground hover:border-gold/40"
          >
            Try demo link
          </Link>
        </div>

        <section id="apply" className="mt-12 rounded-2xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-foreground">
            Apply as an external partner
          </h2>
          <p className="mt-1 text-sm text-muted">
            You are activated immediately. Choose your own password on this
            page, then we take you to onboarding and your partner dashboard.
          </p>
          <div className="mt-6">
            <AffiliateApplyForm />
          </div>
        </section>
      </main>
    </div>
  );
}
