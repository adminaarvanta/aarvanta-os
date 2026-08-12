import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/brand/logo";

const PANEL_POINTS = [
  "AI workforce on one operating system",
  "CRM, inbox, and voice in a single hub",
  "Built for founders who want speed, not more tools",
] as const;

export function AuthSplitLayout({
  title,
  subtitle,
  children,
  footer,
  panelEyebrow = "Aarvanta",
  panelHeadline = "Your AI business operating system",
  panelBody = "Sign in to run sales, support, and operations from one modern workspace.",
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
  panelEyebrow?: string;
  panelHeadline?: string;
  panelBody?: string;
}) {
  return (
    <div className="grid min-h-[100dvh] bg-background lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden lg:block">
        <Image
          src="/auth-panel.jpg"
          alt=""
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(8,14,28,0.92)_0%,rgba(18,34,64,0.78)_45%,rgba(12,20,36,0.88)_100%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_15%,rgba(168,137,79,0.28),transparent_45%),radial-gradient(ellipse_at_80%_85%,rgba(47,127,146,0.18),transparent_40%)]" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.35) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "linear-gradient(to bottom, black 0%, transparent 75%)",
          }}
        />

        <div className="relative z-10 flex h-full min-h-[100dvh] flex-col justify-between px-10 py-10 xl:px-14">
          <Link href="/" className="inline-flex w-fit items-center">
            <BrandLogo size="lg" mode="dark" />
          </Link>

          <div className="max-w-lg animate-fade-up">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d4b87a]">
              {panelEyebrow}
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-white xl:text-5xl">
              {panelHeadline}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-white/75">
              {panelBody}
            </p>
            <ul className="mt-8 space-y-3">
              {PANEL_POINTS.map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-3 text-sm text-white/80"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#d4b87a]" />
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-white/45">
            © {new Date().getFullYear()} Aarvanta Limited
          </p>
        </div>
      </aside>

      <main className="relative flex min-h-[100dvh] flex-col overflow-y-auto px-5 py-10 sm:px-8 lg:px-12 xl:px-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(168,137,79,0.08),transparent_40%)]" />
        <div className="relative mx-auto my-auto w-full max-w-[420px] animate-fade-up">
          <div className="mb-8 lg:hidden">
            <Link href="/" className="inline-flex">
              <BrandLogo size="md" />
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.75rem]">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">{subtitle}</p>
          </div>

          {children}

          {footer ? <div className="mt-8">{footer}</div> : null}
        </div>
      </main>
    </div>
  );
}

export const authFieldClassName =
  "mt-1.5 w-full rounded-xl border border-border bg-[var(--input-bg)] px-3.5 py-2.5 text-sm text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-dim focus:border-gold focus:ring-2 focus:ring-[color:var(--focus-ring)]";

export const authLabelClassName =
  "block text-[13px] font-medium text-foreground";

export function AuthDivider({ label = "or continue with" }: { label?: string }) {
  return (
    <div className="relative my-1">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center text-xs">
        <span className="bg-background px-3 text-muted">{label}</span>
      </div>
    </div>
  );
}

export function GoogleAuthButton({
  href,
  label = "Continue with Google",
}: {
  href: string;
  label?: string;
}) {
  return (
    <a
      href={href}
      className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-gold/50 hover:bg-surface-muted"
    >
      <GoogleGlyph />
      {label}
    </a>
  );
}

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
      />
    </svg>
  );
}
