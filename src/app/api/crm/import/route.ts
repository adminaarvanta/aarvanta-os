import { NextResponse } from "next/server";
import { z } from "zod";
import { recordMutationEvent } from "@/lib/api/mutation-events";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getField, parseDelimitedSheet, type SheetRow } from "@/lib/crm/sheet-parse";
import type {
  CreateCompanyInput,
  CreateContactInput,
} from "@/lib/data/crm-repository";
import { normalizeEmail, normalizePhone } from "@/lib/data/conversation-helpers";
import { getSessionContext } from "@/lib/tenant/context";
import { unauthorized } from "@/lib/api/request";
import type { ContactTag } from "@/types/crm";
import * as XLSX from "xlsx";

export const runtime = "nodejs";

const metaSchema = z.object({
  entity: z.enum(["contacts", "companies"]),
  updateOnDuplicate: z.boolean().default(true),
});

function rowsFromWorkbook(buffer: ArrayBuffer): SheetRow[] {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
  });
  return raw.map((row) => {
    const out: SheetRow = {};
    for (const [key, value] of Object.entries(row)) {
      out[key.trim().toLowerCase().replace(/[\s_-]+/g, " ").replace(/[^\w\s]/g, "").trim()] =
        String(value ?? "").trim();
    }
    return out;
  });
}

function splitName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0]!, lastName: "-" };
  return {
    firstName: parts[0]!,
    lastName: parts.slice(1).join(" "),
  };
}

function parseTags(raw?: string): ContactTag[] {
  if (!raw) return ["prospect"];
  const allowed = new Set<ContactTag>([
    "hot_lead",
    "vip",
    "customer",
    "prospect",
    "partner",
    "follow_up",
  ]);
  const tags = raw
    .split(/[|;,]/)
    .map((t) => t.trim().toLowerCase().replace(/\s+/g, "_") as ContactTag)
    .filter((t) => allowed.has(t));
  return tags.length > 0 ? tags : ["prospect"];
}

