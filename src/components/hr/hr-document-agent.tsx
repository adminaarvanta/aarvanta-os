"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  FileText,
  Sparkles,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  HR_DOCUMENT_SPECS,
  getHrDocumentSpec,
  labelForHrDocumentType,
} from "@/lib/hr/document-types";
import type {
  HrCandidate,
  HrDocument,
  HrDocumentType,
  HrEmployee,
} from "@/types/platform-modules";
import { cn } from "@/lib/utils";

type SubjectOption = {
  id: string;
  name: string;
  kind: "employee" | "candidate";
  meta: string;
};

function downloadMarkdown(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function HrDocumentAgent({
  employees,
  candidates,
  initialDocuments,
}: {
  employees: HrEmployee[];
  candidates: HrCandidate[];
  initialDocuments: HrDocument[];
}) {
  const router = useRouter();
  const [docType, setDocType] = useState<HrDocumentType>("offer_letter");
  const [subjectKey, setSubjectKey] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [contextFields, setContextFields] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<HrDocument | null>(null);
  const [copied, setCopied] = useState(false);

  const spec = getHrDocumentSpec(docType);

  const subjects = useMemo<SubjectOption[]>(
    () => [
      ...employees.map((employee) => ({
        id: `employee:${employee.id}`,
        name: employee.name,
        kind: "employee" as const,
        meta: `${employee.role} · ${employee.department}`,
      })),
      ...candidates.map((candidate) => ({
        id: `candidate:${candidate.id}`,
        name: candidate.name,
        kind: "candidate" as const,
        meta: candidate.role,
      })),
    ],
    [employees, candidates]
  );

  function onTypeChange(type: HrDocumentType) {
    setDocType(type);
    setContextFields({});
    setPreview(null);
    if (!title.trim()) {
      setTitle(`${getHrDocumentSpec(type).label} — ${subjectName || "Draft"}`);
    }
  }

  function onSubjectChange(key: string) {
    setSubjectKey(key);
    const match = subjects.find((subject) => subject.id === key);
    if (match) {
      setSubjectName(match.name);
      if (!title.trim() || title.endsWith(" — Draft")) {
        setTitle(`${spec.label} — ${match.name}`);
      }
    }
  }

  function updateField(key: string, value: string) {
    setContextFields((current) => ({ ...current, [key]: value }));
  }

  async function onGenerate(event: React.FormEvent) {
    event.preventDefault();
    if (!subjectName.trim() || !instructions.trim()) return;

    setBusy(true);
    setError(null);
    setPreview(null);

    const [kind, subjectId] = subjectKey.includes(":")
      ? (subjectKey.split(":") as ["employee" | "candidate", string])
      : [undefined, undefined];

    try {
      const res = await fetch("/api/hr/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: docType,
          title: title.trim() || `${spec.label} — ${subjectName.trim()}`,
          subjectName: subjectName.trim(),
          subjectId: subjectId || undefined,
          subjectKind: kind ?? "other",
          instructions: instructions.trim(),
          contextFields,
        }),
      });

      const data = (await res.json()) as { document?: HrDocument; error?: { message?: string } };
      if (!res.ok || !data.document) {
        setError(data.error?.message ?? "Could not generate document.");
        return;
      }

      setPreview(data.document);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function copyContent(content: string) {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#D4AF37]/30 bg-gradient-to-r from-[#D4AF37]/10 to-transparent p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/15 text-[#D4AF37]">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-[#F5E6C8]">HR Document Agent</h3>
            <p className="mt-1 text-xs text-[#A89878]">
              AI drafts offer letters, experience certificates, corporate invoices, NDAs,
              policy memos, and any HR or corporate document — ready to review, edit, and export.
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={onGenerate}
        className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
      >
        <div className="space-y-4 rounded-xl border border-[#3d3528] bg-[#101010] p-4">
          <p className="text-sm font-medium text-[#F5E6C8]">Generate document</p>

          <label className="block space-y-1 text-xs text-[#A89878]">
            Document type
            <select
              value={docType}
              onChange={(e) => onTypeChange(e.target.value as HrDocumentType)}
              className="w-full rounded-lg border border-[#3d3528] bg-[#0a0a0a] px-3 py-2 text-sm text-[#F5E6C8]"
            >
              {HR_DOCUMENT_SPECS.map((item) => (
                <option key={item.type} value={item.type}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <p className="text-xs text-[#A89878]">{spec.description}</p>

          <label className="block space-y-1 text-xs text-[#A89878]">
            Select from roster (optional)
            <select
              value={subjectKey}
              onChange={(e) => onSubjectChange(e.target.value)}
              className="w-full rounded-lg border border-[#3d3528] bg-[#0a0a0a] px-3 py-2 text-sm text-[#F5E6C8]"
            >
              <option value="">— Manual entry —</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name} ({subject.meta})
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1 text-xs text-[#A89878]">
            Subject name *
            <input
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              required
              placeholder="Employee, candidate, or vendor name"
              className="w-full rounded-lg border border-[#3d3528] bg-[#0a0a0a] px-3 py-2 text-sm text-[#F5E6C8]"
            />
          </label>

          <label className="block space-y-1 text-xs text-[#A89878]">
            Document title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`${spec.label} — ${subjectName || "Name"}`}
              className="w-full rounded-lg border border-[#3d3528] bg-[#0a0a0a] px-3 py-2 text-sm text-[#F5E6C8]"
            />
          </label>

          {spec.fields.map((field) => (
            <label key={field.key} className="block space-y-1 text-xs text-[#A89878]">
              {field.label}
              {field.required ? " *" : ""}
              <input
                value={contextFields[field.key] ?? ""}
                onChange={(e) => updateField(field.key, e.target.value)}
                required={field.required}
                placeholder={field.placeholder}
                className="w-full rounded-lg border border-[#3d3528] bg-[#0a0a0a] px-3 py-2 text-sm text-[#F5E6C8]"
              />
            </label>
          ))}

          <label className="block space-y-1 text-xs text-[#A89878]">
            Instructions for HR Agent *
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              required
              rows={4}
              placeholder="Describe tone, clauses to include, probation, notice period, or any special terms…"
              className="w-full rounded-lg border border-[#3d3528] bg-[#0a0a0a] px-3 py-2 text-sm text-[#F5E6C8]"
            />
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" size="sm" disabled={busy}>
              {busy ? "Generating…" : "Generate with AI"}
            </Button>
            {error && <p className="text-xs text-red-300">{error}</p>}
          </div>
        </div>

        <div className="flex min-h-[20rem] flex-col rounded-xl border border-[#3d3528] bg-[#101010]">
          <div className="flex items-center justify-between border-b border-[#3d3528] px-4 py-3">
            <p className="flex items-center gap-2 text-sm font-medium text-[#F5E6C8]">
              <FileText className="h-4 w-4 text-[#D4AF37]" />
              Preview
            </p>
            {preview && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void copyContent(preview.content)}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#3d3528] px-2 py-1 text-[10px] text-[#A89878] hover:border-[#D4AF37]/40"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? "Copied" : "Copy"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    downloadMarkdown(
                      `${preview.title.replace(/[^\w\- ]+/g, "").replace(/\s+/g, "-")}.md`,
                      preview.content
                    )
                  }
                  className="inline-flex items-center gap-1 rounded-lg border border-[#3d3528] px-2 py-1 text-[10px] text-[#A89878] hover:border-[#D4AF37]/40"
                >
                  <Download className="h-3 w-3" />
                  Download
                </button>
              </div>
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {preview ? (
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-[#F5E6C8]">
                {preview.content}
              </pre>
            ) : (
              <p className="text-sm text-[#A89878]">
                Generated documents appear here. The agent uses your company profile, employee
                context, and structured fields to draft complete corporate documents.
              </p>
            )}
          </div>
        </div>
      </form>

      {initialDocuments.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold text-[#F5E6C8]">Generated documents</h3>
          <ul className="space-y-2">
            {initialDocuments.map((doc) => (
              <li
                key={doc.id}
                className={cn(
                  "rounded-xl border border-[#3d3528] bg-[#101010] p-4 transition-colors",
                  preview?.id === doc.id && "border-[#D4AF37]/40"
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-[#F5E6C8]">{doc.title}</p>
                    <p className="mt-0.5 text-xs text-[#A89878]">
                      {labelForHrDocumentType(doc.type)} · {doc.subjectName} ·{" "}
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="rounded-full bg-[#141414] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[#D4AF37]">
                    {doc.status}
                  </span>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => setPreview(doc)}
                  >
                    View
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      downloadMarkdown(
                        `${doc.title.replace(/[^\w\- ]+/g, "").replace(/\s+/g, "-")}.md`,
                        doc.content
                      )
                    }
                  >
                    Download
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
