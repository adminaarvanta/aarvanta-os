import type { SiteTemplateDefinition, SiteTemplatePreviewLayout } from "@/types/site-builder";

/** Mini wireframe showing real structural differences between templates. */
export function TemplateLayoutPreview({
  template,
  className = "",
}: {
  template: SiteTemplateDefinition;
  className?: string;
}) {
  const accent = template.previewAccent;
  const layout = template.previewLayout;

  return (
    <div
      className={`relative overflow-hidden rounded-t-2xl border-b border-black/5 ${className}`}
      style={{ background: `linear-gradient(160deg, ${accent}22, ${accent}08 40%, #0b1220)` }}
      aria-hidden
    >
      <div className="flex items-center gap-1.5 px-3 pt-2.5">
        <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
        <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
        <span className="h-1.5 w-1.5 rounded-full bg-white/15" />
        <span className="ml-2 h-1.5 flex-1 rounded-full bg-white/10" />
      </div>
      <div className="p-3 pt-2">
        <PreviewBody layout={layout} accent={accent} hero={template.heroLayout} />
      </div>
      <p className="truncate px-3 pb-2 text-[9px] font-medium tracking-wide text-white/55">
        {template.inspiredBy}
      </p>
    </div>
  );
}

function PreviewBody({
  layout,
  accent,
  hero,
}: {
  layout: SiteTemplatePreviewLayout;
  accent: string;
  hero: SiteTemplateDefinition["heroLayout"];
}) {
  const bar = (w: string, o = 0.55) => (
    <div className="h-1.5 rounded-sm" style={{ width: w, backgroundColor: accent, opacity: o }} />
  );
  const card = (key: string) => (
    <div
      key={key}
      className="h-8 rounded-md border border-white/10"
      style={{ backgroundColor: `${accent}33` }}
    />
  );

  if (layout === "store_grid") {
    return (
      <div className="space-y-2">
        <HeroStrip hero={hero} accent={accent} />
        <div className="grid grid-cols-3 gap-1.5">{[1, 2, 3].map((i) => card(`p${i}`))}</div>
        <div className="grid grid-cols-3 gap-1.5">{[4, 5, 6].map((i) => card(`p${i}`))}</div>
      </div>
    );
  }

  if (layout === "saas_split") {
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-1.5">
          <div className="space-y-1.5 py-1">
            {bar("90%", 0.9)}
            {bar("70%", 0.45)}
            <div className="mt-1 h-4 w-14 rounded-full" style={{ backgroundColor: accent }} />
          </div>
          <div className="h-16 rounded-md" style={{ backgroundColor: `${accent}55` }} />
        </div>
        <div className="grid grid-cols-3 gap-1">{[1, 2, 3].map((i) => card(`f${i}`))}</div>
      </div>
    );
  }

  if (layout === "editorial_folio") {
    return (
      <div className="space-y-2">
        {bar("40%", 0.35)}
        {bar("85%", 0.95)}
        <div className="grid grid-cols-2 gap-1.5">
          <div className="h-14 rounded-sm" style={{ backgroundColor: `${accent}66` }} />
          <div className="h-14 rounded-sm" style={{ backgroundColor: `${accent}40` }} />
        </div>
        <div className="grid grid-cols-3 gap-1">{[1, 2, 3].map((i) => card(`g${i}`))}</div>
      </div>
    );
  }

  if (layout === "dining_dark") {
    return (
      <div className="space-y-2 rounded-md bg-black/35 p-2">
        <HeroStrip hero="fullBleed" accent={accent} />
        <div className="space-y-1">
          {bar("55%", 0.8)}
          {bar("80%", 0.35)}
          {bar("65%", 0.35)}
        </div>
      </div>
    );
  }

  if (layout === "clinic_calm") {
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-1.5">
          <div className="h-14 rounded-md bg-white/10" />
          <div className="space-y-1.5 self-center">
            {bar("95%", 0.85)}
            {bar("60%", 0.4)}
          </div>
        </div>
        <div className="grid grid-cols-4 gap-1">{[1, 2, 3, 4].map((i) => card(`s${i}`))}</div>
      </div>
    );
  }

  if (layout === "agency_bold") {
    return (
      <div className="space-y-2">
        <div className="h-10 rounded-md" style={{ backgroundColor: accent, opacity: 0.85 }} />
        <div className="grid grid-cols-2 gap-1.5">
          <div className="h-12 rounded-md bg-white/15" />
          <div className="h-12 rounded-md bg-white/10" />
        </div>
        {bar("50%", 0.5)}
      </div>
    );
  }

  if (layout === "magazine") {
    return (
      <div className="space-y-2">
        {bar("30%", 0.4)}
        <div className="grid grid-cols-[1.4fr_1fr] gap-1.5">
          <div className="h-16 rounded-sm" style={{ backgroundColor: `${accent}55` }} />
          <div className="space-y-1">
            {card("a")}
            {card("b")}
          </div>
        </div>
      </div>
    );
  }

  if (layout === "event_stage") {
    return (
      <div className="space-y-2">
        <div className="flex h-12 items-end justify-center rounded-md bg-black/40 pb-2">
          <div className="h-3 w-24 rounded-full" style={{ backgroundColor: accent }} />
        </div>
        <div className="grid grid-cols-4 gap-1">{[1, 2, 3, 4].map((i) => card(`sp${i}`))}</div>
      </div>
    );
  }

  if (layout === "ops_dashboard") {
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-[0.35fr_1fr] gap-1.5">
          <div className="space-y-1 rounded-md bg-black/30 p-1">
            {bar("100%", 0.4)}
            {bar("80%", 0.25)}
            {bar("90%", 0.25)}
          </div>
          <div className="grid grid-cols-2 gap-1">
            {card("m1")}
            {card("m2")}
            {card("m3")}
            {card("m4")}
          </div>
        </div>
      </div>
    );
  }

  // landing_centered default
  return (
    <div className="space-y-2">
      <HeroStrip hero={hero} accent={accent} />
      <div className="mx-auto flex w-4/5 flex-col items-center gap-1">
        {bar("70%", 0.9)}
        {bar("90%", 0.4)}
        <div className="mt-1 h-4 w-16 rounded-full" style={{ backgroundColor: accent }} />
      </div>
      <div className="grid grid-cols-3 gap-1">{[1, 2, 3].map((i) => card(`c${i}`))}</div>
    </div>
  );
}

function HeroStrip({
  hero,
  accent,
}: {
  hero: SiteTemplateDefinition["heroLayout"];
  accent: string;
}) {
  if (hero === "split") {
    return (
      <div className="grid grid-cols-2 gap-1.5">
        <div className="h-12 space-y-1 rounded-md bg-white/5 p-1.5">
          <div className="h-1.5 w-4/5 rounded" style={{ backgroundColor: accent, opacity: 0.9 }} />
          <div className="h-1 w-3/5 rounded bg-white/25" />
        </div>
        <div className="h-12 rounded-md" style={{ backgroundColor: `${accent}66` }} />
      </div>
    );
  }
  if (hero === "centered" || hero === "minimal") {
    return (
      <div className="flex h-12 flex-col items-center justify-center gap-1 rounded-md bg-white/5">
        <div className="h-1.5 w-2/3 rounded" style={{ backgroundColor: accent }} />
        <div className="h-1 w-1/2 rounded bg-white/25" />
      </div>
    );
  }
  return <div className="h-12 rounded-md" style={{ backgroundColor: `${accent}70` }} />;
}
