import type { SiteDeploymentConfig, SiteDeployNote } from "@/types/site-builder";

export function buildEc2DeployNotes(deployment: SiteDeploymentConfig): SiteDeployNote[] {
  const domain = deployment.domain.selectedDomain ?? "your-domain.com";
  const region = deployment.ec2.region;
  const instance = deployment.ec2.instanceType;
  const stack = deployment.ec2.stackName?.trim() || deployment.domain.selectedDomain?.split(".")[0] || "site-stack";

  return [
    {
      title: "1. Domain registered via Aarvanta",
      body: deployment.domain.status === "purchased"
        ? `Domain ${domain} is registered through Aarvanta Domain Store (order ${deployment.domain.registrarOrderId ?? "pending"}). Route 53 hosted zone is created automatically — no external DNS setup needed.`
        : `Purchase ${domain} through Aarvanta before deployment. DNS is managed by us via Route 53.`,
    },
    {
      title: "2. EC2 instance provisioning",
      body: `A ${instance} instance launches in ${region}. Build OS deploys your generated site to the instance with Nginx, Node.js runtime, and SSL (Let's Encrypt via Certbot when enabled: ${deployment.ec2.sslEnabled ? "yes" : "no"}).`,
    },
    {
      title: "3. Stack configuration",
      body: `CloudFormation stack "${stack}" configures security groups (ports 80/443), elastic IP, and attaches your Aarvanta-purchased domain via Route 53 A-record alias.`,
    },
    {
      title: "4. SSL certificate",
      body: deployment.ec2.sslEnabled
        ? `HTTPS is enabled automatically. Certificate renews via Certbot cron on the EC2 instance.`
        : `Enable SSL in deployment settings for automatic HTTPS provisioning.`,
    },
    {
      title: "5. Go live",
      body: `Once generation completes, your site is served at https://${domain}. Preview via EC2 public IP is available during DNS propagation (typically under 15 minutes).`,
    },
    {
      title: "6. Monitoring",
      body: "CloudWatch basic monitoring is enabled. View instance health and deployment status in Build OS and your Founder Dashboard.",
    },
  ];
}

export const EC2_INSTANCE_OPTIONS = [
  { value: "t3.micro", label: "t3.micro", note: "Dev / low traffic — 1 vCPU, 1 GB" },
  { value: "t3.small", label: "t3.small", note: "SMB sites — 2 vCPU, 2 GB" },
  { value: "t3.medium", label: "t3.medium", note: "Storefronts — 2 vCPU, 4 GB" },
] as const;

export const AWS_REGION_OPTIONS = [
  { value: "eu-west-2", label: "EU (London)", note: "Recommended for UK" },
  { value: "eu-west-1", label: "EU (Ireland)" },
  { value: "us-east-1", label: "US East (N. Virginia)" },
  { value: "ap-south-1", label: "Asia Pacific (Mumbai)" },
] as const;
