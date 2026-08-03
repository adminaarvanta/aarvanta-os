import { redirect } from "next/navigation";

type PageProps = { params: Promise<{ id: string }> };

/** Legacy task detail — redirects to Jobs detail. */
export default async function WorkforceTaskDetailRedirectPage({
  params,
}: PageProps) {
  const { id } = await params;
  redirect(`/workforce/jobs/${id}`);
}

export const metadata = { title: "Job Detail" };
