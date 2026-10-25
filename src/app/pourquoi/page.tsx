import Link from "next/link";
import type { Metadata } from "next";
import { submitChurnSurveyAction } from "./actions";

// Questionnaire de départ (25/10, Nathan : « les envoyer vers un
// questionnaire pour savoir pourquoi ils ont churn ») : lien des e-mails aux
// abonnés qui résilient ou qui sont partis. Trois questions, 30 secondes,
// sans connexion.
export const metadata: Metadata = {
  title: "Pourquoi tu arrêtes ?",
  robots: { index: false, follow: false },
};

const FOUND = "J'ai trouvé mon alternance";
const REASONS = [
  FOUND,
  "Les offres ne correspondaient pas à mon métier ou à ma ville",
  "Pas assez d'offres",
  "Trop cher pour moi en ce moment",
  "Je ne l'utilisais pas assez",
  "Un bug ou un souci technique",
  "Autre",
];
const COME_BACK = [
  "Plus d'offres près de chez moi",
  "Des offres plus proches de mon métier",
  "Que mes candidatures partent toutes seules",
  "De l'aide pour mon CV et mes entretiens",
  "Un prix plus bas",
];

const muted = "color-mix(in srgb, var(--color-text) 65%, transparent)";
const optionStyle = { padding: "10px 12px", cursor: "pointer", fontSize: 14 } as const;

export default async function ChurnSurveyPage({ searchParams }: { searchParams: Promise<{ u?: string; k?: string; r?: string; merci?: string; erreur?: string }> }) {
  const { u, k, r, merci, erreur } = await searchParams;
  const kind = k === "parti" ? "parti" : "programme";

  if (merci) {
    const found = r === "trouve";
    return (
      <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-5 py-16 text-center sm:px-9">
        <p className="text-4xl">{found ? "🎉" : "🙏"}</p>
        <h1 style={{ fontSize: 24, margin: "16px 0 0" }}>{found ? "Bravo pour ton alternance !" : "Merci, c'est noté"}</h1>
        <p style={{ fontSize: 14, margin: "10px 0 24px", color: muted }}>
          {found
            ? "Ça nous fait vraiment plaisir. Bon début de contrat, et si un ami cherche encore, tu sais où l'envoyer."
            : "Je lis chaque réponse. Si tu veux qu'on regarde ton cas de plus près, réponds simplement à notre e-mail."}
        </p>
        {!found && (
          <Link href={kind === "programme" ? "/premium/garder" : "/premium"} className="btn btn-primary">
            {kind === "programme" ? "Finalement, je garde mon Premium" : "Réessayer Premium le mois prochain"}
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-1 items-center px-5 py-10">
      <div className="card elev-sm w-full" style={{ padding: "var(--space-6)" }}>
        <h1 style={{ fontSize: 21, margin: 0 }}>{kind === "parti" ? "Pourquoi tu as arrêté ?" : "Pourquoi tu arrêtes ?"}</h1>
        <p style={{ fontSize: 13.5, margin: "6px 0 0", color: muted }}>3 questions, 30 secondes. Ta réponse sert à corriger ce qui ne va pas, pas à te faire changer d&apos;avis.</p>
        {(erreur || !u) && (
          <p style={{ fontSize: 13, margin: "12px 0 0", color: "#b42318" }}>
            {u ? "Ta réponse n'a pas pu être enregistrée, réessaie." : "Lien incomplet : ouvre le lien reçu par e-mail, ou réponds directement à notre e-mail."}
          </p>
        )}

        {u && (
          <form action={submitChurnSurveyAction} className="mt-5 flex flex-col gap-2">
            <input type="hidden" name="u" value={u} />
            <input type="hidden" name="k" value={kind} />

            <p style={{ fontSize: 14, fontWeight: 700, margin: "4px 0 2px" }}>1. La raison principale</p>
            {REASONS.map((reason) => (
              <label key={reason} className="card flex-row items-center gap-2.5" style={optionStyle}>
                <input type="radio" name="reason" value={reason} required defaultChecked={r === "trouve" && reason === FOUND} />
                {reason}
              </label>
            ))}

            <p style={{ fontSize: 14, fontWeight: 700, margin: "14px 0 2px" }}>2. Qu&apos;est-ce qui t&apos;aurait fait rester ?</p>
            <textarea
              name="stay"
              rows={3}
              placeholder="Sois franc, même si c'est dur à lire"
              style={{ width: "100%", borderRadius: "var(--radius-md)", border: "1px solid var(--color-divider)", padding: "10px 12px", fontSize: 14, fontFamily: "inherit", resize: "vertical" }}
            />

            <p style={{ fontSize: 14, fontWeight: 700, margin: "14px 0 2px" }}>3. Tu reviendrais si… (plusieurs choix possibles)</p>
            {COME_BACK.map((option) => (
              <label key={option} className="card flex-row items-center gap-2.5" style={optionStyle}>
                <input type="checkbox" name="comeback" value={option} />
                {option}
              </label>
            ))}
            <input
              name="comeback_other"
              placeholder="Autre chose ?"
              style={{ width: "100%", borderRadius: "var(--radius-md)", border: "1px solid var(--color-divider)", padding: "10px 12px", fontSize: 14, fontFamily: "inherit" }}
            />

            <button type="submit" className="btn btn-primary mt-3">
              Envoyer ma réponse
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
