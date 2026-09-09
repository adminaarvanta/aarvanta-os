import type { Metadata } from "next";
import Link from "next/link";
import { publicCapabilities } from "@/lib/product/maturity";
import { MaturityBadge } from "@/components/ui/maturity-badge";

export const metadata: Metadata = { title: "Docs" };

export default function DocsPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold">Docs</h1>
      <p className="mt-4 text-sm text-muted">
        Short product guides. Technical operator docs stay in the repository README.
      </p>
      <ul className="mt-8 space-y-3">
        {publicCapabilities().map((module) => (
          <li key={module.id} className="rounded-xl border border-border px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <Link href={module.href} className="font-medium text-gold hover:underline">
                {module.label}
              </Link>
              <MaturityBadge status={module.status} />
            </div>
            <p className="mt-1 text-sm text-muted">{module.description}</p>
          </li>
        ))}
      </ul>
    </article>
  );
}
