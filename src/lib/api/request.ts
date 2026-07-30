import { NextResponse } from "next/server";

export async function parseJsonBody<T>(req: Request): Promise<T | NextResponse> {
  try {
    return (await req.json()) as T;
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_JSON", message: "Invalid JSON body" } },
      { status: 400 }
    );
  }
}

export function apiError(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function unauthorized() {
  return apiError("UNAUTHORIZED", "Authentication required", 401);
}

export function planEntitlementResponse(error: {
  code: string;
  message: string;
  upgradeHint?: string;
  feature?: string;
  metric?: string;
  status?: number;
}) {
  const status =
    error.status ??
    (error.code === "PLAN_LIMIT" ? 402 : 403);
  return NextResponse.json(
    {
      error: {
        code: error.code,
        message: error.message,
        upgradeHint: error.upgradeHint,
        feature: error.feature,
        metric: error.metric,
      },
    },
    { status }
  );
}
