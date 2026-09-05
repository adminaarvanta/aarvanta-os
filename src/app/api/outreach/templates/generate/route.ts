import { NextResponse } from "next/server";
import { authErrorResponse, parseJsonBody } from "@/lib/api/request";
import {
  AiNotConfiguredError,
  AiRequestError,
} from "@/lib/ai/provider";
import { requireEmailOutreachSession } from "@/lib/channels/email-outreach-access";
import { generateEmailHtmlTemplate } from "@/lib/email-outreach/generate-template";
import { generateEmailTemplateSchema } from "@/lib/email-outreach/schemas";

export async function POST(req: Request) {
  try {
    await requireEmailOutreachSession();
    const body = await parseJsonBody<unknown>(req);
    if (body instanceof NextResponse) return body;

    const parsed = generateEmailTemplateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await generateEmailHtmlTemplate({
      prompt: parsed.data.prompt,
      tone: parsed.data.tone,
      brandName: parsed.data.brandName,
      ctaUrl: parsed.data.ctaUrl?.trim() || undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    const auth = authErrorResponse(error);
    if (auth) return auth;
    if (error instanceof AiNotConfiguredError) {
      return NextResponse.json(
        {
          error: {
            message:
              "AI is not configured. Set OPENAI_API_KEY, or use a starter / paste HTML.",
          },
        },
        { status: 503 }
      );
    }
    if (error instanceof AiRequestError) {
      return NextResponse.json(
        { error: { message: error.message } },
        { status: 502 }
      );
    }
    return NextResponse.json(
      { error: { message: "Failed to generate template" } },
      { status: 500 }
    );
  }
}
