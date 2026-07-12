import type { z } from "zod";
import type { SitePreferences } from "@/types/site-builder";
import type { sitePreferencesSchema } from "@/lib/site-builder/schemas";

export function normalizeSitePreferences(
  data: z.infer<typeof sitePreferencesSchema>
): SitePreferences {
  return {
    ...data,
    referenceUrl: data.referenceUrl || undefined,
    referenceScreenshots: data.referenceScreenshots ?? [],
    deployment: {
      hostingProvider: data.deployment.hostingProvider,
      projectName: data.deployment.projectName,
      customDomain: data.deployment.customDomain || undefined,
      vercelTeam: data.deployment.vercelTeam,
      autoDeployOnApprove: data.deployment.autoDeployOnApprove,
    },
  };
}
