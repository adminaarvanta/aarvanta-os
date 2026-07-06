import { crmNow } from "@/lib/data/crm-helpers";
import { getFinanceStore, getHrStore, getLegalStore } from "@/lib/data/platform-store";
import { getWorkflowRepository } from "@/lib/data/workflow-store";
import { publishDomainEvent } from "@/lib/events/publish";
import { postJournalEntry } from "@/lib/finance/ledger";
import {
  buildBalanceSheet,
  buildProfitAndLoss,
  buildTrialBalance,
} from "@/lib/finance/reports";
import { generateHrDocument } from "@/lib/hr/generate-document";
import { getIndustryKpis } from "@/lib/industry/kpis";
import { analyzeContractText, getLegalContractTemplate } from "@/lib/legal/analyze";
import { actorFromSession } from "@/lib/identity/from-session";
import { runUkPayroll } from "@/lib/payroll/run-payroll";
import { generateWorkflowFromIntent } from "@/lib/workflow/generate-from-intent";
import type { SessionContext } from "@/lib/tenant/context";
import type { BusinessActionResponse } from "@/lib/actions/intents";
import type { JournalLine } from "@/types/finance-ledger";
import type { LegalContractType } from "@/types/legal";
import type { HrDocumentType } from "@/types/platform-modules";

type HandlerResult = Promise<BusinessActionResponse>;

function success(
  result: Record<string, unknown>,
  extra?: Partial<BusinessActionResponse>
): BusinessActionResponse {
  return { status: "success", result, ...extra };
}

function fail(code: string, message: string): BusinessActionResponse {
  return { status: "error", error: { code, message } };
}

export async function handlePostJournalEntry(
  ctx: SessionContext,
  context: Record<string, unknown>
): HandlerResult {
  const scope = ctx.scope;
  const lines = context.lines as JournalLine[] | undefined;
  if (!Array.isArray(lines) || lines.length < 2) {
    return fail("INVALID_LINES", "Journal entry requires at least two lines.");
  }

  const entry = await postJournalEntry(scope, {
    date: typeof context.date === "string" ? context.date : crmNow().slice(0, 10),
    reference:
      typeof context.reference === "string" ? context.reference : `JE-${Date.now().toString().slice(-6)}`,
    description:
      typeof context.description === "string" ? context.description : "Manual journal entry",
    lines,
    source: "manual",
  });

  const event = await publishDomainEvent({
    scope,
    type: "invoice.created",
    actor: actorFromSession(ctx),
    entityType: "invoice",
    entityId: entry.id,
    payload: { journalEntryId: entry.id },
    source: "api",
  });

  return success({ journalEntryId: entry.id, href: "/finance" }, { eventId: event.id, auditId: event.id });
}

export async function handleGeneratePl(
  ctx: SessionContext,
  context: Record<string, unknown>
): HandlerResult {
  void context;
  const pl = await buildProfitAndLoss(ctx.scope);
  const balanceSheet = await buildBalanceSheet(ctx.scope);
  return success({
    profitAndLoss: pl,
    balanceSheet,
    href: "/finance",
  });
}

export async function handleReconcileAccount(
  ctx: SessionContext,
  context: Record<string, unknown>
): HandlerResult {
  const accountCode =
    typeof context.accountCode === "string" ? context.accountCode : "4100";
  const trial = await buildTrialBalance(ctx.scope);
  const row = trial.find((r) => r.accountCode === accountCode);
  if (!row) {
    return fail("ACCOUNT_NOT_FOUND", `No activity for account ${accountCode}.`);
  }

  const expected =
    typeof context.expectedBalance === "number" ? context.expectedBalance : row.balance;
  const variance = Math.round((row.balance - expected) * 100) / 100;

  return success({
    accountCode,
    ledgerBalance: row.balance,
    expectedBalance: expected,
    variance,
    reconciled: Math.abs(variance) < 0.01,
    message:
      Math.abs(variance) < 0.01
        ? `Account ${accountCode} reconciled.`
        : `Variance of £${variance.toFixed(2)} on account ${accountCode}.`,
  });
}

export async function handleRunPayroll(
  ctx: SessionContext,
  context: Record<string, unknown>
): HandlerResult {
  const result = await runUkPayroll(ctx.scope, {
    periodStart: typeof context.periodStart === "string" ? context.periodStart : undefined,
    periodEnd: typeof context.periodEnd === "string" ? context.periodEnd : undefined,
  });
  return success({
    payRunId: result.payRun.id,
    employeeCount: result.payRun.employeeCount,
    grossTotal: result.payRun.grossTotal,
    netTotal: result.payRun.netTotal,
    href: "/payroll",
  });
}

