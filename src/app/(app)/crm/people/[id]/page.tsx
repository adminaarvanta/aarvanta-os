import { redirect } from "next/navigation";

type PageProps = { params: Promise<{ id: string }> };

/** Alias: /crm/people/[id] → contact detail. */
export default async function PeopleDetailRedirectPage({ params }: PageProps) {
  const { id } = await params;
  redirect(`/crm/contacts/${id}`);
}

export const metadata = { title: "Person" };
