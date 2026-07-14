import { NextResponse } from "next/server";
import { z } from "zod";
import { getOpenAI, isAiConfigured } from "@/lib/ai/client";
import { parseJsonBody, unauthorized } from "@/lib/api/request";
import { getTenantScope } from "@/lib/tenant/context";
import {
  SUPPORT_DESTINATIONS,
  buildHeuristicSupportReply,
} from "@/lib/support/knowledge";

const postSchema = z.object({
  message: z.string().min(1).max(2000),
});

function catalogForPrompt() {
  return SUPPORT_DESTINATIONS.map(
    (d) => `- ${d.title} (${d.href}): ${d.blurb}`
  ).join("\n");
}

async function askOpenAiSupport(message: string): Promise<{
  answer: string;
  links: { title: string; href: string }[];
} | null> {
  if (!isAiConfigured()) return null;
  const client = getOpenAI();
  if (!client) return null;

  try {
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_SUPPORT_MODEL || "gpt-4o-mini",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are Aarvanta OS Support, a friendly guide for non-technical business users.
Never mention API paths, database IDs, UUIDs, code, or internal technical details.
Answer briefly (2-5 sentences). Suggest where to go in the product using ONLY these destinations:

${catalogForPrompt()}

Respond as JSON: {"answer":"...","links":[{"title":"...","href":"..."}]}
Include 0-3 links that are most helpful. href must match the catalog exactly.`,
        },
        { role: "user", content: message },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      answer?: string;
      links?: { title?: string; href?: string }[];
    };
    if (!parsed.answer) return null;

    const allowed = new Set(SUPPORT_DESTINATIONS.map((d) => d.href));
    const links = (parsed.links ?? [])
      .filter((l): l is { title: string; href: string } =>
        Boolean(l?.title && l?.href && allowed.has(l.href))
      )
      .slice(0, 3);

    return { answer: parsed.answer, links };
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    await getTenantScope();
  } catch {
    return unauthorized();
  }

  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please type a short question." }, { status: 400 });
  }

  const ai = await askOpenAiSupport(parsed.data.message);
  const result = ai ?? buildHeuristicSupportReply(parsed.data.message);

  return NextResponse.json({
    answer: result.answer,
    links: result.links,
    source: ai ? "ai" : "guide",
  });
}
