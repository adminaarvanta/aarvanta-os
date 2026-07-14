import Link from "next/link";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { BrandLogo } from "@/components/brand/logo";

const links = [
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function MarketingNav({ production }: { production: boolean }) {

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <BrandLogo href="/" size="header" />
        <nav className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher compact />
          <ThemeToggle />
          {production ? (
            <Link
              href="/login"
              className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:border-gold/40"
            >
              Sign in
            </Link>
          ) : null}
          <Link
            href="/inbox"
            className="rounded-lg bg-gold px-3 py-2 text-sm font-semibold text-black hover:bg-gold-bright sm:px-4"
          >
            {production ? "Open app" : "Launch demo"}
          </Link>
        </div>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-sm font-medium text-foreground">Aarvanta Business OS</p>
          <p className="mt-1 text-xs text-muted">
            © {new Date().getFullYear()} Aarvanta Limited. All rights reserved.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-xs text-muted">
          <Link href="/pricing" className="hover:text-gold">
            Pricing
          </Link>
          <Link href="/about" className="hover:text-gold">
            About
          </Link>
          <Link href="/contact" className="hover:text-gold">
            Contact
          </Link>
          <Link href="/inbox" className="hover:text-gold">
            App
          </Link>
        </div>
      </div>
    </footer>
  );
}
