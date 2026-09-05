export type CompanyOption = {
  id: string;
  name: string;
};

export type CompanySelection =
  | { kind: "none" }
  | { kind: "existing"; id: string; name: string }
  | { kind: "new"; name: string };

export function emptyCompanySelection(): CompanySelection {
  return { kind: "none" };
}

export function selectionFromAccountId(
  accountId: string | undefined,
  companies: CompanyOption[]
): CompanySelection {
  if (!accountId) return { kind: "none" };
  const match = companies.find((company) => company.id === accountId);
  return match
    ? { kind: "existing", id: match.id, name: match.name }
    : { kind: "none" };
}

export function findCompanyByName(
  companies: CompanyOption[],
  name: string
): CompanyOption | undefined {
  const needle = name.trim().toLowerCase();
  if (!needle) return undefined;
  return companies.find((company) => company.name.trim().toLowerCase() === needle);
}

export async function ensureCompanyId(
  companies: CompanyOption[],
  selection: CompanySelection
): Promise<string | undefined> {
  if (selection.kind === "none") return undefined;
  if (selection.kind === "existing") return selection.id;

  const existing = findCompanyByName(companies, selection.name);
  if (existing) return existing.id;

  const res = await fetch("/api/companies", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: selection.name.trim(),
      tags: ["prospect"],
    }),
  });
  if (!res.ok) {
    throw new Error("Could not create that company. Try again.");
  }
  const data = (await res.json()) as { company: { id: string } };
  return data.company.id;
}
