import { Lock } from "lucide-react";
import { CardList, ModulePageShell, StatGrid } from "@/components/platform/module-page-shell";
import { SsoConnectionForm } from "@/components/sso/sso-connection-form";
import { getSsoStore } from "@/lib/data/platform-store";
import { getTenantScope } from "@/lib/tenant/context";

export default async function SsoPage() {
  const scope = await getTenantScope();
  const connections = await getSsoStore().list(scope);

  return (
    <ModulePageShell
      icon={Lock}
      title="Enterprise SSO"
      description="Monitor identity provider connections and provisioning posture."
    >
      <div className="space-y-8">
        <SsoConnectionForm />

        <StatGrid
          items={[
            { label: "Connections", value: connections.length, sub: "Configured IdPs" },
            {
              label: "Active",
              value: connections.filter((connection) => connection.status === "active").length,
              sub: "Live sign-in flows",
            },
            {
              label: "MFA required",
              value: connections.filter((connection) => connection.mfaRequired).length,
              sub: "Security coverage",
            },
            {
              label: "SCIM enabled",
              value: connections.filter((connection) => connection.scimEnabled).length,
              sub: "Provisioning enabled",
            },
          ]}
        />

        <section>
          <h3 className="mb-3 text-sm font-semibold text-[#FFFFFF]">Connections</h3>
          <CardList
            items={connections.map((connection) => ({
              id: connection.id,
              title: `${connection.provider.toUpperCase()} · ${connection.domain}`,
              body: `Protocol ${connection.protocol.toUpperCase()} · MFA ${
                connection.mfaRequired ? "required" : "optional"
              } · SCIM ${connection.scimEnabled ? "enabled" : "disabled"}`,
              badge: connection.status,
            }))}
          />
        </section>
      </div>
    </ModulePageShell>
  );
}

export const metadata = { title: "SSO" };
