export function formatFinanceCurrency(value: number, currency = "GBP") {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function displayInvoiceStatus(
  status: "draft" | "sent" | "paid" | "overdue",
  dueDate: string
): "draft" | "sent" | "paid" | "overdue" {
  if (status === "sent" && dueDate < todayIsoDate()) return "overdue";
  return status;
}

export function nextInvoiceNumber(existing: Array<{ number: string }>): string {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  let max = 0;
  for (const row of existing) {
    if (!row.number.startsWith(prefix)) continue;
    const parsed = Number.parseInt(row.number.slice(prefix.length), 10);
    if (!Number.isNaN(parsed)) max = Math.max(max, parsed);
  }
  return `${prefix}${String(max + 1).padStart(3, "0")}`;
}