export async function POST(req: Request) {
  let ctx;
  try {
    ctx = await getSessionContext();
  } catch {
    return unauthorized();
  }

  const form = await req.formData();
  const file = form.get("file");
  const entityRaw = String(form.get("entity") ?? "contacts");
  const updateOnDuplicate = String(form.get("updateOnDuplicate") ?? "true") !== "false";

  const meta = metaSchema.safeParse({ entity: entityRaw, updateOnDuplicate });
  if (!meta.success) {
    return NextResponse.json({ error: "Invalid import options" }, { status: 400 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const name = file.name.toLowerCase();
  let rows: SheetRow[] = [];
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    rows = rowsFromWorkbook(await file.arrayBuffer());
  } else {
    const text = await file.text();
    rows = parseDelimitedSheet(text).rows;
  }
  if (rows.length === 0) {
    return NextResponse.json({ error: "No data rows found" }, { status: 400 });
  }

  const crm = getCrmRepository();
  const scope = ctx.scope;
  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  if (meta.data.entity === "companies") {
    const existing = await crm.listCompanies(scope);
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!;
      const companyName = getField(row, ["name", "company", "company name", "account"]);
      if (!companyName) {
        skipped++;
        errors.push(`Row ${i + 2}: missing company name`);
        continue;
      }
      const domain = getField(row, ["domain", "website domain"]);
      const website = getField(row, ["website", "url"]);
      const industry = getField(row, ["industry", "sector"]);
      const size = getField(row, ["size", "company size", "employees"]);
      const address = getField(row, ["address", "location"]);
      const notes = getField(row, ["notes", "note"]);
      const tags = parseTags(getField(row, ["tags", "tag"]));

      const match = existing.find(
        (c) =>
          c.name.toLowerCase() === companyName.toLowerCase() ||
          (domain && c.domain?.toLowerCase() === domain.toLowerCase())
      );

      const payload: CreateCompanyInput = {
        name: companyName,
        domain,
        website,
        industry,
        size,
        address,
        notes,
        tags,
      };

      try {
        if (match && meta.data.updateOnDuplicate) {
          await crm.updateCompany(
            match.id,
            {
              name: payload.name,
              domain: payload.domain,
              website: payload.website,
              industry: payload.industry,
              size: payload.size,
              address: payload.address,
              notes: payload.notes,
              tags: payload.tags,
            },
            scope
          );
          updated++;
          await recordMutationEvent({
            ctx,
            type: "company.updated",
            entityType: "company",
            entityId: match.id,
            payload: { source: "csv_import" },
          });
        } else if (match) {
          skipped++;
        } else {
          const company = await crm.createCompany(payload, scope);
          existing.push(company);
          created++;
          await recordMutationEvent({
            ctx,
            type: "company.created",
            entityType: "company",
            entityId: company.id,
            payload: { source: "csv_import", name: company.name },
          });
        }
      } catch (error) {
        skipped++;
        errors.push(
          `Row ${i + 2}: ${error instanceof Error ? error.message : "failed"}`
        );
      }
    }
  } else {
    const [contacts, companies] = await Promise.all([
      crm.listContacts(scope),
      crm.listCompanies(scope),
    ]);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!;
      const fullName = getField(row, ["name", "full name", "contact"]);
      let firstName = getField(row, ["first name", "firstname", "first"]);
      let lastName = getField(row, ["last name", "lastname", "last", "surname"]);
      if ((!firstName || !lastName) && fullName) {
        const split = splitName(fullName);
        firstName = firstName || split.firstName;
        lastName = lastName || split.lastName;
      }
      if (!firstName || !lastName) {
        skipped++;
        errors.push(`Row ${i + 2}: missing name`);
        continue;
      }

      const emailRaw = getField(row, ["email", "email address", "e-mail"]);
      const phoneRaw = getField(row, ["phone", "mobile", "telephone", "phone number"]);
      const email = emailRaw ? normalizeEmail(emailRaw) : undefined;
      const phone = phoneRaw ? `+${normalizePhone(phoneRaw).replace(/^\+/, "")}` : undefined;
      const jobTitle = getField(row, ["job title", "title", "role", "position"]);
      const companyName = getField(row, ["company", "company name", "account", "organisation", "organization"]);
      const notes = getField(row, ["notes", "note"]);
      const tags = parseTags(getField(row, ["tags", "tag"]));

      let accountId: string | undefined;
      if (companyName) {
        let company = companies.find(
          (c) => c.name.toLowerCase() === companyName.toLowerCase()
        );
        if (!company) {
          company = await crm.createCompany(
            { name: companyName, tags: ["prospect"] },
            scope
          );
          companies.push(company);
        }
        accountId = company.id;
      }

      const match = contacts.find((c) => {
        if (email && c.email && normalizeEmail(c.email) === email) return true;
        if (phone && c.phone && normalizePhone(c.phone) === normalizePhone(phone)) {
          return true;
        }
        return false;
      });

      const payload: CreateContactInput = {
        firstName,
        lastName,
        email,
        phone,
        jobTitle,
        accountId,
        notes,
        tags,
      };

      try {
        if (match && meta.data.updateOnDuplicate) {
          await crm.updateContact(
            match.id,
            {
              firstName: payload.firstName,
              lastName: payload.lastName,
              email: payload.email,
              phone: payload.phone,
              jobTitle: payload.jobTitle,
              accountId: payload.accountId,
              notes: payload.notes,
              tags: payload.tags,
            },
            scope
          );
          updated++;
          await recordMutationEvent({
            ctx,
            type: "contact.updated",
            entityType: "contact",
            entityId: match.id,
            payload: { source: "csv_import" },
          });
        } else if (match) {
          skipped++;
        } else {
          const contact = await crm.createContact(payload, scope);
          contacts.push(contact);
          created++;
          await recordMutationEvent({
            ctx,
            type: "contact.created",
            entityType: "contact",
            entityId: contact.id,
            payload: { source: "csv_import" },
          });
        }
      } catch (error) {
        skipped++;
        errors.push(
          `Row ${i + 2}: ${error instanceof Error ? error.message : "failed"}`
        );
      }
    }
  }

  return NextResponse.json({
    ok: true,
    entity: meta.data.entity,
    created,
    updated,
    skipped,
    errors: errors.slice(0, 25),
  });
}
