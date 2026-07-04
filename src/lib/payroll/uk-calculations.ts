import type { UkPayrollCalculation } from "@/types/payroll";

/** Simplified UK 2024/25 monthly payroll (illustrative — not tax advice). */
export function calculateUkMonthlyPayroll(annualSalaryGbp: number): UkPayrollCalculation {
  const grossPeriod = Math.round((annualSalaryGbp / 12) * 100) / 100;
  const personalAllowance = 12_570;
  const taxableAnnual = Math.max(0, annualSalaryGbp - personalAllowance);

  let incomeTaxAnnual = 0;
  const basicBand = 37_700;
  const higherBand = 125_140 - personalAllowance - basicBand;

  if (taxableAnnual <= basicBand) {
    incomeTaxAnnual = taxableAnnual * 0.2;
  } else {
    incomeTaxAnnual = basicBand * 0.2 + Math.min(taxableAnnual - basicBand, higherBand) * 0.4;
  }

  const incomeTax = Math.round((incomeTaxAnnual / 12) * 100) / 100;

  const niThresholdMonthly = 1_048;
  const niUpperMonthly = 4_189;
  const niable = Math.max(0, grossPeriod - niThresholdMonthly);
  const employeeNi =
    Math.round(
      (Math.min(niable, niUpperMonthly - niThresholdMonthly) * 0.08 +
        Math.max(0, grossPeriod - niUpperMonthly) * 0.02) *
        100
    ) / 100;
  const employerNi = Math.round(niable * 0.138 * 100) / 100;

  const netPay = Math.round((grossPeriod - incomeTax - employeeNi) * 100) / 100;

  return {
    grossAnnual: annualSalaryGbp,
    grossPeriod,
    incomeTax,
    employeeNi,
    employerNi,
    netPay,
  };
}
