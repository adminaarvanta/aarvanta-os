import type { MetadataRoute } from "next";
import { appOrigin } from "@/lib/product/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = appOrigin();
  const paths = [
    "/",
    "/pricing",
    "/about",
    "/contact",
    "/privacy",
    "/security",
    "/subprocessors",
    "/status",
    "/changelog",
    "/docs",
    "/register",
  ];
  return paths.map((path) => ({
    url: `${base}${path}`,
    changeFrequency: "weekly",
    priority: path === "/" ? 1 : 0.6,
  }));
}
