import { z } from "zod";
import { getGroqClient, getGroqModel } from "@/lib/groq/client";

export type InterviewLevel = "facile" | "medium" | "difficile";

// Nombre de questions lié au niveau plutôt que choisi séparément : plus le
// niveau monte, plus l'entretien simulé est long ET exigeant -- un entretien
// "facile" de 30 questions serait aussi peu réaliste qu'un "difficile" de 10.
export const QUESTION_COUNT_BY_LEVEL: Record<InterviewLevel, number> = {
  facile: 10,
  medium: 20,
  difficile: 30,
};

const LEVEL_LABEL: Record<InterviewLevel, string> = {
  facile: "débutant/junior (questions d'entretien classiques, pas de piège)",
  medium: "intermédiaire (questions comportementales + techniques de base, quelques nuances entre les réponses)",
  difficile: "avancé (questions techniques poussées et mises en situation, distracteurs plausibles qui piègent une compréhension superficielle)",
};

const interviewQuestionSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string().min(1)).min(4).max(7),
  correctIndex: z.number().int().min(0),
  explanation: z.string().min(1),
});

const interviewQuizSchema = z.object({
  questions: z.array(interviewQuestionSchema).min(1),
});

export type InterviewQuestion = z.infer<typeof interviewQuestionSchema>;

const SYSTEM_PROMPT = `Tu es un recruteur senior français qui prépare des étudiants et jeunes
diplômés à un entretien d'embauche pour une alternance ou un stage, via un quiz à choix
multiples. Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour, de la forme :

{
  "questions": [
    {
      "question": string (une question d'entretien réaliste, en français),
      "options": string[] (entre 5 et 7 réponses possibles, une seule correcte, les autres
        plausibles mais clairement moins bonnes -- jamais absurdes ou hors-sujet),
      "correctIndex": number (index 0-based de la bonne réponse dans "options"),
      "explanation": string (2-3 phrases : pourquoi cette réponse est la meilleure, et ce que
        les autres options ont de moins bon -- utile même pour quelqu'un qui a bien répondu)
    }
  ]
}

Les questions couvrent un mélange de comportemental ("parle-moi d'une fois où...", motivation,
soft skills) et de technique/métier propre au poste visé. Elles doivent rester réalistes pour
un entretien d'alternance/stage en France (jamais des questions de poste senior). Varie les
formulations et les angles d'une question à l'autre -- jamais deux questions qui testent
exactement la même chose.`;

function buildUserPrompt(job: string, level: InterviewLevel, count: number): string {
  return `Métier/poste visé : ${job}.
Niveau de difficulté : ${level} -- ${LEVEL_LABEL[level]}.
Génère exactement ${count} questions à choix multiples pour ce métier et ce niveau.`;
}

export async function generateInterviewQuiz(
  job: string,
  level: InterviewLevel,
): Promise<InterviewQuestion[]> {
  const client = getGroqClient();
  const model = getGroqModel();
  const count = QUESTION_COUNT_BY_LEVEL[level];

  const result = await client.chat.completions.create({
    model,
    temperature: 0.5,
    max_tokens: 8000,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(job, level, count) },
    ],
  });

  const text = result.choices?.[0]?.message?.content ?? "";

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("L'IA n'a pas renvoyé de JSON exploitable.");
  }

  const { questions } = interviewQuizSchema.parse(parsed);

  // Filet de sécurité : un correctIndex hors bornes (rare mais possible avec
  // un LLM) rendrait la correction incohérente plutôt que de faire planter
  // tout le quiz -- on écarte juste la question concernée.
  const valid = questions.filter((q) => q.correctIndex < q.options.length);
  if (valid.length === 0) {
    throw new Error("Aucune question exploitable générée.");
  }

  return valid.slice(0, count);
}
