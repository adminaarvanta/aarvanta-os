import type { SsoProvider } from "@/types/platform-modules";

export type OidcProviderConfig = {
  issuer: string;
  clientId: string;
  clientSecret?: string;
  scopes: string[];
  authorizeUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
};

export function getOidcConfig(provider: SsoProvider): OidcProviderConfig | null {
  const prefix = `SSO_${provider.toUpperCase()}`;
  const issuer = process.env[`${prefix}_ISSUER`];
  const clientId = process.env[`${prefix}_CLIENT_ID`];
  if (!issuer || !clientId) return null;

  const normalizedIssuer = issuer.replace(/\/$/, "");
  const isGoogle =
    provider === "google" || /accounts\.google\.com/i.test(normalizedIssuer);

  return {
    issuer: normalizedIssuer,
    clientId,
    clientSecret: process.env[`${prefix}_CLIENT_SECRET`],
    scopes: (process.env[`${prefix}_SCOPES`] ?? "openid email profile").split(
      /\s+/
    ),
    authorizeUrl: isGoogle
      ? "https://accounts.google.com/o/oauth2/v2/auth"
      : `${normalizedIssuer}/authorize`,
    tokenUrl: isGoogle
      ? "https://oauth2.googleapis.com/token"
      : `${normalizedIssuer}/token`,
    userInfoUrl: isGoogle
      ? "https://openidconnect.googleapis.com/v1/userinfo"
      : `${normalizedIssuer}/userinfo`,
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
    access_type: "online",
    prompt: "select_account",
  });

  return `${config.authorizeUrl}?${params.toString()}`;
}

export type OidcTokenResult = {
  access_token: string;
  id_token?: string;
  token_type?: string;
  expires_in?: number;
};

export type OidcUserInfo = {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
};

export async function exchangeOidcCode(input: {
  provider: SsoProvider;
  code: string;
  redirectUri: string;
}): Promise<{ tokens: OidcTokenResult; user: OidcUserInfo }> {
  const config = getOidcConfig(input.provider);
  if (!config) {
    throw new Error("SSO provider is not configured.");
  }
  if (!config.clientSecret) {
    throw new Error("SSO client secret is missing.");
  }

  const body = new URLSearchParams({
    code: input.code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: input.redirectUri,
    grant_type: "authorization_code",
  });

  const tokenRes = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!tokenRes.ok) {
    const text = await tokenRes.text().catch(() => "");
    throw new Error(`Token exchange failed (${tokenRes.status}): ${text.slice(0, 200)}`);
  }
  const tokens = (await tokenRes.json()) as OidcTokenResult;
  if (!tokens.access_token) {
    throw new Error("Token exchange returned no access_token.");
  }

  const userRes = await fetch(config.userInfoUrl, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!userRes.ok) {
    throw new Error(`UserInfo request failed (${userRes.status}).`);
  }
  const user = (await userRes.json()) as OidcUserInfo;
  if (!user.sub) {
    throw new Error("UserInfo missing subject.");
  }
  return { tokens, user };
}

export function isSsoConfigured(provider?: SsoProvider): boolean {
  if (provider) return getOidcConfig(provider) !== null;
  return (["entra", "google", "okta", "onelogin"] as SsoProvider[]).some(
    (p) => getOidcConfig(p) !== null
  );
}
