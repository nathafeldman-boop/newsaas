"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Vraie ressource pédagogique, pas juste une note automatique : demandé
// explicitement en remplacement/complément de l'audit IA (devenu
// heuristique, voir staticAudit.ts) -- "un module comme une formation" qui
// explique concrètement comment construire un bon CV, utilisable par tout
// le monde (Premium ou non), sans aucune dépendance externe.

type Module = {
  id: string;
  icon: string;
  title: string;
  teaser: string;
  content: React.ReactNode;
};

function Bad({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--color-accent-700)", display: "flex", gap: 6 }}>
      <span aria-hidden>❌</span>
      <span>{children}</span>
    </p>
  );
}

function Good({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--color-accent-2-800)", display: "flex", gap: 6 }}>
      <span aria-hidden>✅</span>
      <span>{children}</span>
    </p>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: 13, lineHeight: 1.6, color: "color-mix(in srgb, var(--color-text) 85%, transparent)" }}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function buildModules(targetLabel: string | null): Module[] {
  return [
    {
      id: "structure",
      icon: "🧱",
      title: "La structure qui marche",
      teaser: "L'ordre des sections compte autant que leur contenu.",
      content: (
        <>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6 }}>
            Un recruteur passe en moyenne quelques secondes sur un CV avant de décider s&apos;il continue à
            le lire. La structure doit rendre l&apos;essentiel visible immédiatement, sans effort.
          </p>
          <Bullets
            items={[
              "En haut : nom, contact (email + téléphone), et une ligne qui dit ce que tu cherches (ex: \"Recherche alternance développeur web\").",
              "Puis : expériences (même courtes, même stages) et formation, dans l'ordre qui te met le plus en valeur.",
              "Ensuite : compétences, puis langues, puis centres d'intérêt (facultatif, en dernier).",
              "Une seule page, sauf profil très expérimenté.",
            ]}
          />
          <Good>Nom et poste visé lisibles en 2 secondes, sans avoir à chercher.</Good>
          <Bad>{'Un CV qui commence par un long paragraphe "à propos de moi" avant d\'arriver au concret.'}</Bad>
        </>
      ),
    },
    {
      id: "experiences",
      icon: "🛠️",
      title: "Décrire une expérience (même petite)",
      teaser: "Verbe d'action + résultat chiffré, à chaque ligne.",
      content: (
        <>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6 }}>
            La différence entre un CV oublié et un CV qui marque : des phrases qui montrent ce que tu as
            <em> réellement fait et changé</em>, pas juste ce dont tu étais responsable.
          </p>
          <Bad>&quot;Responsable de la gestion des réseaux sociaux.&quot;</Bad>
          <Good>&quot;Géré les réseaux sociaux : +40% d&apos;abonnés en 3 mois grâce à un nouveau format de contenu.&quot;</Good>
          <Bullets
            items={[
              "Commence chaque ligne par un verbe d'action (créé, géré, développé, organisé, analysé...).",
              "Ajoute un chiffre dès que possible : durée, volume, pourcentage, nombre de personnes.",
              "Pas de chiffre disponible ? Décris un résultat concret plutôt qu'une tâche générique.",
              "Un stage d'observation compte aussi : décris ce que tu as concrètement appris ou produit.",
            ]}
          />
        </>
      ),
    },
    {
      id: "motsCles",
      icon: "🔑",
      title: "Les mots-clés qui font la différence",
      teaser: "Ton CV doit parler le même langage que l'offre.",
      content: (
        <>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6 }}>
            De plus en plus de recruteurs (et certains logiciels de tri) recherchent des mots-clés précis
            avant même de lire ton CV en entier{targetLabel ? ` -- pour toi, ça veut dire des mots liés à ${targetLabel}` : ""}.
          </p>
          <Bullets
            items={[
              "Reprends le vocabulaire exact de l'offre (outils, logiciels, termes du métier) quand c'est vrai pour toi.",
              "Ne te contente pas de \"bon niveau Excel\" : précise (tableaux croisés dynamiques, macros...) si c'est le cas.",
              "Adapte légèrement ton CV selon le poste visé plutôt que d'envoyer un seul CV universel partout.",
              "N'invente jamais une compétence que tu ne maîtrises pas : ça se voit à l'entretien.",
            ]}
          />
        </>
      ),
    },
    {
      id: "erreurs",
      icon: "🚫",
      title: "Les erreurs qui coûtent un entretien",
      teaser: "Souvent des petits détails, jamais anodins pour le recruteur.",
      content: (
        <>
          <Bullets
            items={[
              "Fautes d'orthographe : premier motif de mise à la poubelle pour beaucoup de recruteurs.",
              "Coordonnées introuvables ou une adresse email peu sérieuse (surnom, chiffres au hasard).",
              "Un pavé de texte dense sans aération : rien ne ressort visuellement.",
              "Des dates qui ne se suivent pas logiquement, ou des trous non expliqués.",
              "Un CV de plus d'une page pour un profil junior.",
              "Une photo de mauvaise qualité (ou une photo dans un contexte où elle n'est pas attendue).",
            ]}
          />
          <p style={{ margin: "10px 0 0", fontSize: 13, fontWeight: 600 }}>
            Le réflexe simple : demande à quelqu&apos;un d&apos;autre de relire ton CV avant de
            l&apos;envoyer. On ne voit jamais ses propres fautes aussi bien qu&apos;un regard extérieur.
          </p>
        </>
      ),
    },
    {
      id: "forme",
      icon: "🎨",
      title: "Mise en forme et lisibilité",
      teaser: "Un CV se lit en diagonale : la hiérarchie visuelle compte.",
      content: (
        <>
          <Bullets
            items={[
              "Une seule police, deux tailles maximum (titres / texte courant).",
              "Des espaces blancs généreux plutôt qu'un texte tassé pour tout faire tenir.",
              "Des titres de section clairs et visibles (Expériences, Formation, Compétences...).",
              "Un export en PDF (jamais en .docx modifiable) pour garantir un rendu identique partout.",
              "Un nom de fichier propre : \"Prenom-Nom-CV.pdf\" plutôt que \"CV_final_v3_dernier.pdf\".",
            ]}
          />
        </>
      ),
    },
    {
      id: "checklist",
      icon: "✅",
      title: "Checklist avant d'envoyer",
      teaser: "5 vérifications rapides, juste avant de cliquer sur \"Postuler\".",
      content: (
        <Bullets
          items={[
            "Mon nom et un moyen de me contacter sont visibles en haut, sans effort de recherche.",
            "Chaque expérience a au moins une phrase avec un résultat concret ou un chiffre.",
            "J'ai relu (ou fait relire) une dernière fois pour les fautes.",
            "Mon CV tient sur une seule page et respire visuellement.",
            "J'ai adapté au moins un ou deux éléments à cette offre précise, pas un CV générique envoyé partout.",
          ]}
        />
      ),
    },
  ];
}

