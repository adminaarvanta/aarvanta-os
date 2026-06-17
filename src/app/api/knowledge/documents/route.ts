import { NextResponse } from "next/server";
import { getKnowledgeRepository } from "@/lib/data/knowledge-store";
import { ingestKnowledgeText, titleFromFileName } from "@/lib/knowledge/ingest";
import { extractTextFromFile, validateUpload } from "@/lib/knowledge/text-extract";
import { getTenantScope } from "@/lib/tenant/context";
import { unauthorized } from "@/lib/api/request";

export const runtime = "nodejs";

export async function GET() {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  const documents = await getKnowledgeRepository().listDocuments(scope);
  return NextResponse.json({ documents });
}

export async function POST(req: Request) {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file upload" }, { status: 400 });
    }

    const fileType = validateUpload(file);
    const text = await extractTextFromFile(file);
    const title =
      (form.get("title") as string | null)?.trim() || titleFromFileName(file.name);

    const document = await ingestKnowledgeText(getKnowledgeRepository(), scope, {
      title,
      fileName: file.name,
      fileType,
      fileSize: file.size,
      text,
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "UPLOAD_FAILED",
          message: error instanceof Error ? error.message : "Upload failed",
        },
      },
      { status: 400 }
    );
  }
}
