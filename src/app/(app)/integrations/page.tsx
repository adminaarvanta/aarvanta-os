import { Plug } from "lucide-react";
import { IntegrationsClient } from "@/components/integrations/integrations-client";
import { INTEGRATION_DEFINITIONS } from "@/lib/data/integration-demo-seed";
import { getIntegrationRepository } from "@/lib/data/integration-store";
import { getSessionContext } from "@/lib/tenant/context";

export default async function IntegrationsPage() {
  const ctx = await getSessionContext();
  const repo = getIntegrationRepository();
  const connections = await repo.listConnections(
    ctx.scope.tenantId,
    ctx.scope.workspaceId
  );

  const providers = INTEGRATION_DEFINITIONS.map((def) => ({
    ...def,
    connection: connections.find((c) => c.provider === def.provider) ?? null,
  }));

  return (
    <>
      <header className="shrink-0 border-b border-border bg-surface-elevated px-4 py-3 sm:px-6 sm:py-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground sm:text-xl">
          <Plug className="h-5 w-5 text-gold" />
          Integrations
        </h2>
        <p className="text-xs text-muted sm:text-sm">
          Connect Gmail, Calendar, Slack, WhatsApp, Stripe, and more.
        </p>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
        <IntegrationsClient providers={providers} />
      </div>
    </>
  );
}

export const metadata = { title: "Integrations" };
