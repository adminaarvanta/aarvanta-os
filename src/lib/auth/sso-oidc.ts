import type { SsoProvider } from "@/types/platform-modules";

export type OidcProviderConfig = {
  issuer: string;
  clientId: string;
  clientSecret?: string;
  scopes: string[];
};

export function getOidcConfig(provider: SsoProvider): OidcProviderConfig | null {
  const prefix = `SSO_${provider.toUpperCase()}`;
  const issuer = process.env[`${prefix}_ISSUER`];
  const clientId = process.env[`${prefix}_CLIENT_ID`];
  if (!issuer || !clientId) return null;

  return {
    issuer: issuer.replace(/\/$/, ""),
    clientId,
    clientSecret: process.env[`${prefix}_CLIENT_SECRET`],
    scopes: (process.env[`${prefix}_SCOPES`] ?? "openid email profile").split(" "),
  };
}

export function buildOidcAuthorizeUrl(input: {
  provider: SsoProvider;
  redirectUri: string;
  state: string;
}): string | null {
  const config = getOidcConfig(input.provider);
  if (!config) return null;

  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: "code",
    scope: config.scopes.join(" "),
    redirect_uri: input.redirectUri,
    state: input.state,
  });

  return `${config.issuer}/authorize?${params.toString()}`;
}

export function isSsoConfigured(provider?: SsoProvider): boolean {
  if (provider) return getOidcConfig(provider) !== null;
  return (["entra", "google", "okta", "onelogin"] as SsoProvider[]).some(
    (p) => getOidcConfig(p) !== null
  );
}
