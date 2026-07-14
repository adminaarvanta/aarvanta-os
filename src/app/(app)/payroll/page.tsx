import { Banknote } from "lucide-react";
import { PayrollRunButton } from "@/components/payroll/payroll-run-button";
import { CardList, ModulePageShell, StatGrid } from "@/components/platform/module-page-shell";
import { getFinanceStore, getHrStore } from "@/lib/data/platform-store";
import { getTenantScope } from "@/lib/tenant/context";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function PayrollPage() {
  const scope = await getTenantScope();
  const finance = getFinanceStore();
  const [payRuns, payslips, employees] = await Promise.all([
    finance.listPayRuns(scope),
    finance.listPayslips(scope),
    getHrStore().listEmployees(scope),
  ]);

  const latestRun = payRuns.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

  return (
    <ModulePageShell
      icon={Banknote}
      title="Payroll OS"
      description="UK PAYE/NI payroll runs, payslips, and ledger integration."
    >
      <div className="space-y-8">
        <PayrollRunButton />

        <StatGrid
          items={[
            { label: "Employees", value: employees.length, sub: "On roster" },
            { label: "Pay runs", value: payRuns.length, sub: "All time" },
            { label: "Payslips", value: payslips.length, sub: "Generated" },
            {
              label: "Latest gross",
              value: latestRun ? formatCurrency(latestRun.grossTotal) : "—",
              sub: latestRun?.status ?? "No runs yet",
            },
          ]}
        />

        <section>
          <h3 className="mb-3 text-sm font-semibold text-foreground">Pay runs</h3>
          <CardList
            items={payRuns.map((run) => ({
              id: run.id,
              title: `${run.periodStart} → ${run.periodEnd}`,
              body: `${run.employeeCount} employees · ${formatCurrency(run.grossTotal)} gross`,
              meta: `Net ${formatCurrency(run.netTotal)} · Tax ${formatCurrency(run.taxTotal)}`,
              badge: run.status,
            }))}
          />
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold text-foreground">Recent payslips</h3>
          <CardList
            items={payslips.slice(0, 12).map((slip) => ({
              id: slip.id,
              title: slip.employeeName,
              body: `Net ${formatCurrency(slip.netPay)}`,
              meta: `Gross ${formatCurrency(slip.grossPay)} · Tax ${formatCurrency(slip.incomeTax)} · NI ${formatCurrency(slip.employeeNi)}`,
            }))}
          />
        </section>
      </div>
    </ModulePageShell>
  );
}

export const metadata = { title: "Payroll" };
