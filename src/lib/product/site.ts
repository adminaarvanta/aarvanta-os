export function appOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");
  return "https://os.aarvanta.co";
}

export function canonicalUrl(path = "/"): string {
  const normalised = path.startsWith("/") ? path : `/${path}`;
  return `${appOrigin()}${normalised === "/" ? "/" : normalised}`;
}
