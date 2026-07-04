import { notFound } from "next/navigation";
import { GeneratedStorefront } from "@/components/store/generated-storefront";
import { getStorePageRepository } from "@/lib/data/store-page-store";

type PageProps = { params: Promise<{ slug: string }> };

export default async function PublicStorePage({ params }: PageProps) {
  const { slug } = await params;
  const page = await getStorePageRepository().getBySlug(slug);

  if (!page || !page.published) {
    notFound();
  }

  return <GeneratedStorefront store={page} />;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const page = await getStorePageRepository().getBySlug(slug);
  if (!page) return { title: "Store" };
  return {
    title: `${page.brandName} — Shop`,
    description: page.description,
  };
}
