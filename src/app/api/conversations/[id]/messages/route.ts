import { NextResponse } from "next/server";
import { z } from "zod";
import { addMessage } from "@/lib/data/store";

const schema = z.object({
  content: z.string().min(1),
  channel: z.enum(["whatsapp", "email", "voice", "sms", "website_chat"]),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const conversation = await addMessage(id, parsed.data);
  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ conversation });
}
