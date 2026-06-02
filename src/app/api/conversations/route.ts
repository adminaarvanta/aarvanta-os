import { NextResponse } from "next/server";
import { getRepository } from "@/lib/data/repository";
import { getTenantScope } from "@/lib/tenant/context";
import { unauthorized } from "@/lib/api/request";

export async function GET() {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  const conversations = await getRepository().listConversations(scope);
  return NextResponse.json({ conversations });
}
