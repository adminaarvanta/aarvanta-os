import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody, unauthorized } from "@/lib/api/request";
import {
  getWhatsAppManagementStatus,
  WhatsAppGraphError,
} from "@/lib/channels/whatsapp-graph";
import {
  createMessageTemplate,
  deleteMessageTemplate,
  getWhatsAppManagementSnapshot,
  listMessageTemplates,
  updateBusinessProfile,
} from "@/lib/channels/whatsapp-management";
import { getSessionContext } from "@/lib/tenant/context";
import { canAccessWhatsAppOs } from "@/lib/channels/whatsapp-access";

async function requireWhatsAppOs() {
  try {
    const ctx = await getSessionContext();
    if (!canAccessWhatsAppOs(ctx.email)) return null;
    return ctx.scope;
  } catch {
    return null;
  }
}

function graphErrorResponse(err: unknown) {
  if (err instanceof WhatsAppGraphError) {
    return NextResponse.json(
      {
        error: {
          code: "WHATSAPP_GRAPH_ERROR",
          message: err.message,
          status: err.status,
          body: err.body,
        },
      },
      { status: err.status >= 400 && err.status < 600 ? err.status : 502 }
    );
  }
  const message = err instanceof Error ? err.message : "WhatsApp management failed.";
  return NextResponse.json(
    { error: { code: "WHATSAPP_MANAGEMENT_ERROR", message } },
    { status: 400 }
  );
}

export async function GET() {
  if (!(await requireWhatsAppOs())) return unauthorized();

  try {
    const snapshot = await getWhatsAppManagementSnapshot();
    return NextResponse.json({
      status: getWhatsAppManagementStatus(),
      ...snapshot,
    });
  } catch (err) {
    return graphErrorResponse(err);
  }
}

const createTemplateSchema = z.object({
  action: z.literal("create_template"),
  name: z.string().min(1).max(512),
  category: z.enum(["MARKETING", "UTILITY", "AUTHENTICATION"]),
  language: z.string().min(2).max(16).default("en_US"),
  bodyText: z.string().min(1).max(1024),
  footerText: z.string().max(60).optional(),
  headerText: z.string().max(60).optional(),
  exampleParams: z.array(z.string().min(1)).max(10).optional(),
});

const deleteTemplateSchema = z.object({
  action: z.literal("delete_template"),
  name: z.string().min(1),
});

const updateProfileSchema = z.object({
  action: z.literal("update_profile"),
  about: z.string().max(139).optional(),
  address: z.string().max(256).optional(),
  description: z.string().max(512).optional(),
  email: z.union([z.string().email(), z.literal("")]).optional(),
  websites: z.array(z.string().url()).max(2).optional(),
  vertical: z.string().max(64).optional(),
});

const patchSchema = z.discriminatedUnion("action", [
  createTemplateSchema,
  deleteTemplateSchema,
  updateProfileSchema,
]);

export async function PATCH(req: Request) {
  if (!(await requireWhatsAppOs())) return unauthorized();

  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const data = parsed.data;
    if (data.action === "create_template") {
      const template = await createMessageTemplate({
        name: data.name,
        category: data.category,
        language: data.language,
        bodyText: data.bodyText,
        footerText: data.footerText,
        headerText: data.headerText,
        exampleParams: data.exampleParams,
      });
      const templates = await listMessageTemplates();
      return NextResponse.json({ template, templates });
    }
    if (data.action === "delete_template") {
      await deleteMessageTemplate(data.name);
      const templates = await listMessageTemplates();
      return NextResponse.json({ ok: true, templates });
    }

    const profile = await updateBusinessProfile({
      about: data.about,
      address: data.address,
      description: data.description,
      email: data.email || undefined,
      websites: data.websites,
      vertical: data.vertical,
    });
    return NextResponse.json({ profile });
  } catch (err) {
    return graphErrorResponse(err);
  }
}
