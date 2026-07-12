import type { SiteDeploymentConfig } from "@/types/site-builder";

export type VercelDeployNote = {
  title: string;
  body: string;
};

export function buildVercelDeployNotes(deployment: SiteDeploymentConfig): VercelDeployNote[] {
  const project = deployment.projectName?.trim() || "your-site-project";
  const domain = deployment.customDomain?.trim();

  return [
    {
      title: "1. Connect your repository",
      body: "In the Vercel dashboard, click Add New → Project and import the Git repository that contains your generated site export.",
    },
    {
      title: "2. Configure the project",
      body: `Set the project name to "${project}". Framework preset: Next.js (or Static if exporting HTML). Root directory: leave as \`./\` unless your site lives in a subfolder.`,
    },
    {
      title: "3. Environment variables",
      body: "Add any API keys your site needs (e.g. contact form endpoint, analytics). For Build OS sites, set NEXT_PUBLIC_SITE_SLUG if using multi-tenant routing.",
    },
    {
      title: "4. Deploy",
      body: "Click Deploy. Vercel assigns a *.vercel.app URL automatically. Each git push to main triggers a production deployment.",
    },
    {
      title: "5. Custom domain (optional)",
      body: domain
        ? `In Vercel → Project → Settings → Domains, add "${domain}". Vercel shows DNS records (usually a CNAME to cname.vercel-dns.com or A record to 76.76.21.21). Update records at your registrar, then wait for SSL provisioning.`
        : "In Vercel → Project → Settings → Domains, add your domain. Copy the DNS records Vercel provides to your registrar. SSL is automatic once DNS propagates.",
    },
    {
      title: "6. Verify & monitor",
      body: "Open the live URL, confirm all pages load, forms submit, and chat widget connects. Use Vercel Analytics or your Founder Dashboard for traffic.",
    },
  ];
}
