import { createAdminClient } from "@/lib/supabase/admin";

// Lectures complètes du catalogue, faites en arrière-plan et mises en cache
// (index des pages métier / ville, index des entreprises, segments, sitemaps,
// date de la dernière offre) : rôle service plutôt qu'anon. Le rôle anon a
// un délai de quelques secondes, que ces lectures dépassaient quand la base
// est chargée (08/10 : index « stage » à 13 h 25 UTC, sitemap à 16 h 31),
// faute d'index adapté (voir SEO_ROADMAP.md, index proposés). Même requêtes,
// mêmes filtres (offres actives) ; jamais pour une lecture faite à chaque
// visite ni pour une donnée liée à un utilisateur. Serveur uniquement.
export function createCatalogClient() {
  return createAdminClient();
}
