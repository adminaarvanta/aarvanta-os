import type { RulePack } from "@/lib/rules/types";

/** UK default business rules — data-driven, not hardcoded in feature code. */
export const UK_DEFAULT_RULE_PACK: RulePack = {
  id: "uk-default-v1",
  label: "United Kingdom — Default",
  country: "GB",
  version: "1.0.0",
  rules: [
    {
      id: "deal-won-requires-value",
      name: "Deal won requires positive value",
      when: [
        { field: "deal.status", operator: "eq", value: "won" },
        { field: "deal.value", operator: "lte", value: 0 },
      ],
      then: {
        type: "reject",
        params: { message: "Won deals must have a value greater than zero." },
      },
    },
    {
      id: "deal-high-value-approval",
      name: "High-value deal requires manager approval",
      when: [{ field: "deal.value", operator: "gte", value: 50000 }],
      then: {
        type: "require_approval",
        params: { role: "manager", reason: "Deal value exceeds £50,000" },
      },
    },
    {
      id: "contact-email-or-phone",
      name: "Contact must have email or phone",
      when: [
        { field: "contact.email", operator: "not_exists" },
        { field: "contact.phone", operator: "not_exists" },
      ],
      then: {
        type: "reject",
        params: { message: "Contact must include an email or phone number." },
      },
    },
  ],
};

const PACKS: RulePack[] = [UK_DEFAULT_RULE_PACK];

export function listRulePacks(): RulePack[] {
  return PACKS;
}

export function getRulePack(id: string): RulePack | null {
  return PACKS.find((pack) => pack.id === id) ?? null;
}

export function resolveRulePack(options: {
  country?: string;
  industry?: string;
}): RulePack {
  const country = (options.country ?? "GB").toUpperCase();
  const byCountry = PACKS.find(
    (pack) =>
      pack.country.toUpperCase() === country &&
      (!options.industry || pack.industry === options.industry)
  );
  return byCountry ?? UK_DEFAULT_RULE_PACK;
}
