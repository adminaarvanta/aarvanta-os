import type Stripe from "stripe";

export function stripeObjectId(
  value: string | { id: string } | null | undefined
): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  return value.id || undefined;
}

export function invoiceSubscriptionId(invoice: Stripe.Invoice): string | undefined {
  const parent = invoice.parent?.subscription_details?.subscription;
  return stripeObjectId(parent);
}

export function invoiceCustomerId(invoice: Stripe.Invoice): string | undefined {
  return stripeObjectId(invoice.customer);
}
