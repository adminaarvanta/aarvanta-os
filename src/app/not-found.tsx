import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-semibold text-gold">404</p>
      <h1 className="mt-2 text-2xl font-semibold">That page is not here</h1>
      <p className="mt-2 text-sm text-muted">
        The link may be outdated. Your data is unchanged. Go home or open the app.
      </p>
      <div className="mt-6 flex gap-3">
        <Link href="/" className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-black">
          Home
        </Link>
        <Link href="/dashboard" className="rounded-lg border border-border px-4 py-2 text-sm">
          Open app
        </Link>
      </div>
    </main>
  );
}