export async function handleGeneratePayslip(
  ctx: SessionContext,
  context: Record<string, unknown>
): HandlerResult {
  const employeeId = typeof context.employeeId === "string" ? context.employeeId : "";
  if (!employeeId) {
    return fail("MISSING_EMPLOYEE", "employeeId is required.");
  }

  const payslips = await getFinanceStore().listPayslips(ctx.scope);
  const payslip = payslips
    .filter((p) => p.employeeId === employeeId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

  if (!payslip) {
    return fail("NOT_FOUND", "No payslip found. Run payroll first.");
  }

  return success({ payslip, href: "/payroll" });
}

export async function handleAnalyzeContract(
  ctx: SessionContext,
  context: Record<string, unknown>
): HandlerResult {
  const content =
    typeof context.content === "string"
      ? context.content
      : typeof context.text === "string"
        ? context.text
        : "";
  if (!content.trim()) {
    return fail("MISSING_CONTENT", "Contract content is required.");
  }

  const analysis = analyzeContractText(content);
  return success({
    ...analysis,
    href: "/legal",
  });
}

export async function handleGenerateContract(
  ctx: SessionContext,
  context: Record<string, unknown>
): HandlerResult {
  const type = (typeof context.type === "string"
    ? context.type
    : "nda") as LegalContractType;
  const brandName =
    typeof context.brandName === "string" ? context.brandName : "Your Company";
  const counterparty =
    typeof context.counterparty === "string" ? context.counterparty : "Counterparty Ltd";
  const title =
    typeof context.title === "string" ? context.title : `${type.toUpperCase()} — ${counterparty}`;

  const content = getLegalContractTemplate(type, { brandName, counterparty });
  const analysis = analyzeContractText(content);
  const now = crmNow();

  const contract = await getLegalStore().create({
    ...ctx.scope,
    title,
    type,
    counterparty,
    content,
    status: "draft",
    riskScore: analysis.riskScore,
    riskSummary: analysis.riskSummary,
    clauses: analysis.clauses,
    createdAt: now,
    updatedAt: now,
  });

  return success({ contractId: contract.id, riskScore: analysis.riskScore, href: "/legal" });
}

export async function handleGenerateHrDocument(
  ctx: SessionContext,
  context: Record<string, unknown>
): HandlerResult {
  const type = (typeof context.type === "string"
    ? context.type
    : "policy_memo") as HrDocumentType;
  const subjectName =
    typeof context.subjectName === "string" ? context.subjectName : "Employee";
  const title =
    typeof context.title === "string" ? context.title : `HR document — ${subjectName}`;
  const companyName =
    typeof context.companyName === "string" ? context.companyName : "Your Company";

  const content = await generateHrDocument({
    type,
    title,
    subjectName,
    instructions:
      typeof context.instructions === "string"
        ? context.instructions
        : "Standard company policy document.",
    contextFields:
      context.contextFields && typeof context.contextFields === "object"
        ? (context.contextFields as Record<string, string>)
        : {},
    companyName,
    authorName: ctx.name,
  });

  const doc = await getHrStore().createDocument({
    ...ctx.scope,
    type,
    title,
    subjectName,
    status: "draft",
    instructions: typeof context.instructions === "string" ? context.instructions : "",
    contextFields: {},
    content,
    createdByName: ctx.name,
    createdAt: crmNow(),
    updatedAt: crmNow(),
  });

  return success({ documentId: doc.id, href: "/hr" });
}

export async function handleHireEmployee(
  ctx: SessionContext,
  context: Record<string, unknown>
): HandlerResult {
  const name = typeof context.name === "string" ? context.name : "New Employee";
  const department =
    typeof context.department === "string" ? context.department : "General";
  const role = typeof context.role === "string" ? context.role : "Team Member";
  const annualSalaryGbp =
    typeof context.annualSalaryGbp === "number" ? context.annualSalaryGbp : 36_000;

  const employee = await getHrStore().createEmployee({
    ...ctx.scope,
    name,
    department,
    role,
    startDate: crmNow().slice(0, 10),
    leaveBalance: 25,
    email:
      typeof context.email === "string"
        ? context.email
        : `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
    annualSalaryGbp,
  });

  const event = await publishDomainEvent({
    scope: ctx.scope,
    type: "contact.created",
    actor: actorFromSession(ctx),
    entityType: "contact",
    entityId: employee.id,
    payload: { intent: "hire_employee", name },
    source: "api",
  });

  return success(
    { employeeId: employee.id, href: "/hr" },
    { eventId: event.id, auditId: event.id }
  );
}

export async function handleStartWorkflow(
  ctx: SessionContext,
  context: Record<string, unknown>
): HandlerResult {
  const intent =
    typeof context.workflowIntent === "string"
      ? context.workflowIntent
      : typeof context.description === "string"
        ? context.description
        : "automate lead follow-up";

  const draft = generateWorkflowFromIntent(intent);
  const workflow = await getWorkflowRepository().createWorkflow(draft, ctx.scope);

  return success({
    workflowId: workflow.id,
    name: workflow.name,
    steps: workflow.steps.length,
    href: `/workflows/${workflow.id}`,
  });
}

export async function handleGetIndustryKpis(
  ctx: SessionContext,
  context: Record<string, unknown>
): HandlerResult {
  const industryProfileId =
    typeof context.industryProfileId === "string"
      ? context.industryProfileId
      : "retail_ecommerce";

  const kpis = getIndustryKpis(industryProfileId);
  return success(kpis);
}
