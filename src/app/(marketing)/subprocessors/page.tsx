import type { Metadata } from "next";

export const metadata: Metadata = { title: "Subprocessors" };

export default function SubprocessorsPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold">Subprocessors</h1>
      <p className="mt-4 text-sm text-muted">
        Depending on configuration, Aarvanta OS may process data with:
      </p>
      <ul className="mt-6 list-disc space-y-2 pl-5 text-sm text-muted">
        <li>Google (Firebase / Firestore, Gmail IMAP when connected)</li>
        <li>OpenAI (summaries and agent drafts when an API key is configured)</li>
        <li>Stripe (billing, when enabled)</li>
        <li>Twilio / Meta (voice, SMS, WhatsApp when those channels are live)</li>
        <li>Vercel (application hosting)</li>
      </ul>
      <p className="mt-6 text-sm text-muted">
        Demo mode keeps data in memory on the server process and does not send
        customer content to those providers unless you configure them.
      </p>
    </article>
  );
}
