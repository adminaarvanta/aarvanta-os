/**
 * Fetch a Google Sheet as CSV via the public export endpoint.
 * Sheet must be shared “Anyone with the link” (Viewer) for this to work without OAuth.
 */

export function extractGoogleSheetId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const fromUrl = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (fromUrl?.[1]) return fromUrl[1];
  // bare spreadsheet id
  if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed)) return trimmed;
  return null;
}

export function extractGoogleSheetGid(input: string): string | undefined {
  const m = input.trim().match(/[?&#]gid=([0-9]+)/);
  return m?.[1];
}

export async function fetchGoogleSheetCsv(
  sheetUrlOrId: string
): Promise<{ csv: string; sheetId: string; gid: string }> {
  const sheetId = extractGoogleSheetId(sheetUrlOrId);
  if (!sheetId) {
    throw new Error("Paste a Google Sheet link or spreadsheet ID.");
  }
  const gid = extractGoogleSheetGid(sheetUrlOrId) ?? "0";
  const url = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(
    sheetId
  )}/export?format=csv&gid=${encodeURIComponent(gid)}`;

  let res: Response;
  try {
    res = await fetch(url, {
      redirect: "follow",
      cache: "no-store",
      headers: { Accept: "text/csv,text/plain,*/*" },
    });
  } catch {
    throw new Error(
      "Network error fetching Google Sheet. Check the link and try again."
    );
  }

  if (!res.ok) {
    throw new Error(
      `Could not open sheet (${res.status}). Share it as “Anyone with the link → Viewer”, then retry.`
    );
  }

  const csv = await res.text();
  const looksHtml =
    /^\s*<(!DOCTYPE|html|head|body)/i.test(csv) ||
    csv.includes("accounts.google.com") ||
    csv.includes("Sign in");
  if (!csv.trim() || looksHtml) {
    throw new Error(
      "Sheet is not publicly readable. In Google Sheets: Share → Anyone with the link → Viewer."
    );
  }

  return { csv, sheetId, gid };
}
