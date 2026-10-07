import { isEmptyEntry, splitLines, splitList, type CvEntry, type CvInput } from "@/lib/tools/cv";

// Rendu du CV, partagé par l'aperçu du générateur (client) et les exemples
// de la page (serveur). Couleurs fixes, noir sur blanc : c'est une feuille
// à imprimer, pas une partie du thème du site. Champs vides : texte gris
// entre crochets, pour montrer quoi remplir.

const ink = "#1a1a1a";
const muted = "#5f6368";
const accent = "#0f8a5f";

function Placeholder({ children }: { children: string }) {
  return <span style={{ color: "#9aa0a6" }}>[{children}]</span>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 14 }}>
      <h3
        style={{
          fontSize: 11,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: accent,
          margin: "0 0 6px",
          paddingBottom: 3,
          borderBottom: `1px solid ${accent}`,
        }}
      >
        {title}
      </h3>
      {children}
    </section>
  );
}

function Entries({ entries, emptyLabel }: { entries: CvEntry[]; emptyLabel: string }) {
  const filled = entries.filter((entry) => !isEmptyEntry(entry));
  if (filled.length === 0) return <Placeholder>{emptyLabel}</Placeholder>;
  return (
    <>
      {filled.map((entry, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "78px 1fr", gap: 8, marginBottom: 8 }}>
          <div style={{ color: muted, fontSize: 10.5 }}>{entry.dates}</div>
          <div>
            <div style={{ fontWeight: 700 }}>
              {entry.title}
              {entry.place && <span style={{ fontWeight: 400, color: muted }}> — {entry.place}</span>}
            </div>
            {splitLines(entry.details).length > 0 && (
              <ul style={{ margin: "3px 0 0", paddingLeft: 14, listStyle: "disc" }}>
                {splitLines(entry.details).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ))}
    </>
  );
}

export function CvSheet({ cv }: { cv: CvInput }) {
  const name = `${cv.firstName} ${cv.lastName}`.trim();
  const contact = [cv.city, cv.phone, cv.email, cv.link].map((item) => item.trim()).filter(Boolean);
  const skills = splitList(cv.skills);
  const languages = splitList(cv.languages);
  const interests = splitList(cv.interests);
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
      }}
    >
      <header>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.01em" }}>{name || <Placeholder>Prénom Nom</Placeholder>}</div>
        <div style={{ fontSize: 13.5, color: accent, fontWeight: 700, marginTop: 2 }}>
          {cv.headline.trim() || <Placeholder>Titre : le poste et le contrat que tu cherches</Placeholder>}
        </div>
        <div style={{ color: muted, marginTop: 4 }}>{contact.length > 0 ? contact.join(" · ") : <Placeholder>Ville · téléphone · mail</Placeholder>}</div>
        {cv.availability.trim() && (
          <div style={{ marginTop: 4 }}>
            <strong>{cv.contract === "alternance" ? "Rythme et rentrée" : "Disponibilité"} :</strong> {cv.availability.trim()}
          </div>
        )}
      </header>

      <Section title="Profil">{cv.summary.trim() ? <p style={{ margin: 0 }}>{cv.summary.trim()}</p> : <Placeholder>2 lignes : qui tu es, ce que tu cherches, ce que tu apportes</Placeholder>}</Section>
      <Section title="Formation">
        <Entries entries={cv.education} emptyLabel="Ta formation actuelle et celle que tu vises" />
      </Section>
      <Section title="Expériences">
        <Entries entries={cv.experience} emptyLabel="Jobs, stages, projets, bénévolat : tout compte" />
      </Section>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <Section title="Compétences">
          {skills.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: 14, listStyle: "disc" }}>
              {skills.map((skill) => (
                <li key={skill}>{skill}</li>
              ))}
            </ul>
          ) : (
            <Placeholder>Logiciels, savoir-faire</Placeholder>
          )}
        </Section>
        <div>
          <Section title="Langues">{languages.length > 0 ? languages.join(" · ") : <Placeholder>Anglais : niveau B1</Placeholder>}</Section>
          {interests.length > 0 && <Section title="Centres d'intérêt">{interests.join(" · ")}</Section>}
        </div>
      </div>
    </div>
  );
}
