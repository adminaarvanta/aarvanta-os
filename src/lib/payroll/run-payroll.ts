import { crmNow } from "@/lib/data/crm-helpers";
import { getFinanceStore, getHrStore } from "@/lib/data/platform-store";
import { postJournalEntry } from "@/lib/finance/ledger";
import { calculateUkMonthlyPayroll } from "@/lib/payroll/uk-calculations";
import { publishDomainEvent } from "@/lib/events/publish";
import { systemActor } from "@/lib/identity/from-session";
import type { TenantScope } from "@/types/communication";
import type { PayRun, Payslip } from "@/types/payroll";

const DEFAULT_ANNUAL_SALARY = 36_000;

export async function runUkPayroll(
  scope: TenantScope,
  input?: { periodStart?: string; periodEnd?: string }
): Promise<{ payRun: PayRun; payslips: Payslip[] }> {
  const hr = getHrStore();
  const payroll = getFinanceStore();
  const employees = await hr.listEmployees(scope);

  if (employees.length === 0) {
    throw new Error("No employees on roster. Add employees in HR OS first.");
  }

  const now = crmNow();
  const periodEnd = input?.periodEnd ?? now.slice(0, 10);
  const periodStart =
    input?.periodStart ??
    new Date(new Date(periodEnd).setMonth(new Date(periodEnd).getMonth() - 1))
      .toISOString()
      .slice(0, 10);

  const payRun = await payroll.createPayRun({
    ...scope,
    periodStart,
    periodEnd,
    status: "draft",
    employeeCount: 0,
    grossTotal: 0,
    netTotal: 0,
    taxTotal: 0,
    niTotal: 0,
    currency: "GBP",
    createdAt: now,
  });

  const payslips: Payslip[] = [];
  let grossTotal = 0;
  let netTotal = 0;
  let taxTotal = 0;
  let niTotal = 0;

  for (const employee of employees) {
    const annual =
      typeof employee.annualSalaryGbp === "number"
        ? employee.annualSalaryGbp
        : DEFAULT_ANNUAL_SALARY;
    const calc = calculateUkMonthlyPayroll(annual);

    const payslip = await payroll.createPayslip({
      ...scope,
      payRunId: payRun.id,
      employeeId: employee.id,
      employeeName: employee.name,
      grossPay: calc.grossPeriod,
      incomeTax: calc.incomeTax,
      employeeNi: calc.employeeNi,
      employerNi: calc.employerNi,
      netPay: calc.netPay,
      currency: "GBP",
      createdAt: now,
    });

    grossTotal += calc.grossPeriod;
    netTotal += calc.netPay;
    taxTotal += calc.incomeTax;
    niTotal += calc.employeeNi + calc.employerNi;
    payslips.push(payslip);
  }

  const journal = await postJournalEntry(scope, {
    date: periodEnd,
    reference: `PAY-${payRun.id.slice(-6)}`,
    description: `Payroll ${periodStart} to ${periodEnd}`,
    source: "payroll",
    sourceId: payRun.id,
    lines: [
      { accountCode: "3000", debit: grossTotal, credit: 0, description: "Salaries expense" },
      { accountCode: "5200", debit: 0, credit: taxTotal + niTotal, description: "PAYE/NI" },
      { accountCode: "4000", debit: 0, credit: netTotal, description: "Net pay liability" },
    ],
  });

  const updatedPayRun = await payroll.setPayRun({
    ...payRun,
    status: "processed",
    employeeCount: employees.length,
    grossTotal: Math.round(grossTotal * 100) / 100,
    netTotal: Math.round(netTotal * 100) / 100,
    taxTotal: Math.round(taxTotal * 100) / 100,
    niTotal: Math.round(niTotal * 100) / 100,
    journalEntryId: journal.id,
  });

  await publishDomainEvent({
    scope,
    type: "payroll.processed",
    actor: systemActor(),
    entityType: "invoice",
    entityId: payRun.id,
    payload: { grossTotal: updatedPayRun.grossTotal, employeeCount: employees.length },
    source: "system",
  });

  return { payRun: updatedPayRun, payslips };
}
