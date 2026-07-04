import type { ChartOfAccount } from "@/types/platform-modules";

/** Standard UK small-business chart of accounts (Milestone 1). */
export const UK_CHART_OF_ACCOUNTS_TEMPLATE: Array<
  Omit<ChartOfAccount, keyof import("@/types/communication").TenantScope | "id" | "createdAt">
> = [
  { code: "1000", name: "Sales Revenue", type: "revenue", vatApplicable: true, currency: "GBP", active: true },
  { code: "1100", name: "Online Sales", type: "revenue", vatApplicable: true, currency: "GBP", active: true },
  { code: "2000", name: "Cost of Goods Sold", type: "expense", vatApplicable: true, currency: "GBP", active: true },
  { code: "2100", name: "Packaging & Shipping", type: "expense", vatApplicable: true, currency: "GBP", active: true },
  { code: "3000", name: "Operating Expenses", type: "expense", vatApplicable: false, currency: "GBP", active: true },
  { code: "3100", name: "Marketing & Advertising", type: "expense", vatApplicable: true, currency: "GBP", active: true },
  { code: "3200", name: "Software & Subscriptions", type: "expense", vatApplicable: true, currency: "GBP", active: true },
  { code: "4000", name: "Bank Current Account", type: "asset", vatApplicable: false, currency: "GBP", active: true },
  { code: "4100", name: "Accounts Receivable", type: "asset", vatApplicable: false, currency: "GBP", active: true },
  { code: "4200", name: "Inventory", type: "asset", vatApplicable: false, currency: "GBP", active: true },
  { code: "5000", name: "Accounts Payable", type: "liability", vatApplicable: false, currency: "GBP", active: true },
  { code: "5100", name: "VAT Liability", type: "liability", vatApplicable: false, currency: "GBP", active: true },
  { code: "5200", name: "PAYE / NI Payable", type: "liability", vatApplicable: false, currency: "GBP", active: true },
  { code: "6000", name: "Share Capital", type: "equity", vatApplicable: false, currency: "GBP", active: true },
  { code: "6100", name: "Retained Earnings", type: "equity", vatApplicable: false, currency: "GBP", active: true },
];

export const UK_VAT_STANDARD_RATE = 0.2;
export const UK_VAT_REGISTRATION_THRESHOLD = 90_000;
