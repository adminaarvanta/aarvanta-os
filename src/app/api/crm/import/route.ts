import { NextResponse } from "next/server";
import { z } from "zod";
import { recordMutationEvent } from "@/lib/api/mutation-events";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getTenantRepository } from "@/lib/data/tenant-store";
import { getField, parseDelimitedSheet, type SheetRow } from "@/lib/crm/sheet-parse";
import type {
  CreateCompanyInput,
  CreateContactInput,
  CreateDealInput,
  CreatePipelineInput,
  CreateTaskInput,
} from "@/lib/data/crm-repository";
import { normalizeEmail, normalizePhone } from "@/lib/data/conversation-helpers";
import { getSessionContext } from "@/lib/tenant/context";
import { unauthorized } from "@/lib/api/request";
import type {
  ContactTag,
  DealStatus,
  TaskPriority,
  TaskStatus,
} from "@/types/crm";
import * as XLSX from "xlsx";

export const runtime = "nodejs";

const metaSchema = z.object({
  entity: z.enum([
    "contacts",
    "companies",
    "leads",
    "deals",
    "tasks",
    "pipelines",
  ]),
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

function parseTags(raw?: string, fallback: ContactTag[] = ["prospect"]): ContactTag[] {
  if (!raw) return fallback;
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
  return tags.length > 0 ? tags : fallback;
}

function parseLeadTag(raw?: string): ContactTag {
  const value = (raw ?? "prospect").trim().toLowerCase().replace(/\s+/g, "_");
  if (value === "hot_lead" || value === "hot") return "hot_lead";
  if (value === "follow_up") return "follow_up";
  return "prospect";
}

function parseDealStatus(raw?: string): DealStatus {
  const value = (raw ?? "open").trim().toLowerCase();
  if (value === "won" || value === "lost") return value;
  return "open";
}

function parseTaskPriority(raw?: string): TaskPriority {
  const value = (raw ?? "medium").trim().toLowerCase();
  if (value === "low" || value === "high") return value;
  return "medium";
}

function parseTaskStatus(raw?: string): TaskStatus {
  const value = (raw ?? "todo").trim().toLowerCase().replace(/\s+/g, "_");
  if (value === "in_progress" || value === "inprogress" || value === "doing") {
    return "in_progress";
  }
  if (value === "done" || value === "complete" || value === "completed") {
    return "done";
  }
  return "todo";
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
  } else if (meta.data.entity === "pipelines") {
    const existing = await crm.listPipelines(scope);
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!;
      const pipelineName = getField(row, ["name", "pipeline", "pipeline name"]);
      if (!pipelineName) {
        skipped++;
        errors.push(`Row ${i + 2}: missing pipeline name`);
        continue;
      }
      const stagesRaw = getField(row, ["stages", "stage", "stage names"]);
      const stageNames = (stagesRaw ?? "New, Qualified, Proposal, Negotiation, Won")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const stages = stageNames.map((stageName, idx) => ({
        name: stageName,
        order: idx,
        probability: Math.min(
          100,
          Math.round(((idx + 1) / stageNames.length) * 100)
        ),
      }));
      const payload: CreatePipelineInput = { name: pipelineName, stages };
      const match = existing.find(
        (p) => p.name.toLowerCase() === pipelineName.toLowerCase()
      );

      try {
        if (match && meta.data.updateOnDuplicate) {
          await crm.updatePipeline(
            match.id,
            {
              name: pipelineName,
              stages: stages.map((s, idx) => ({
                id: match.stages[idx]?.id ?? `stage_${idx}`,
                name: s.name,
                order: s.order,
                probability: s.probability,
              })),
            },
            scope
          );
          updated++;
        } else if (match) {
          skipped++;
        } else {
          const pipeline = await crm.createPipeline(payload, scope);
          existing.push(pipeline);
          created++;
        }
      } catch (error) {
        skipped++;
        errors.push(
          `Row ${i + 2}: ${error instanceof Error ? error.message : "failed"}`
        );
      }
    }
  } else if (meta.data.entity === "deals") {
    const [deals, pipelines, contacts, companies] = await Promise.all([
      crm.listDeals(scope),
      crm.listPipelines(scope),
      crm.listContacts(scope),
      crm.listCompanies(scope),
    ]);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!;
      const title = getField(row, ["title", "deal", "deal title", "name"]);
      if (!title) {
        skipped++;
        errors.push(`Row ${i + 2}: missing deal title`);
        continue;
      }

      const pipelineName = getField(row, ["pipeline", "pipeline name"]);
      let pipeline =
        (pipelineName
          ? pipelines.find((p) => p.name.toLowerCase() === pipelineName.toLowerCase())
          : undefined) ?? pipelines[0];
      if (!pipeline) {
        skipped++;
        errors.push(`Row ${i + 2}: no pipeline available`);
        continue;
      }

      const stageName = getField(row, ["stage", "stage name"]);
      const stage =
        (stageName
          ? pipeline.stages.find((s) => s.name.toLowerCase() === stageName.toLowerCase())
          : undefined) ?? pipeline.stages[0];
      if (!stage) {
        skipped++;
        errors.push(`Row ${i + 2}: pipeline has no stages`);
        continue;
      }

      const valueRaw = getField(row, ["value", "amount", "deal value"]);
      const value = Number(valueRaw ?? "0") || 0;
      const currency = getField(row, ["currency", "curr"]) ?? "GBP";
      const status = parseDealStatus(getField(row, ["status", "deal status"]));
      const expectedCloseDate = getField(row, [
        "expected close date",
        "close date",
        "expectedclose",
      ]);
      const notes = getField(row, ["notes", "note"]);
      const contactEmail = getField(row, [
        "contact email",
        "email",
        "contact",
      ]);
      const companyName = getField(row, [
        "company",
        "company name",
        "account",
      ]);

      let contactId: string | undefined;
      if (contactEmail) {
        const email = normalizeEmail(contactEmail);
        const contact = contacts.find(
          (c) => c.email && normalizeEmail(c.email) === email
        );
        contactId = contact?.id;
      }

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

      const match = deals.find(
        (d) =>
          d.title.toLowerCase() === title.toLowerCase() &&
          d.pipelineId === pipeline!.id
      );

      const payload: CreateDealInput = {
        title,
        pipelineId: pipeline.id,
        stageId: stage.id,
        contactId,
        accountId,
        value,
        currency,
        probability: stage.probability,
        expectedCloseDate,
        status,
        notes,
      };

      try {
        if (match && meta.data.updateOnDuplicate) {
          await crm.updateDeal(
            match.id,
            {
              title: payload.title,
              stageId: payload.stageId,
              contactId: payload.contactId,
              accountId: payload.accountId,
              value: payload.value,
              probability: payload.probability,
              expectedCloseDate: payload.expectedCloseDate,
              status: payload.status,
              notes: payload.notes,
            },
            scope
          );
          updated++;
        } else if (match) {
          skipped++;
        } else {
          const deal = await crm.createDeal(payload, scope);
          deals.push(deal);
          created++;
          await recordMutationEvent({
            ctx,
            type: "deal.created",
            entityType: "deal",
            entityId: deal.id,
            payload: { source: "csv_import", title: deal.title },
          });
        }
      } catch (error) {
        skipped++;
        errors.push(
          `Row ${i + 2}: ${error instanceof Error ? error.message : "failed"}`
        );
      }
    }
  } else if (meta.data.entity === "tasks") {
    const [tasks, contacts, companies, members] = await Promise.all([
      crm.listTasks(scope),
      crm.listContacts(scope),
      crm.listCompanies(scope),
      getTenantRepository().listMembers(scope),
    ]);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!;
      const title = getField(row, ["title", "task", "task title", "name"]);
      if (!title) {
        skipped++;
        errors.push(`Row ${i + 2}: missing task title`);
        continue;
      }

      const description = getField(row, ["description", "details", "notes"]);
      const priority = parseTaskPriority(getField(row, ["priority"]));
      const status = parseTaskStatus(getField(row, ["status"]));
      const dueDate = getField(row, ["due date", "due", "deadline"]);
      const assigneeEmail = getField(row, [
        "assignee email",
        "assigned to",
        "assignee",
        "owner email",
      ]);
      const contactEmail = getField(row, ["contact email", "email", "contact"]);
      const companyName = getField(row, ["company", "company name", "account"]);

      let assignedTo: string | undefined;
      if (assigneeEmail) {
        const email = normalizeEmail(assigneeEmail);
        const member = members.find(
          (m) => m.email && normalizeEmail(m.email) === email
        );
        assignedTo = member?.userId;
      }

      let contactId: string | undefined;
      if (contactEmail) {
        const email = normalizeEmail(contactEmail);
        contactId = contacts.find(
          (c) => c.email && normalizeEmail(c.email) === email
        )?.id;
      }

      let accountId: string | undefined;
      if (companyName) {
        accountId = companies.find(
          (c) => c.name.toLowerCase() === companyName.toLowerCase()
        )?.id;
      }

      const match = tasks.find(
        (t) =>
          t.title.toLowerCase() === title.toLowerCase() &&
          (t.dueDate ?? "") === (dueDate ?? "")
      );

      const payload: CreateTaskInput = {
        title,
        description,
        priority,
        status,
        dueDate,
        assignedTo,
        contactId,
        accountId,
        source: "manual",
      };

      try {
        if (match && meta.data.updateOnDuplicate) {
          await crm.updateTask(
            match.id,
            {
              title: payload.title,
              description: payload.description,
              priority: payload.priority,
              status: payload.status,
              dueDate: payload.dueDate,
              assignedTo: payload.assignedTo,
              contactId: payload.contactId,
              accountId: payload.accountId,
            },
            scope
          );
          updated++;
        } else if (match) {
          skipped++;
        } else {
          const task = await crm.createTask(payload, scope);
          tasks.push(task);
          created++;
        }
      } catch (error) {
        skipped++;
        errors.push(
          `Row ${i + 2}: ${error instanceof Error ? error.message : "failed"}`
        );
      }
    }
  } else {
    // contacts + leads
    const isLead = meta.data.entity === "leads";
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
      const phone = phoneRaw
        ? `+${normalizePhone(phoneRaw).replace(/^\+/, "")}`
        : undefined;
      const jobTitle = getField(row, ["job title", "title", "role", "position"]);
      const companyName = getField(row, [
        "company",
        "company name",
        "account",
        "organisation",
        "organization",
      ]);
      const notes = getField(row, ["notes", "note"]);

      let tags: ContactTag[];
      if (isLead) {
        const leadTag = parseLeadTag(
          getField(row, ["lead tag", "tag", "tags", "lead type"])
        );
        tags = [leadTag];
      } else {
        tags = parseTags(getField(row, ["tags", "tag"]));
      }

      const leadScoreRaw = getField(row, ["lead score", "score"]);
      const leadScore = leadScoreRaw ? Number(leadScoreRaw) : undefined;

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
              ...(typeof leadScore === "number" && !Number.isNaN(leadScore)
                ? {
                    leadScore,
                    leadScoreUpdatedAt: new Date().toISOString(),
                  }
                : {}),
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
          if (typeof leadScore === "number" && !Number.isNaN(leadScore)) {
            await crm.updateContact(
              contact.id,
              {
                leadScore,
                leadScoreUpdatedAt: new Date().toISOString(),
              },
              scope
            );
          }
          contacts.push(contact);
          created++;
          await recordMutationEvent({
            ctx,
            type: "contact.created",
            entityType: "contact",
            entityId: contact.id,
            payload: { source: "csv_import", lead: isLead },
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
