import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody, unauthorized } from "@/lib/api/request";
import { getDomainOrderRepository } from "@/lib/data/domain-order-store";
import { getSiteBuildRepository } from "@/lib/data/site-build-store";
import {
  createDomainPurchaseOrder,
  toPurchasedDomainPreference,
} from "@/lib/site-builder/domain-purchase";
import { getTenantScope } from "@/lib/tenant/context";

const purchaseSchema = z.object({
  domain: z.string().min(4).max(120),
  tld: z.string().min(2).max(12),
  priceAnnual: z.number().positive(),
  currency: z.enum(["GBP", "USD"]),
  autoRenew: z.boolean().default(true),
  buildJobId: z.string().optional(),
});

export async function POST(req: Request) {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;

  const parsed = purchaseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: parsed.error.message } },
      { status: 400 }
    );
  }

  const order = createDomainPurchaseOrder({
    scope,
    domain: parsed.data.domain,
    tld: parsed.data.tld,
    priceAnnual: parsed.data.priceAnnual,
    currency: parsed.data.currency,
    autoRenew: parsed.data.autoRenew,
    buildJobId: parsed.data.buildJobId,
  });

  await getDomainOrderRepository().save(order);

  const domainPreference = toPurchasedDomainPreference(order, parsed.data.autoRenew);

  if (parsed.data.buildJobId) {
    const repo = getSiteBuildRepository();
    const job = await repo.get(parsed.data.buildJobId, scope);
    if (job) {
      await repo.save({
        ...job,
        preferences: {
          ...job.preferences,
          deployment: {
            ...job.preferences.deployment,
            domain: domainPreference,
          },
        },
        updatedAt: order.purchasedAt,
      });
    }
  }

  return NextResponse.json({ order, domain: domainPreference }, { status: 201 });
}
