import { NextResponse } from "next/server";
import { authErrorResponse, parseJsonBody } from "@/lib/api/request";
import { requireEmailOutreachSession } from "@/lib/channels/email-outreach-access";
import { getEmailOutreachRepository } from "@/lib/data/email-outreach-store";
import { htmlToPlainText } from "@/lib/email-outreach/html-utils";
import { createEmailOutreachTemplateSchema } from "@/lib/email-outreach/schemas";
import { listEmailStarterTemplates } from "@/lib/email-outreach/starter-templates";

export async function GET() {
  try {
    const ctx = await requireEmailOutreachSession();
    const templates = await getEmailOutreachRepository().listTemplates(
      ctx.scope
    );
    const starters = listEmailStarterTemplates();
    return NextResponse.json({ starters, templates });
  } catch (error) {
    return (
      authErrorResponse(error) ??
      NextResponse.json(
        { error: { message: "Failed to list templates" } },
        { status: 500 }
      )
    );
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await requireEmailOutreachSession();
    const body = await parseJsonBody<unknown>(req);
    if (body instanceof NextResponse) return body;

    const parsed = createEmailOutreachTemplateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    let htmlBody = parsed.data.htmlBody.trim();
    let textBody = parsed.data.textBody.trim();
    if (htmlBody && !textBody) textBody = htmlToPlainText(htmlBody);
    if (!htmlBody && textBody) htmlBody = textBody;
    if (!htmlBody || !textBody) {
      return NextResponse.json(
        { error: { message: "htmlBody or textBody is required" } },
        { status: 400 }
      );
    }
    if (htmlBody.length > 100_000 || textBody.length > 50_000) {
      return NextResponse.json(
        { error: { message: "Template body exceeds size limit" } },
        { status: 400 }
      );
    }

    const template = await getEmailOutreachRepository().createTemplate(
      {
        ...parsed.data,
        htmlBody,
        textBody,
        source: parsed.data.source ?? "user",
        createdBy: ctx.userId,
      },
      ctx.scope
    );
    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    return (
      authErrorResponse(error) ??
      NextResponse.json(
        { error: { message: "Failed to create template" } },
        { status: 500 }
      )
    );
  }
}
