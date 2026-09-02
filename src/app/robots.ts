import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/offres", "/legal", "/login", "/inscription"],
      disallow: [
        "/api/",
        "/admin/",
        "/swipe",
        "/favoris",
        "/mes-candidatures",
        "/parrainage",
        "/profil",
        "/accueil",
        "/onboarding",
        "/auth/",
        "/candidature/",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
