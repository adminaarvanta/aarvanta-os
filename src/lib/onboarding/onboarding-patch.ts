import { z } from "zod";

export const STARTING_WORKFLOWS = [
  "sales_crm",
  "customer_communication",
  "projects_operations",
  "ai_assistance",
  "website",
] as const;

export const onboardingPatchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  website: z.string().max(200).optional(),
  useCase: z
    .enum(["own_business", "agency", "internal_team", "exploring"])
    .optional(),
  industry: z.string().min(1).max(80).optional(),
  customerCountRange: z
    .enum(["1-10", "11-50", "51-200", "200+", "none_yet"])
    .optional(),
  tools: z.array(z.string().max(60)).max(20).optional(),
  primaryGoal: z.string().max(160).optional(),
  startingWorkflow: z.enum(STARTING_WORKFLOWS).optional(),
  connectSkipped: z.boolean().optional(),
  sampleDataOptIn: z.boolean().optional(),
  timezone: z.string().max(64).optional(),
  currency: z.string().max(8).optional(),
  complete: z.boolean().optional(),
  dismissLaunchpad: z.boolean().optional(),
});

export type OnboardingPatch = z.infer<typeof onboardingPatchSchema>;

export function parseOnboardingPatch(body: unknown) {
  return onboardingPatchSchema.safeParse(body);
}
