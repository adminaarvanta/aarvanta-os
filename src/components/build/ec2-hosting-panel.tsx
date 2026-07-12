"use client";

import {
  AWS_REGION_OPTIONS,
  buildEc2DeployNotes,
  EC2_INSTANCE_OPTIONS,
} from "@/lib/site-builder/ec2-deploy-notes";
import type { SiteDeploymentConfig, SiteEc2Config } from "@/types/site-builder";

export function Ec2HostingPanel({
  deployment,
  onEc2Change,
}: {
  deployment: SiteDeploymentConfig;
  onEc2Change: (ec2: SiteEc2Config) => void;
}) {
  const ec2 = deployment.ec2;
  const notes = buildEc2DeployNotes(deployment);

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted">
        Your site is hosted on <strong className="text-foreground">AWS EC2</strong> managed by
        Aarvanta. Domain DNS (Route 53) points to your instance automatically.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1 text-xs text-muted">
          AWS region
          <select
            value={ec2.region}
            onChange={(e) =>
              onEc2Change({ ...ec2, region: e.target.value as SiteEc2Config["region"] })
            }
            className="w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground"
          >
            {AWS_REGION_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
                {"note" in r && r.note ? ` — ${r.note}` : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1 text-xs text-muted">
          Instance type
          <select
            value={ec2.instanceType}
            onChange={(e) =>
              onEc2Change({
                ...ec2,
                instanceType: e.target.value as SiteEc2Config["instanceType"],
              })
            }
            className="w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground"
          >
            {EC2_INSTANCE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label} — {opt.note}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block space-y-1 text-xs text-muted">
        CloudFormation stack name (optional)
        <input
          value={ec2.stackName ?? ""}
          onChange={(e) => onEc2Change({ ...ec2, stackName: e.target.value })}
          className="w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground"
          placeholder="artisan-candles-stack"
        />
      </label>

      <label className="flex items-center gap-2 text-xs text-muted">
        <input
          type="checkbox"
          checked={ec2.sslEnabled}
          onChange={(e) => onEc2Change({ ...ec2, sslEnabled: e.target.checked })}
          className="rounded border-border"
        />
        Enable HTTPS (Let&apos;s Encrypt via Certbot)
      </label>

      <label className="flex items-center gap-2 text-xs text-muted">
        <input
          type="checkbox"
          checked={ec2.autoDeployOnApprove}
          onChange={(e) => onEc2Change({ ...ec2, autoDeployOnApprove: e.target.checked })}
          className="rounded border-border"
        />
        Auto-provision EC2 when plan is approved (coming soon)
      </label>

      <div className="rounded-lg border border-border bg-surface-muted p-3">
        <p className="text-xs font-medium text-gold">AWS EC2 deployment pipeline</p>
        <ol className="mt-2 space-y-2">
          {notes.map((note) => (
            <li key={note.title} className="text-xs text-muted">
              <span className="font-medium text-foreground">{note.title}</span>
              {" — "}
              {note.body}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
