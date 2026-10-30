import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CvBuilder } from "@/components/tools/CvBuilder";
import { ownOffersByIds } from "@/lib/applications/ownOffers";
import { classifyMetier } from "@/lib/seo/metiers";
import { CV_METIER_OPTIONS } from "@/lib/tools/cvTemplates";
import { CV_METIERS } from "@/lib/tools/cvMetiers";
import { CV_DESIGN_COUNT } from "@/lib/tools/cvDesigns";
import type { CvContract } from "@/lib/tools/cv";

// Modèles de CV dans l'app (30/10, Nathan : « en fonction du métier […] que
// l'utilisateur a choisi, et surtout pour les offres qu'il a likées ») : le
// métier le plus fréquent parmi les dernières offres likées, sinon le
// métier visé du profil ; le CV se prépare tout seul pour ce métier. Les
// coordonnées connues sont reprises. Rien n'est envoyé : le CV reste dans
// le navigateur, l'étudiant le télécharge puis le dépose dans « Ton CV ».

const RECENT_LIKES = 60;

function mostFrequent<T>(values: T[]): T | null {
  const counts = new Map<T, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best: T | null = null;
  let bestCount = 0;
  for (const [v, n] of counts) if (n > bestCount) [best, bestCount] = [v, n];
  return best;
}

export default async function CvTemplatesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/cv/modeles");

  const [{ data: profile }, { data: liked }] = await Promise.all([
    // select("*") : phone est une colonne ajoutée à la main (voir auto-send).
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("swipes").select("offer_id").eq("user_id", user.id).eq("direction", "like").order("created_at", { ascending: false }).limit(RECENT_LIKES),
  ]);
  if (!profile) redirect("/onboarding");

  const offers = await ownOffersByIds((liked ?? []).map((s) => s.offer_id)).catch((err) => {
    console.error("cv/modeles: offres likées illisibles", err);
    return [];
  });
  const fromLikes = mostFrequent(offers.map((o) => classifyMetier(o.title)?.slug).filter((s): s is string => !!s && !!CV_METIERS[s]));
  const fromTarget = (profile.target_jobs ?? []).map((t) => classifyMetier(t)?.slug).find((s) => !!s && !!CV_METIERS[s]) ?? null;
  const metier = fromLikes ?? fromTarget;
  const contract: CvContract = mostFrequent(offers.map((o) => o.contract_type)) === "stage" ? "stage" : "alternance";
  const metierLabel = CV_METIER_OPTIONS.find((m) => m.slug === metier)?.label ?? null;

  const [firstName, ...rest] = (profile.full_name ?? "").trim().split(/\s+/);
  const initial = {
    contract,
    firstName: firstName ?? "",
    lastName: rest.join(" "),
    city: profile.city ?? "",
    phone: profile.phone ?? "",
    email: profile.email ?? user.email ?? "",
  };

  return (
    <div>
      <Link href="/cv" style={{ fontSize: 14 }}>
        ← Ton CV
      </Link>
      <h1 style={{ fontSize: 28, margin: "10px 0 0" }}>Modèles de CV</h1>
      <p style={{ fontSize: 14, margin: "4px 0 20px", maxWidth: "65ch", color: "color-mix(in srgb, var(--color-text) 75%, transparent)" }}>
        {metierLabel && fromLikes
          ? `Préparé pour le métier de tes offres likées (${metierLabel.toLowerCase()}) : `
          : metierLabel
            ? `Préparé pour ton métier visé (${metierLabel.toLowerCase()}) : `
            : "Choisis ton métier : "}
        titre, profil et compétences que les recruteurs cherchent. {CV_DESIGN_COUNT} designs, tous lisibles par les logiciels de tri. Complète ce
        qui est entre crochets, télécharge, puis dépose ton CV.
      </p>
      <CvBuilder
        defaultContract={contract}
        metierOptions={CV_METIER_OPTIONS}
        initial={initial}
        defaultMetier={metier}
        formation={profile.formation}
        storageKey={`stageio-cv-draft-${user.id}`}
        inApp
      />
    </div>
  );
}
