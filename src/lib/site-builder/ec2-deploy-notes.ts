import type { SiteDeploymentConfig, SiteDeployNote } from "@/types/site-builder";

/** User-facing hosting steps — infrastructure details stay internal. */
export function buildEc2DeployNotes(deployment: SiteDeploymentConfig): SiteDeployNote[] {
  const domain = deployment.domain.selectedDomain ?? "your-domain.com";

  return [
    {
      title: "1. Domain ready",
      body:
        deployment.domain.status === "purchased"
          ? `${domain} is registered through Aarvanta. DNS is configured automatically for your site.`
          : `Optional: purchase ${domain} through Aarvanta when you are ready to go live. You can preview first.`,
    },
    {
      title: "2. Managed hosting",
      body: "Aarvanta Hosting provisions a secure, SSL-ready environment for your generated site — no server setup required.",
    },
    {
      title: "3. Publish",
      body: `After you approve the plan, your site deploys to https://${domain} (or a preview URL until a domain is attached).`,
    },
    {
      title: "4. Keep running",
      body: "Uptime, renewals, and basic health monitoring are included with Aarvanta Hosting.",
    },
  ];
}

export const EC2_INSTANCE_OPTIONS = [
  { value: "t3.micro", label: "Starter", note: "Light traffic" },
  { value: "t3.small", label: "Standard", note: "Most businesses" },
  { value: "t3.medium", label: "Growth", note: "Stores & high traffic" },
] as const;

export const AWS_REGION_OPTIONS = [
  { value: "eu-west-2", label: "Europe (UK)", note: "Recommended for UK" },
  { value: "eu-west-1", label: "Europe (Ireland)" },
  { value: "us-east-1", label: "United States" },
  { value: "ap-south-1", label: "Asia (India)" },
] as const;
