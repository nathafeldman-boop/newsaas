"use server";

import { assertAdminSession } from "@/lib/admin/accessCode";
import { searchLbaJobs, sendLbaApplication, LbaError } from "@/lib/laBonneAlternance/client";
import { mapLbaJob } from "@/lib/laBonneAlternance/mapOffer";
import { normalizePhone } from "@/lib/laBonneAlternance/applicant";

// Test de bout en bout avec la clé SANDBOX (LBA_SANDBOX_KEY) : recherche
// d'offres puis candidature, routées par La bonne alternance vers son
// environnement de recette -- rien n'arrive chez de vrais recruteurs et rien
// n'est écrit dans la base Stageio. Sert à valider le format de nos appels
// avant de brancher la clé de production (LBA_API_KEY).

export type LbaTestResult = {
  ok: boolean;
  steps: { label: string; ok: boolean; detail: string }[];
  samples: { title: string; company: string; location: string; recipient: string }[];
};

// CV de test : PDF minimal valide d'une page (« CV de test Stageio »).
function testCvPdf(): string {
  const content = "BT /F1 18 Tf 72 760 Td (CV de test Stageio) Tj ET";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return `data:application/pdf;base64,${Buffer.from(pdf, "latin1").toString("base64")}`;
}

function errorDetail(err: unknown): string {
  if (err instanceof LbaError) return err.message;
  return err instanceof Error ? err.message : String(err);
}

export async function testLbaSandboxAction(_prev: LbaTestResult | null, formData: FormData): Promise<LbaTestResult> {
  await assertAdminSession();
  const steps: LbaTestResult["steps"] = [];
  const key = process.env.LBA_SANDBOX_KEY?.trim();
  if (!key) {
    return { ok: false, steps: [{ label: "Clé sandbox", ok: false, detail: "LBA_SANDBOX_KEY absente des variables Vercel (puis Redeploy)." }], samples: [] };
  }

  const departement = String(formData.get("departement") ?? "75").trim() || "75";
  let jobs;
  try {
    jobs = await searchLbaJobs(departement, key);
  } catch (err) {
    steps.push({ label: `Recherche d'offres (${departement})`, ok: false, detail: errorDetail(err) });
    return { ok: false, steps, samples: [] };
  }
  const mapped = jobs.map((job) => mapLbaJob(job, departement, new Date().toISOString())).filter((o) => o !== null);
  steps.push({
    label: `Recherche d'offres (${departement})`,
    ok: true,
    detail: `${jobs.length} offre(s) reçue(s), dont ${mapped.length} avec envoi direct possible.`,
  });
  const samples = mapped.slice(0, 5).map((o) => ({ title: o.title, company: o.company, location: o.location, recipient: o.external_id }));

  if (formData.get("send") !== "on") return { ok: true, steps, samples };

  const email = String(formData.get("email") ?? "").trim();
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  const target = mapped[0];
  if (!target) {
    steps.push({ label: "Candidature test", ok: false, detail: "Aucune offre avec envoi direct dans ce département : essaie un autre (69, 13, 33…)." });
    return { ok: false, steps, samples };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !phone) {
    steps.push({ label: "Candidature test", ok: false, detail: "Indique ton email et ton téléphone pour la candidature test." });
    return { ok: false, steps, samples };
  }
  try {
    const { id } = await sendLbaApplication(
      {
        applicant_first_name: "Test",
        applicant_last_name: "Stageio",
        applicant_email: email,
        applicant_phone: phone,
        applicant_attachment_name: "CV Test Stageio.pdf",
        applicant_attachment_content: testCvPdf(),
        applicant_message: "Candidature de test envoyée depuis Stageio (environnement sandbox de La bonne alternance).",
        recipient_id: target.external_id,
      },
      key,
    );
    steps.push({ label: "Candidature test", ok: true, detail: `Acceptée par La bonne alternance (id ${id}) pour « ${target.title} » chez ${target.company}.` });
    return { ok: true, steps, samples };
  } catch (err) {
    steps.push({ label: "Candidature test", ok: false, detail: errorDetail(err) });
    return { ok: false, steps, samples };
  }
}
