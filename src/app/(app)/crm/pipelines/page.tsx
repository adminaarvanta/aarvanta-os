import { redirect } from "next/navigation";

type PageProps = {
  searchParams: Promise<{ pipeline?: string }>;
};

/** Legacy Pipelines → Sales. */
export default async function PipelinesRedirectPage({ searchParams }: PageProps) {
  const { pipeline } = await searchParams;
  redirect(
    pipeline ? `/crm/sales?pipeline=${encodeURIComponent(pipeline)}` : "/crm/sales"
  );
}

export const metadata = { title: "Sales" };
