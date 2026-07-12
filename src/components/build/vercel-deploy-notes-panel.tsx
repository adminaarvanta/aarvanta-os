"use client";

import type { SiteDeploymentConfig } from "@/types/site-builder";
import { buildVercelDeployNotes } from "@/lib/site-builder/vercel-deploy-notes";

export function VercelDeployNotesPanel({
  deployment,
  compact = false,
}: {
  deployment: SiteDeploymentConfig;
  compact?: boolean;
}) {
  const notes =
    deployment.hostingProvider === "vercel"
      ? buildVercelDeployNotes(deployment)
      : [
          {
            title: "Self-hosted",
            body: "Export your generated site and deploy to your own infrastructure. Point DNS A/CNAME records to your host.",
          },
        ];

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted">
        {deployment.hostingProvider === "vercel"
          ? "Host on Vercel — follow these steps after your site is generated. Domain DNS is configured in Vercel, not in Build OS."
          : "Self-hosted deployment notes."}
      </p>
      <ol className={compact ? "space-y-2" : "space-y-3"}>
        {notes.map((note) => (
          <li
            key={note.title}
            className="rounded-lg border border-border bg-surface-muted p-3"
          >
            <p className="text-xs font-medium text-gold">{note.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">{note.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
