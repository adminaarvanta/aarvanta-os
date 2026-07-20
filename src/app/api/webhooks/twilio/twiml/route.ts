import { NextResponse } from "next/server";

/**
 * Twilio fetches this URL when a Voice OS call connects.
 * Default Twilio method is POST — supporting GET + POST avoids the
 * classic "An application error has occurred" 405 failure.
 */
export async function GET(req: Request) {
  return twimlResponse(req);
}

export async function POST(req: Request) {
  return twimlResponse(req);
}

async function twimlResponse(req: Request) {
  const url = new URL(req.url);
  let message = url.searchParams.get("message");

  // Twilio POST may also echo params in the body for some setups.
  if (!message && req.method === "POST") {
    try {
      const contentType = req.headers.get("content-type") ?? "";
      if (contentType.includes("application/x-www-form-urlencoded")) {
        const form = await req.formData();
        const fromBody = form.get("message");
        if (typeof fromBody === "string" && fromBody.trim()) {
          message = fromBody;
        }
      }
    } catch {
      /* fall through to default */
    }
  }

  const spoken = (message?.trim() || "Hello from Aarvanta Voice OS.").slice(
    0,
    3500
  );

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${escapeXml(spoken)}</Say>
</Response>`;

  return new NextResponse(twiml, {
    status: 200,
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
