/** Client-safe share URL helpers (no Node/crypto or datastore imports). */

export function publicSharePath(token: string): string {
  return `/p/${encodeURIComponent(token)}`;
}
