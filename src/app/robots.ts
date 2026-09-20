import type { MetadataRoute } from "next";

const BASIS_URL = "https://sigap-murex-seven.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: "/api/" }],
    sitemap: `${BASIS_URL}/sitemap.xml`,
  };
}
