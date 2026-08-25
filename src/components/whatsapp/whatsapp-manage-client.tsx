"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, Phone, FileText, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  WhatsAppBusinessProfile,
  WhatsAppMessageTemplate,
  WhatsAppPhoneNumber,
} from "@/lib/channels/whatsapp-management";

type ManagePayload = {
  status: "live" | "simulate" | "not_configured";
  templates: WhatsAppMessageTemplate[];
  profile: WhatsAppBusinessProfile;
  phones: WhatsAppPhoneNumber[];
  error?: { message?: string };
};

function statusTone(status: string) {
  const s = status.toUpperCase();
  if (s === "APPROVED") return "bg-success/15 text-success";
  if (s === "PENDING" || s === "IN_APPEAL") return "bg-gold/15 text-gold";
  if (s === "REJECTED" || s === "DISABLED" || s === "PAUSED")
    return "bg-red-500/15 text-red-400";
  return "bg-surface-muted text-muted";
}

export function WhatsAppManageClient() {
  const [data, setData] = useState<ManagePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [tplName, setTplName] = useState("support_hello");
  const [tplCategory, setTplCategory] = useState<
    "UTILITY" | "MARKETING" | "AUTHENTICATION"
  >("UTILITY");
  const [tplLanguage, setTplLanguage] = useState("en_US");
  const [tplHeader, setTplHeader] = useState("");
  const [tplBody, setTplBody] = useState(
    "Hi {{1}}, thanks for reaching {{2}}. How can we help you today?"
  );
  const [tplFooter, setTplFooter] = useState("Aarvanta OS");
  const [tplExamples, setTplExamples] = useState("Alex, Aarvanta");

  const [about, setAbout] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [websites, setWebsites] = useState("");
  const [vertical, setVertical] = useState("OTHER");

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/whatsapp/manage");
    const json = (await res.json()) as ManagePayload;
    if (!res.ok) {
      setError(json.error?.message ?? "Could not load WhatsApp Manager.");
      setData(null);
      return;
    }
    setData(json);
    setAbout(json.profile.about ?? "");
    setAddress(json.profile.address ?? "");
    setDescription(json.profile.description ?? "");
    setEmail(json.profile.email ?? "");
    setWebsites((json.profile.websites ?? []).join(", "));
    setVertical(json.profile.vertical ?? "OTHER");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch("/api/whatsapp/manage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as ManagePayload & {
        error?: { message?: string };
        template?: WhatsAppMessageTemplate;
        profile?: WhatsAppBusinessProfile;
        templates?: WhatsAppMessageTemplate[];
      };
      if (!res.ok) {
        setError(json.error?.message ?? "Action failed.");
        return;
      }
      if (json.templates && data) {
        setData({ ...data, templates: json.templates });
      }
      if (json.profile && data) {
        setData({ ...data, profile: json.profile });
      }
      if (body.action === "create_template") {
        setInfo(
          `Template “${(json.template as WhatsAppMessageTemplate | undefined)?.name ?? "created"}” submitted for Meta review.`
        );
      } else if (body.action === "delete_template") {
        setInfo("Template deleted.");
      } else if (body.action === "update_profile") {
        setInfo("Business profile updated.");
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (error && !data) {
    return <p className="text-sm text-red-400">{error}</p>;
  }
  if (!data) {
    return <p className="text-sm text-muted">Loading WhatsApp Manager…</p>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/whatsapp"
            className="mb-2 inline-flex items-center gap-1 text-xs text-muted hover:text-gold"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to WhatsApp OS
          </Link>
          <h1 className="text-xl font-semibold text-foreground">
            WhatsApp Manager
          </h1>
          <p className="mt-1 text-sm text-muted">
            Manage message templates, business profile, and phone assets for
            your WhatsApp Business Account.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={() => void load()}
        >
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {data.status === "simulate" ? (
        <p
          className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200"
          role="status"
        >
          Demo / simulate mode — changes stay in Aarvanta and are not sent to
          Meta. Set{" "}
          <code className="text-amber-100">APP_MODE=production</code> with a
          live access token and phone number ID for an App Review recording.
        </p>
      ) : null}
      {data.status === "not_configured" ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          WhatsApp management is not configured. Add{" "}
          <code>WHATSAPP_ACCESS_TOKEN</code> and{" "}
          <code>WHATSAPP_PHONE_NUMBER_ID</code>
          . Optionally set <code>WHATSAPP_BUSINESS_ACCOUNT_ID</code> if Graph
          cannot resolve the WABA automatically.
        </p>
      ) : null}
      {data.status === "live" ? (
        <p className="rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-xs text-success">
          Live — template and profile actions call Meta Graph API (Business
          Management).
        </p>
      ) : null}

      {error ? (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      {info ? (
        <p className="text-sm text-success" role="status">
          {info}
        </p>
      ) : null}

      <section className="rounded-xl border border-border bg-surface-elevated p-4">
        <div className="mb-3 flex items-center gap-2">
          <Phone className="h-4 w-4 text-gold" />
          <h2 className="text-sm font-semibold text-foreground">
            Phone numbers
          </h2>
        </div>
        {data.phones.length === 0 ? (
          <p className="text-sm text-muted">No phone numbers on this WABA.</p>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {data.phones.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"
              >
                <div>
                  <p className="font-medium text-foreground">
                    {p.display_phone_number ?? p.id}
                  </p>
                  <p className="text-xs text-muted">
                    {p.verified_name ?? "Unnamed"} · {p.quality_rating ?? "—"} ·{" "}
                    {p.code_verification_status ?? "—"}
                  </p>
                </div>
                <span className="text-[11px] text-muted">{p.id}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-border bg-surface-elevated p-4">
        <div className="mb-3 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-gold" />
          <h2 className="text-sm font-semibold text-foreground">
            Business profile
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs text-muted">
            About
            <input
              className="mt-1 w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground"
              value={about}
              maxLength={139}
              onChange={(e) => setAbout(e.target.value)}
            />
          </label>
          <label className="text-xs text-muted">
            Email
            <input
              type="email"
              className="mt-1 w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="text-xs text-muted sm:col-span-2">
            Description
            <textarea
              className="mt-1 w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <label className="text-xs text-muted">
            Address
            <input
              className="mt-1 w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </label>
          <label className="text-xs text-muted">
            Vertical
            <input
              className="mt-1 w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground"
              value={vertical}
              onChange={(e) => setVertical(e.target.value)}
            />
          </label>
          <label className="text-xs text-muted sm:col-span-2">
            Websites (comma-separated, max 2)
            <input
              className="mt-1 w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground"
              value={websites}
              onChange={(e) => setWebsites(e.target.value)}
              placeholder="https://aarvanta.com"
            />
          </label>
        </div>
        <Button
          className="mt-4"
          size="sm"
          disabled={busy}
          onClick={() =>
            void patch({
              action: "update_profile",
              about,
              address,
              description,
              email,
              vertical,
              websites: websites
                .split(",")
                .map((w) => w.trim())
                .filter(Boolean)
                .slice(0, 2),
            })
          }
        >
          Save business profile
        </Button>
      </section>

      <section className="rounded-xl border border-border bg-surface-elevated p-4">
        <div className="mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4 text-gold" />
          <h2 className="text-sm font-semibold text-foreground">
            Message templates
          </h2>
        </div>
        <p className="mb-4 text-xs text-muted">
          Create a template for Meta review. This is the primary App Review
          flow for <code>whatsapp_business_management</code>.
        </p>

        <div className="mb-6 grid gap-3 rounded-lg border border-border bg-surface p-3 sm:grid-cols-2">
          <label className="text-xs text-muted">
            Name (lowercase + underscores)
            <input
              className="mt-1 w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground"
              value={tplName}
              onChange={(e) => setTplName(e.target.value)}
            />
          </label>
          <label className="text-xs text-muted">
            Category
            <select
              className="mt-1 w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground"
              value={tplCategory}
              onChange={(e) =>
                setTplCategory(
                  e.target.value as "UTILITY" | "MARKETING" | "AUTHENTICATION"
                )
              }
            >
              <option value="UTILITY">Utility</option>
              <option value="MARKETING">Marketing</option>
              <option value="AUTHENTICATION">Authentication</option>
            </select>
          </label>
          <label className="text-xs text-muted">
            Language
            <input
              className="mt-1 w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground"
              value={tplLanguage}
              onChange={(e) => setTplLanguage(e.target.value)}
            />
          </label>
          <label className="text-xs text-muted">
            Example params (comma-separated for {"{{1}}"}, {"{{2}}"}, …)
            <input
              className="mt-1 w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground"
              value={tplExamples}
              onChange={(e) => setTplExamples(e.target.value)}
            />
          </label>
          <label className="text-xs text-muted sm:col-span-2">
            Header (optional)
            <input
              className="mt-1 w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground"
              value={tplHeader}
              onChange={(e) => setTplHeader(e.target.value)}
            />
          </label>
          <label className="text-xs text-muted sm:col-span-2">
            Body
            <textarea
              className="mt-1 w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground"
              rows={3}
              value={tplBody}
              onChange={(e) => setTplBody(e.target.value)}
            />
          </label>
          <label className="text-xs text-muted sm:col-span-2">
            Footer (optional)
            <input
              className="mt-1 w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground"
              value={tplFooter}
              onChange={(e) => setTplFooter(e.target.value)}
            />
          </label>
          <div className="sm:col-span-2">
            <Button
              size="sm"
              disabled={busy}
              onClick={() =>
                void patch({
                  action: "create_template",
                  name: tplName,
                  category: tplCategory,
                  language: tplLanguage,
                  bodyText: tplBody,
                  headerText: tplHeader || undefined,
                  footerText: tplFooter || undefined,
                  exampleParams: tplExamples
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
            >
              Create template for Meta review
            </Button>
          </div>
        </div>

        <ul className="divide-y divide-border-subtle overflow-hidden rounded-lg border border-border">
          {data.templates.length === 0 ? (
            <li className="px-3 py-4 text-sm text-muted">
              No templates yet. Create one above.
            </li>
          ) : (
            data.templates.map((t) => {
              const body = t.components?.find((c) => c.type === "BODY")?.text;
              return (
                <li
                  key={`${t.id}-${t.language}`}
                  className="flex flex-wrap items-start justify-between gap-3 px-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {t.name}{" "}
                      <span className="text-xs font-normal text-muted">
                        · {t.language} · {t.category}
                      </span>
                    </p>
                    {body ? (
                      <p className="mt-1 text-xs text-muted line-clamp-2">
                        {body}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${statusTone(t.status)}`}
                    >
                      {t.status}
                    </span>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={busy}
                      onClick={() =>
                        void patch({
                          action: "delete_template",
                          name: t.name,
                        })
                      }
                    >
                      Delete
                    </Button>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </section>
    </div>
  );
}
