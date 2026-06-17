import Link from "next/link";
import { BrandLogo } from "@/components/brand/logo";

const links = [
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function MarketingNav({ production }: { production: boolean }) {

  return (
    <header className="sticky top-0 z-50 border-b border-[#3d3528]/80 bg-black/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <BrandLogo href="/" size="sm" />
        <nav className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-[#A89878] transition-colors hover:text-[#F5E6C8]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          {production ? (
            <Link
              href="/login"
              className="rounded-lg border border-[#3d3528] px-3 py-2 text-sm font-medium text-[#F5E6C8] hover:border-[#D4AF37]/40"
            >
              Sign in
            </Link>
          ) : null}
          <Link
            href="/inbox"
            className="rounded-lg bg-[#D4AF37] px-3 py-2 text-sm font-semibold text-black hover:bg-[#F9E076] sm:px-4"
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
    <footer className="border-t border-[#3d3528] bg-[#0a0a0a]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-sm font-medium text-[#F5E6C8]">Aarvanta OS</p>
          <p className="mt-1 text-xs text-[#A89878]">
            © {new Date().getFullYear()} Aarvanta Limited. All rights reserved.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-xs text-[#A89878]">
          <Link href="/pricing" className="hover:text-[#D4AF37]">
            Pricing
          </Link>
          <Link href="/about" className="hover:text-[#D4AF37]">
            About
          </Link>
          <Link href="/contact" className="hover:text-[#D4AF37]">
            Contact
          </Link>
          <Link href="/inbox" className="hover:text-[#D4AF37]">
            App
          </Link>
        </div>
      </div>
    </footer>
  );
}
