import { redirect } from "next/navigation";

type PageProps = {
  searchParams: Promise<{ assignedTo?: string }>;
};

/** Legacy Tasks → Activity. */
export default async function TasksRedirectPage({ searchParams }: PageProps) {
  const { assignedTo } = await searchParams;
  redirect(
    assignedTo
      ? `/crm/activity?assignedTo=${encodeURIComponent(assignedTo)}`
      : "/crm/activity"
  );
}

export const metadata = { title: "Activity" };
