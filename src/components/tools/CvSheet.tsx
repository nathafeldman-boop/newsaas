import { isEmptyEntry, splitLines, splitList, type CvEntry, type CvInput } from "@/lib/tools/cv";
import { DEFAULT_CV_DESIGN, type CvDesign } from "@/lib/tools/cvDesigns";

// Rendu du CV, partagé par l'aperçu du générateur (client) et les exemples
// de la page (serveur). Couleurs fixes sur fond blanc : c'est une feuille à
// imprimer, pas une partie du thème du site. Champs vides : texte gris
// entre crochets, pour montrer quoi remplir.
//
// Six mises en page (cvDesigns.ts), toutes lisibles par les logiciels de
// tri des recruteurs : une seule colonne de lecture (les dates suivent le
// titre), du vrai texte, des titres de rubrique standard (Profil,
// Formation, Expériences, Compétences, Langues). La couleur, les bandeaux
// et les filets ne portent aucun mot.

const ink = "#1a1a1a";
const muted = "#5f6368";
const serif = "Georgia, 'Times New Roman', serif";

const tint = (hex: string, pct: number) => `color-mix(in srgb, ${hex} ${pct}%, white)`;

function Placeholder({ children }: { children: string }) {
  return <span style={{ color: "#9aa0a6" }}>[{children}]</span>;
}

function SectionTitle({ title, design }: { title: string; design: CvDesign }) {
  const { layout, color } = design;
  const base: React.CSSProperties = { margin: "0 0 6px" };
  switch (layout) {
    case "moderne":
      return <h3 style={{ ...base, fontSize: 13, fontWeight: 700, color, borderLeft: `3px solid ${color}`, paddingLeft: 7, lineHeight: 1.25 }}>{title}</h3>;
    case "epure":
      return (
        <h3 style={{ ...base, fontSize: 10.5, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#3c4043", paddingBottom: 4, borderBottom: "1px solid #dadce0" }}>
          {title}
        </h3>
      );
    case "elegant":
      return (
        <h3 style={{ ...base, fontFamily: serif, fontSize: 15, fontWeight: 400, color, paddingBottom: 3, borderBottom: `1px solid ${tint(color, 35)}` }}>{title}</h3>
      );
    case "impact":
      return (
        <h3
          style={{
            ...base,
            display: "inline-block",
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#ffffff",
            background: color,
            padding: "3px 9px",
            borderRadius: 3,
          }}
        >
          {title}
        </h3>
      );
    case "bandeau":
      return (
        <h3 style={{ ...base, fontSize: 11.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color, display: "flex", alignItems: "center", gap: 7 }}>
          <span aria-hidden style={{ width: 7, height: 7, background: color, borderRadius: 2, flex: "none" }} />
          {title}
        </h3>
      );
    default:
      return (
        <h3
          style={{
            ...base,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color,
            paddingBottom: 3,
            borderBottom: `1px solid ${color}`,
          }}
        >
          {title}
        </h3>
      );
  }
}

function Section({ title, design, children }: { title: string; design: CvDesign; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: design.layout === "epure" ? 16 : 13 }}>
      <SectionTitle title={title} design={design} />
      <div>{children}</div>
    </section>
  );
}

