import type { TenantScope } from "@/types/communication";

export type PayRunStatus = "draft" | "processed" | "paid";

export type PayRun = TenantScope & {
  id: string;
  periodStart: string;
  periodEnd: string;
  status: PayRunStatus;
  employeeCount: number;
  grossTotal: number;
  netTotal: number;
  taxTotal: number;
  niTotal: number;
  currency: string;
  journalEntryId?: string;
  createdAt: string;
};

export type Payslip = TenantScope & {
  id: string;
  payRunId: string;
  employeeId: string;
  employeeName: string;
  grossPay: number;
  incomeTax: number;
  employeeNi: number;
  employerNi: number;
  netPay: number;
  currency: string;
  createdAt: string;
};

export type UkPayrollCalculation = {
  grossAnnual: number;
  grossPeriod: number;
  incomeTax: number;
  employeeNi: number;
  employerNi: number;
  netPay: number;
};
