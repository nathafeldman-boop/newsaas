"use client";

import { useState } from "react";
import { SITE_URL } from "@/lib/site";

type Option = { slug: string; label: string };
type CityOption = Option & { phrase: string };

// Générateur du code d'intégration : choix du type, de la ville et du
// métier, aperçu en direct, code à copier. Le lien visible sous l'iframe
// porte la marque (« Stageio »), pas une suite de mots-clés.
export function WidgetBuilder({ cities, metiers }: { cities: Record<"alternance" | "stage", CityOption[]>; metiers: Option[] }) {
  const [type, setType] = useState<"alternance" | "stage">("alternance");
  const defaultCity = (list: CityOption[]) => (list.some((c) => c.slug === "paris") ? "paris" : (list[0]?.slug ?? "paris"));
  const [ville, setVille] = useState(defaultCity(cities.alternance));
  const [metier, setMetier] = useState("");
  const [copied, setCopied] = useState(false);

  const cityList = cities[type];
  const city = cityList.find((c) => c.slug === ville) ?? cityList[0];
  const path = `/widget/${type}/${city?.slug ?? ville}${metier ? `/${metier}` : ""}`;
  const pagePath = `/${type}/${metier ? `${metier}/` : ""}${city?.slug ?? ville}`;
  const what = type === "alternance" ? "Offres d'alternance" : "Offres de stage";
  const code =
    `<iframe src="${SITE_URL}${path}" width="100%" height="460" style="border:0" loading="lazy" title="${what} ${city?.phrase ?? ""}"></iframe>\n` +
    `<p style="font-size:12px">${what} proposées par <a href="${SITE_URL}${pagePath}">Stageio</a></p>`;

  return (
    <div className="grid gap-4">
      <div className="card elev-sm grid gap-3" style={{ padding: "var(--space-5)" }}>
        <label className="field">
          <span>Type</span>
          <select
            className="input"
            value={type}
            onChange={(e) => {
              const next = e.target.value as "alternance" | "stage";
              setType(next);
              setVille(defaultCity(cities[next]));
              setMetier("");
            }}
          >
            <option value="alternance">Alternance</option>
            <option value="stage">Stage</option>
          </select>
        </label>
        <label className="field">
          <span>Ville</span>
          <select className="input" value={city?.slug} onChange={(e) => setVille(e.target.value)}>
            {cityList.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Métier (facultatif)</span>
          <select className="input" value={metier} onChange={(e) => setMetier(e.target.value)}>
            <option value="">Tous les métiers</option>
            {metiers.map((m) => (
              <option key={m.slug} value={m.slug}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
        <p style={{ fontSize: 13, margin: 0 }}>
          Un métier peu représenté dans la ville peut ne pas avoir assez d&apos;offres : l&apos;aperçu le montre tout de
          suite.
        </p>
      </div>

      <div>
        <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 6px" }}>Aperçu</p>
        <iframe key={path} src={path} width="100%" height={460} style={{ border: "1px solid var(--color-divider)", borderRadius: 12 }} title="Aperçu du widget" />
      </div>

      <div>
        <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 6px" }}>Code à coller sur votre site</p>
        <textarea className="input" readOnly value={code} rows={5} style={{ fontFamily: "monospace", fontSize: 12.5 }} />
        <button
          type="button"
          className="btn btn-primary mt-2"
          onClick={() => {
            void navigator.clipboard?.writeText(code).then(() => setCopied(true));
          }}
        >
          {copied ? "Copié ✓" : "Copier le code"}
        </button>
      </div>
    </div>
  );
}
