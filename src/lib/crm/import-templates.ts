import type { SheetRow } from "@/lib/crm/sheet-parse";

export type CrmImportEntity =
  | "contacts"
  | "companies"
  | "leads"
  | "deals"
  | "tasks"
  | "pipelines";

export const CRM_IMPORT_COLUMNS: Record<
  CrmImportEntity,
  { headers: string[]; sample: string[][]; description: string }
> = {
  contacts: {
    description:
      "First Name, Last Name (or Name), Email, Phone, Job Title, Company, Tags, Notes",
    headers: [
      "First Name",
      "Last Name",
      "Email",
      "Phone",
      "Job Title",
      "Company",
      "Tags",
      "Notes",
    ],
    sample: [
      [
        "Ada",
        "Lovelace",
        "ada@example.com",
        "+447700900123",
        "CTO",
        "Analytical Engines Ltd",
        "prospect",
        "Met at conference",
      ],
    ],
  },
  companies: {
    description: "Name, Domain, Website, Industry, Size, Address, Tags, Notes",
    headers: [
      "Name",
      "Domain",
      "Website",
      "Industry",
      "Size",
      "Address",
      "Tags",
      "Notes",
    ],
    sample: [
      [
        "Analytical Engines Ltd",
        "analytical.example",
        "https://analytical.example",
        "Technology",
        "11-50",
        "London, UK",
        "prospect",
        "Target account",
      ],
    ],
  },
  leads: {
    description:
      "First Name, Last Name (or Name), Email, Phone, Job Title, Company, Lead Tag (prospect|hot_lead), Lead Score, Notes",
    headers: [
      "First Name",
      "Last Name",
      "Email",
      "Phone",
      "Job Title",
      "Company",
      "Lead Tag",
      "Lead Score",
      "Notes",
    ],
    sample: [
      [
        "Grace",
        "Hopper",
        "grace@example.com",
        "+447700900456",
        "VP Engineering",
        "Navy Systems",
        "hot_lead",
        "80",
        "Requested demo",
      ],
    ],
  },
  deals: {
    description:
      "Title, Pipeline, Stage, Value, Currency, Contact Email, Company, Status (open|won|lost), Expected Close Date (YYYY-MM-DD), Notes",
    headers: [
      "Title",
      "Pipeline",
      "Stage",
      "Value",
      "Currency",
      "Contact Email",
      "Company",
      "Status",
      "Expected Close Date",
      "Notes",
    ],
    sample: [
      [
        "Website rebuild",
        "Sales",
        "Proposal",
        "12000",
        "GBP",
        "grace@example.com",
        "Navy Systems",
        "open",
        "2026-09-30",
        "Include CMS training",
      ],
    ],
  },
  tasks: {
    description:
      "Title, Description, Priority (low|medium|high), Status (todo|in_progress|done), Due Date (YYYY-MM-DD), Assignee Email, Contact Email, Company",
    headers: [
      "Title",
      "Description",
      "Priority",
      "Status",
      "Due Date",
      "Assignee Email",
      "Contact Email",
      "Company",
    ],
    sample: [
      [
        "Send proposal",
        "Follow up after discovery call",
        "high",
        "todo",
        "2026-08-01",
        "",
        "grace@example.com",
        "Navy Systems",
      ],
    ],
  },
  pipelines: {
    description: "Name, Stages (comma-separated stage names)",
    headers: ["Name", "Stages"],
    sample: [["Enterprise Sales", "New, Qualified, Proposal, Negotiation, Won"]],
  },
};

export function templateRows(entity: CrmImportEntity): SheetRow[] {
  const def = CRM_IMPORT_COLUMNS[entity];
  return def.sample.map((values) => {
    const row: SheetRow = {};
    def.headers.forEach((header, i) => {
      row[header] = values[i] ?? "";
    });
    return row;
  });
}
