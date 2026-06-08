import { NextResponse } from "next/server";
import { newId } from "@/lib/data/conversation-helpers";

export async function POST() {
  const sessionId = newId("chat");
  return NextResponse.json({ sessionId });
}
