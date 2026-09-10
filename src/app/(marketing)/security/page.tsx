import type { Metadata } from "next";

export const metadata: Metadata = { title: "Security" };

export default function SecurityPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold">Security</h1>
      <p className="mt-4 text-sm text-muted">
        This page describes how Aarvanta OS handles access today. It is not a
        SOC 2, ISO, or pentest certificate.
      </p>
      <ul className="mt-6 list-disc space-y-2 pl-5 text-sm text-muted">
        <li>Production sessions use an HTTP-only JWT cookie.</li>
        <li>Organisation data is scoped by tenant, workspace, and company IDs on the server.</li>
        <li>Role-based permissions are enforced in API routes, not only in the UI.</li>
        <li>High-impact AI actions require approval unless a workspace policy explicitly allows automation.</li>
        <li>Secrets belong in environment variables — never in the browser bundle.</li>
      </ul>
      <p className="mt-6 text-sm">
        Questions: <a className="text-gold" href="mailto:hello@aarvanta.com">hello@aarvanta.com</a>
      </p>
    </article>
  );
}
