import { GlobalSearch } from "@/components/layout/global-search";

export function AppHeader() {
  return (
    <header className="shrink-0 border-b border-[#3d3528] bg-[#0a0a0a] px-3 py-2 sm:px-4">
      <GlobalSearch className="mx-auto w-full max-w-2xl" />
    </header>
  );
}