function Entries({ entries, emptyLabel, design }: { entries: CvEntry[]; emptyLabel: string; design: CvDesign }) {
  const filled = entries.filter((entry) => !isEmptyEntry(entry));
  if (filled.length === 0) return <Placeholder>{emptyLabel}</Placeholder>;
  return (
    <>
      {filled.map((entry, i) => (
        <div key={i} style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
            <div>
              <span style={{ fontWeight: 700, fontFamily: design.layout === "elegant" ? serif : undefined }}>{entry.title}</span>
              {entry.place && <span style={{ color: muted }}> — {entry.place}</span>}
            </div>
            {entry.dates && <div style={{ color: design.layout === "impact" || design.layout === "moderne" ? design.color : muted, fontSize: 10.5, whiteSpace: "nowrap", fontWeight: 600 }}>{entry.dates}</div>}
          </div>
          {splitLines(entry.details).length > 0 && (
            <ul style={{ margin: "3px 0 0", paddingLeft: 15, listStyle: "disc" }}>
              {splitLines(entry.details).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </>
  );
}

function Items({ items, design }: { items: string[]; design: CvDesign }) {
  if (design.layout === "moderne" || design.layout === "impact") {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {items.map((item) => (
          <span key={item} style={{ background: tint(design.color, 12), color: ink, borderRadius: 4, padding: "1px 6px 1px 8px", fontSize: 11 }}>
            {item}
            {/* Virgule de la couleur de la pastille : invisible, mais les
                logiciels de tri lisent les compétences une par une. */}
            <span style={{ color: tint(design.color, 12) }}>,</span>
          </span>
        ))}
      </div>
    );
  }
  return <p style={{ margin: 0 }}>{items.join(" · ")}</p>;
}

function Header({ cv, design }: { cv: CvInput; design: CvDesign }) {
  const { layout, color } = design;
  const name = `${cv.firstName} ${cv.lastName}`.trim();
  const contact = [cv.city, cv.phone, cv.email, cv.link].map((item) => item.trim()).filter(Boolean);
  const nameNode = name || <Placeholder>Prénom Nom</Placeholder>;
  const headlineNode = cv.headline.trim() || <Placeholder>Titre : le poste et le contrat que tu cherches</Placeholder>;
  const contactNode = contact.length > 0 ? contact.join(" · ") : <Placeholder>Ville · téléphone · mail</Placeholder>;
  const availability = cv.availability.trim() && (
    <div style={{ marginTop: 4 }}>
      <strong>{cv.contract === "alternance" ? "Rythme et rentrée" : "Disponibilité"} :</strong> {cv.availability.trim()}
    </div>
  );

  if (layout === "moderne") {
    return (
      <header>
        <div style={{ background: color, color: "#ffffff", padding: "16px 18px", borderRadius: 6 }}>
          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.01em", lineHeight: 1.15 }}>{nameNode}</div>
          <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 3 }}>{headlineNode}</div>
          <div style={{ marginTop: 5, fontSize: 11 }}>{contactNode}</div>
        </div>
        {availability}
      </header>
    );
  }
  if (layout === "epure") {
    return (
      <header style={{ textAlign: "center", paddingBottom: 10, borderBottom: "1px solid #dadce0" }}>
        <div style={{ fontSize: 23, letterSpacing: "0.14em", textTransform: "uppercase", lineHeight: 1.2 }}>{nameNode}</div>
        <div style={{ fontSize: 12, color, fontWeight: 700, letterSpacing: "0.05em", marginTop: 5 }}>{headlineNode}</div>
        <div style={{ color: muted, marginTop: 4 }}>{contactNode}</div>
        {availability}
      </header>
    );
  }
  if (layout === "elegant") {
    return (
      <header style={{ paddingBottom: 9, borderBottom: `2px solid ${color}` }}>
        <div style={{ fontFamily: serif, fontSize: 28, lineHeight: 1.15 }}>{nameNode}</div>
        <div style={{ fontFamily: serif, fontStyle: "italic", fontSize: 14.5, color, marginTop: 3 }}>{headlineNode}</div>
        <div style={{ color: muted, marginTop: 4 }}>{contactNode}</div>
        {availability}
      </header>
    );
  }
  if (layout === "impact") {
    return (
      <header>
        <div style={{ fontSize: 28, fontWeight: 800, color, letterSpacing: "-0.02em", lineHeight: 1.1 }}>{nameNode}</div>
        <div aria-hidden style={{ width: 54, height: 4, background: color, borderRadius: 2, margin: "7px 0 6px" }} />
        <div style={{ fontSize: 13.5, fontWeight: 700 }}>{headlineNode}</div>
        <div style={{ color: muted, marginTop: 3 }}>{contactNode}</div>
        {availability}
      </header>
    );
  }
  return (
    <header>
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.01em" }}>{nameNode}</div>
      <div style={{ fontSize: 13.5, color, fontWeight: 700, marginTop: 2 }}>{headlineNode}</div>
      <div style={{ color: muted, marginTop: 4 }}>{contactNode}</div>
      {availability}
    </header>
  );
}

export function CvSheet({ cv, design = DEFAULT_CV_DESIGN }: { cv: CvInput; design?: CvDesign }) {
  const skills = splitList(cv.skills);
  const qualities = splitList(cv.qualities ?? "");
  const languages = splitList(cv.languages);
  const interests = splitList(cv.interests);
  const body = (
    <>
      <Header cv={cv} design={design} />
      <Section title="Profil" design={design}>
        {cv.summary.trim() ? <p style={{ margin: 0 }}>{cv.summary.trim()}</p> : <Placeholder>2 lignes : qui tu es, ce que tu cherches, ce que tu apportes</Placeholder>}
      </Section>
      <Section title="Formation" design={design}>
        <Entries entries={cv.education} emptyLabel="Ta formation actuelle et celle que tu vises" design={design} />
      </Section>
      <Section title="Expériences" design={design}>
        <Entries entries={cv.experience} emptyLabel="Jobs, stages, projets, bénévolat : tout compte" design={design} />
      </Section>
      <Section title="Compétences" design={design}>
        {skills.length > 0 ? <Items items={skills} design={design} /> : <Placeholder>Logiciels, savoir-faire</Placeholder>}
      </Section>
      {qualities.length > 0 && (
        <Section title="Qualités" design={design}>
          <Items items={qualities} design={design} />
        </Section>
      )}
      <Section title="Langues" design={design}>
        {languages.length > 0 ? languages.join(" · ") : <Placeholder>Anglais : niveau B1</Placeholder>}
      </Section>
      {interests.length > 0 && (
        <Section title="Centres d'intérêt" design={design}>
          {interests.join(" · ")}
        </Section>
      )}
    </>
  );
  return (
    <div
      className="cv-sheet"
      style={{
        background: "#ffffff",
        color: ink,
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: 11.5,
        lineHeight: 1.45,
        padding: "28px 30px",
        borderRadius: 6,
        boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {design.layout === "bandeau" ? <div style={{ borderLeft: `8px solid ${design.color}`, paddingLeft: 18 }}>{body}</div> : body}
    </div>
  );
}
