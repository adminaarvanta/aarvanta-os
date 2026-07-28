import { HrInvoicesClient } from "@/components/hr/hr-invoices-client";
import { getHrStore } from "@/lib/data/platform-store";
import { ensureHrPlatformSeed } from "@/lib/hr/ensure-platform-seed";
import { getTenantScope } from "@/lib/tenant/context";

export default async function HrInvoicesPage() {
  const scope = await getTenantScope();
  await ensureHrPlatformSeed(scope);
  const hr = getHrStore();
  const [documents, employees] = await Promise.all([
    hr.listDocuments(scope),
    hr.listEmployees(scope),
  ]);
  const invoices = documents.filter((d) => d.type === "corporate_invoice");
  return <HrInvoicesClient initialInvoices={invoices} employees={employees} />;
}