const STORAGE_KEY = "stageio_cv_guide_seen";

export function CvGuideModule({
  targetLabel,
  isPremium,
}: {
  targetLabel: string | null;
  isPremium: boolean;
}) {
  const modules = buildModules(targetLabel);
  const [openId, setOpenId] = useState<string | null>(null);
  const [seen, setSeen] = useState<Set<string>>(new Set());

  // localStorage n'existe pas côté serveur : lire sa valeur dès le rendu
  // initial (lazy useState) provoquerait un mismatch d'hydratation dès
  // qu'un module a déjà été vu. On rend volontairement "vide" au premier
  // rendu (identique serveur/client), puis on rattrape la vraie valeur ici.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setSeen(new Set(JSON.parse(raw)));
    } catch {
      // best-effort : simple confort visuel, jamais bloquant si indisponible
    }
  }, []);

  // Réservé aux Premium comme le reste de l'audit CV -- rien de nouveau
  // n'est offert gratuitement en dehors du swipe tant que le compte n'a
  // pas payé.
  if (!isPremium) {
    return (
      <div className="card elev-sm mt-5" style={{ padding: "var(--space-6)", textAlign: "center" }}>
        <p style={{ fontSize: 32, margin: 0 }}>📚</p>
        <p style={{ fontFamily: "var(--font-heading)", fontSize: 17, margin: "10px 0 0" }}>
          Comment écrire un CV qui décroche des entretiens
        </p>
        <p
          style={{
            fontSize: 13,
            margin: "6px 0 0",
            color: "color-mix(in srgb, var(--color-text) 65%, transparent)",
          }}
        >
          6 modules courts et concrets, personnalisés selon le métier que tu vises. Réservé aux membres
          Premium.
        </p>
        <a href="/premium" className="btn btn-primary mt-4" style={{ whiteSpace: "nowrap" }}>
          🔓 Débloquer avec Premium (7,99€/mois)
        </a>
      </div>
    );
  }

  function toggle(id: string) {
    const opening = openId !== id;
    setOpenId(opening ? id : null);
    if (opening && !seen.has(id)) {
      const next = new Set(seen).add(id);
      setSeen(next);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        // best-effort
      }
    }
  }

  const progress = Math.round((seen.size / modules.length) * 100);
  const allSeen = seen.size === modules.length;

  return (
    <div className="card elev-sm mt-5" style={{ padding: "var(--space-5)" }}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: 17, margin: 0 }}>
            📚 Comment écrire un CV qui décroche des entretiens
          </p>
          <p style={{ fontSize: 12.5, margin: "4px 0 0", color: "color-mix(in srgb, var(--color-text) 65%, transparent)" }}>
            6 modules courts, à ton rythme -- ouvre-les un par un.
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2.5">
        <div
          aria-hidden
          style={{ flex: 1, height: 6, borderRadius: 999, background: "var(--color-accent-100)", overflow: "hidden" }}
        >
          <motion.div
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 200, damping: 30 }}
            style={{ height: "100%", background: "var(--color-accent)" }}
          />
        </div>
        <span style={{ fontSize: 11.5, color: "color-mix(in srgb, var(--color-text) 60%, transparent)", whiteSpace: "nowrap" }}>
          {seen.size}/{modules.length}
        </span>
      </div>

      <AnimatePresence>
        {allSeen && (
          <motion.p
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 10 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              color: "var(--color-accent-2-800)",
              background: "var(--color-accent-2-100)",
              padding: "8px 12px",
              borderRadius: 10,
              overflow: "hidden",
            }}
          >
            🎉 Tu as vu les 6 modules -- applique-les à ton CV et tu es prêt(e) à candidater.
          </motion.p>
        )}
      </AnimatePresence>

      <div className="mt-4 flex flex-col gap-2">
        {modules.map((mod, i) => {
          const isOpen = openId === mod.id;
          const isSeen = seen.has(mod.id);
          return (
            <div
              key={mod.id}
              style={{
                border: `1.5px solid ${isOpen ? "var(--color-accent)" : "var(--color-divider)"}`,
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <button
                type="button"
                onClick={() => toggle(mod.id)}
                className="flex w-full items-center gap-3 text-left"
                style={{ padding: "12px 14px", background: "var(--color-surface)", cursor: "pointer" }}
              >
                <span
                  aria-hidden
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11.5,
                    fontWeight: 700,
                    background: isSeen ? "var(--color-accent-2-100)" : "var(--color-accent-100)",
                    color: isSeen ? "var(--color-accent-2-800)" : "var(--color-accent-700)",
                  }}
                >
                  {isSeen ? "✓" : i + 1}
                </span>
                <span aria-hidden style={{ fontSize: 18 }}>
                  {mod.icon}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600 }}>{mod.title}</p>
                  {!isOpen && (
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>
                      {mod.teaser}
                    </p>
                  )}
                </span>
                <motion.span
                  aria-hidden
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ fontSize: 12, color: "color-mix(in srgb, var(--color-text) 50%, transparent)", flexShrink: 0 }}
                >
                  ▾
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    style={{ overflow: "hidden" }}
                  >
                    <div style={{ padding: "2px 14px 16px 53px" }}>{mod.content}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
