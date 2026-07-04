import { crmNow } from "@/lib/data/crm-helpers";
import { attachCommercialToSession } from "@/lib/launch/commercial-package";
import { interpretLaunchIntent } from "@/lib/launch/interpret";
import { newLaunchId } from "@/lib/launch/deploy";
import type { TenantScope } from "@/types/communication";
import type {
  CreateLaunchSessionInput,
  LaunchInterpretationResult,
  LaunchSession,
} from "@/types/launch";

export async function createAndInterpretLaunch(
  input: CreateLaunchSessionInput,
  scope: TenantScope
): Promise<LaunchInterpretationResult> {
  const now = crmNow();
  const interpretation = await interpretLaunchIntent(input);

  let session: LaunchSession = {
    ...scope,
    id: newLaunchId(),
    status: "interpreted",
    intent: input,
    brandName: interpretation.brandName,
    industry: interpretation.industry,
    businessModel: interpretation.businessModel,
    buddies: interpretation.buddies,
    createdAt: now,
    updatedAt: now,
  };

  session = attachCommercialToSession(
    session,
    scope,
    interpretation.brandName,
    input,
    interpretation.industry.industryProfileId
  );

  return { session, usedAi: interpretation.usedAi };
}
