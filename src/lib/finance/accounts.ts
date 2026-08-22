/** Standard UK small-business account codes used by invoice, expense, and payment posts. */
export const FINANCE_ACCOUNTS = {
  sales: "1000",
  cogs: "2000",
  operating: "3000",
  marketing: "3100",
  software: "3200",
  shipping: "2100",
  bank: "4000",
  receivable: "4100",
  payable: "5000",
  vat: "5100",
} as const;

export const EXPENSE_CATEGORIES: Array<{
  id: string;
  label: string;
  accountCode: string;
}> = [
  { id: "software", label: "Software & subscriptions", accountCode: FINANCE_ACCOUNTS.software },
  { id: "infrastructure", label: "Infrastructure", accountCode: FINANCE_ACCOUNTS.software },
  { id: "marketing", label: "Marketing & advertising", accountCode: FINANCE_ACCOUNTS.marketing },
  { id: "travel", label: "Travel", accountCode: FINANCE_ACCOUNTS.operating },
  { id: "cogs", label: "Cost of goods sold", accountCode: FINANCE_ACCOUNTS.cogs },
  { id: "shipping", label: "Packaging & shipping", accountCode: FINANCE_ACCOUNTS.shipping },
  { id: "operating", label: "Operating expenses", accountCode: FINANCE_ACCOUNTS.operating },
];

export function accountCodeForExpenseCategory(category: string): string {
  const normalized = category.trim().toLowerCase();
  const match = EXPENSE_CATEGORIES.find(
    (item) => item.id === normalized || item.label.toLowerCase() === normalized
  );
  return match?.accountCode ?? FINANCE_ACCOUNTS.operating;
}
