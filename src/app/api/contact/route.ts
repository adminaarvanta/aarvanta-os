import { NextResponse } from "next/server";
import { z } from "zod";
import { crmNewId, crmNow } from "@/lib/data/crm-helpers";
import { parseJsonBody } from "@/lib/api/request";

const schema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  message: z.string().min(1).max(5000),
});

type ContactSubmission = {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
};

const submissions: ContactSubmission[] = [];

export async function POST(req: Request) {
  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  submissions.unshift({
    id: crmNewId("contact"),
    ...parsed.data,
    createdAt: crmNow(),
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
