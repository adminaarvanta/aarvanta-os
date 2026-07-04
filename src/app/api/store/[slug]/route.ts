import { NextResponse } from "next/server";
import { getStorePageRepository } from "@/lib/data/store-page-store";

type RouteParams = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const { slug } = await params;
  const page = await getStorePageRepository().getBySlug(slug);

  if (!page || !page.published) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Store not found" } },
      { status: 404 }
    );
  }

  return NextResponse.json({ store: page });
}
