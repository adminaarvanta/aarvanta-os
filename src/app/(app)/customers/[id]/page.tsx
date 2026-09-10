import { redirect } from "next/navigation";

export default async function CustomerAliasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/crm/contacts/${id}`);
}
