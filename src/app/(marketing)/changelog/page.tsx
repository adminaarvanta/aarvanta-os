import type { Metadata } from "next";

export const metadata: Metadata = { title: "Changelog" };

export default function ChangelogPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold">Changelog</h1>
      <section className="mt-8 space-y-2">
        <h2 className="text-lg font-semibold">A48 — Business OS tightening</h2>
        <ul className="list-disc pl-5 text-sm text-muted">
          <li>Today Action Centre replaces the module launcher on Home.</li>
          <li>Customer 360 timeline on existing contact records.</li>
          <li>AI autonomy, approvals, and workspace pause enforced in execution.</li>
          <li>Public copy uses live/beta/preview labels. No MarketingOS product.</li>
          <li>Free plan language replaces an unsupported 14-day trial claim.</li>
        </ul>
      </section>
    </article>
  );
}
