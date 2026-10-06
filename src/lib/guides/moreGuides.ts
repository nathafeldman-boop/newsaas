import type { Guide } from "@/lib/guides/guidesData";

// Guides 5 à 10 (Phase 3 de SEO_ROADMAP.md) : sujets très recherchés par
// les 18-25 ans et sans chiffres légaux susceptibles de changer, sauf
// "trouver-un-stage" (gratification et durée max, mêmes valeurs vérifiées
// que dans legalRates.ts et le guide alternance-vs-stage). Chaque section
// commence par une réponse directe, pour viser les extraits en vedette.
export const MORE_GUIDES: Guide[] = [
  {
    slug: "entretien-alternance",
    title: "Entretien d'alternance : les questions qu'on va te poser et comment y répondre",
    metaDescription:
      "Présente-toi, pourquoi l'alternance, pourquoi nous, tes défauts… Les questions classiques d'un entretien d'alternance, ce que le recruteur cherche vraiment et comment répondre.",
    publishedAt: "2026-10-06",
    updatedAt: "2026-10-06",
    intro: [
      "Un entretien d'alternance ressemble à un entretien d'embauche classique, avec une grosse différence : le recruteur sait que tu débutes. Il ne cherche pas un expert, il cherche quelqu'un de motivé, fiable et capable de tenir le rythme école-entreprise. Voici les questions qui reviennent presque à chaque fois et comment y répondre.",
    ],
    sections: [
      {
        heading: "Les 10 questions les plus posées en entretien d'alternance",
        list: [
          "« Présente-toi » : 1 min 30 maximum. Ta formation, ce que tu as déjà fait (projets, jobs, associatif), et pourquoi ce poste maintenant.",
          "« Pourquoi l'alternance ? » : montre que c'est un choix (apprendre en faisant, être autonome financièrement, te professionnaliser), pas juste un moyen de payer l'école.",
          "« Pourquoi notre entreprise ? » : cite un élément précis (un produit, un projet récent, une valeur) trouvé sur leur site ou leur LinkedIn.",
          "« Que sais-tu de notre activité ? » : 2 ou 3 faits concrets suffisent, l'important est de montrer que tu as cherché.",
          "« Quelles sont tes qualités ? » : 2 qualités max, chacune avec un exemple vécu.",
          "« Et tes défauts ? » : un vrai défaut, pas rédhibitoire pour le poste, et ce que tu fais pour le corriger.",
          "« Comment vas-tu gérer le rythme école-entreprise ? » : parle d'organisation (agenda, priorités) et montre que tu connais déjà ton calendrier d'alternance.",
          "« Raconte une difficulté que tu as surmontée » : situation, ce que tu as fait, résultat. Court et concret.",
          "« Où te vois-tu dans 3 ans ? » : dans le métier visé, avec plus de responsabilités. Pas besoin d'un plan de carrière parfait.",
          "« As-tu des questions ? » : toujours oui (voir plus bas).",
        ],
      },
      {
        heading: "Comment répondre à « Présente-toi »",
        paragraphs: [
          "Utilise la structure passé, présent, futur : d'où tu viens (ta formation et une expérience marquante), où tu en es (ce que tu prépares, ce qui t'intéresse dans le métier), et où tu veux aller (pourquoi ce poste est la suite logique).",
          "Évite de réciter ton CV ligne par ligne : le recruteur l'a sous les yeux. Choisis 2 ou 3 éléments qui ont un lien direct avec l'offre.",
        ],
      },
      {
        heading: "Parler de tes défauts sans te griller",
        paragraphs: [
          "Le recruteur teste ta lucidité, pas ta perfection. Choisis un défaut réel mais compatible avec le poste (« j'ai tendance à vouloir tout vérifier moi-même ») et termine toujours par ce que tu mets en place (« j'apprends à déléguer en fixant des points d'étape »).",
          "À éviter : les faux défauts (« je suis trop perfectionniste ») et les défauts qui touchent le cœur du métier (être désorganisé pour un poste d'assistant).",
        ],
      },
      {
        heading: "Les questions à poser au recruteur",
        list: [
          "À quoi ressemblera une semaine type dans l'équipe ?",
          "Qui sera mon tuteur ou ma tutrice, et comment se passe le suivi ?",
          "Quels outils ou logiciels vais-je utiliser au quotidien ?",
          "Qu'est-ce qui fait qu'un alternant réussit bien chez vous ?",
          "Qu'ont fait les alternants précédents après leur contrat ?",
        ],
      },
      {
        heading: "Préparer ton entretien en 30 minutes",
        list: [
          "Relis l'offre et surligne les 3 compétences les plus importantes.",
          "Fais le tour du site et du LinkedIn de l'entreprise (actus récentes, chiffres clés).",
          "Prépare 3 exemples concrets tirés de tes expériences (même scolaires ou associatives).",
          "Garde ton calendrier d'alternance et tes dates de début sous la main.",
          "En visio : teste ta connexion et ton micro, et choisis un fond neutre.",
        ],
      },
      {
        heading: "Après l'entretien",
        paragraphs: [
          "Envoie un court mail de remerciement dans les 24 heures : merci pour l'échange, un point qui t'a motivé, ta disponibilité. Sans nouvelles à la date annoncée, relance poliment quelques jours après (voir notre guide sur la relance de candidature).",
        ],
      },
    ],
    faq: [
      {
        q: "Combien de temps dure un entretien d'alternance ?",
        a: "En général entre 30 minutes et 1 heure. Certaines entreprises font un premier échange téléphonique de 15 minutes avant l'entretien avec le manager.",
      },
      {
        q: "Que répondre si on me demande mes prétentions salariales ?",
        a: "En alternance, le salaire minimum est fixé par la loi selon ton âge et ton année de contrat. Tu peux répondre que tu te situes sur la grille légale (ou conventionnelle) et rester ouvert. Calcule ton minimum avec le simulateur de salaire Stageio.",
      },
      {
        q: "Faut-il apporter son CV à l'entretien ?",
        a: "Oui, une ou deux copies papier en présentiel : c'est rapide et ça montre que tu es préparé.",
      },
    ],
  },
  {
    slug: "relancer-candidature",
    title: "Relancer une candidature d'alternance ou de stage : quand et comment (modèles de mail)",
    metaDescription:
      "Au bout de combien de temps relancer, quoi écrire et combien de fois : la méthode pour relancer une candidature sans être lourd, avec 3 modèles de mail prêts à copier.",
    publishedAt: "2026-10-06",
    updatedAt: "2026-10-06",
    intro: [
      "Pas de réponse à ta candidature ? C'est le cas le plus fréquent, et ça ne veut presque jamais dire non : les recruteurs reçoivent beaucoup de candidatures et les traitent par vagues. Une relance bien faite te fait remonter en haut de la pile.",
    ],
    sections: [
      {
        heading: "Au bout de combien de temps relancer ?",
        paragraphs: [
          "Relance 7 à 10 jours ouvrés après l'envoi de ta candidature si tu n'as aucune réponse. Après un entretien, attends la date de retour annoncée, puis relance 2 ou 3 jours après ; si aucune date n'a été donnée, relance au bout d'une semaine.",
        ],
      },
      {
        heading: "Combien de fois relancer ?",
        paragraphs: [
          "Deux relances maximum, espacées d'une semaine. Sans réponse après ça, passe à autre chose : tu as fait ta part, et l'énergie est mieux placée dans de nouvelles candidatures.",
        ],
      },
      {
        heading: "Les règles d'une bonne relance",
        list: [
          "Court : 5 à 6 lignes, lisibles sur téléphone.",
          "Dans le même fil de mail que ta candidature, pour que le recruteur retrouve ton dossier en un clic.",
          "Rappelle le poste et la date de ta candidature.",
          "Ajoute un élément nouveau si tu peux : une disponibilité, un projet terminé, une certification obtenue.",
          "Termine par une question simple : « Ma candidature est-elle toujours à l'étude ? »",
        ],
      },
      {
        heading: "Modèle 1 : relance après une candidature",
        paragraphs: [
          "Objet : Candidature alternance [intitulé du poste] – [Prénom Nom]",
          "Bonjour [Madame/Monsieur Nom], je me permets de revenir vers vous au sujet de ma candidature au poste de [intitulé], envoyée le [date]. Ce poste correspond vraiment à ce que je recherche pour mon [diplôme] en alternance, notamment pour [un élément de l'offre]. Ma candidature est-elle toujours à l'étude ? Je reste disponible pour un échange quand vous le souhaitez. Bien cordialement, [Prénom Nom] – [téléphone]",
        ],
      },
      {
        heading: "Modèle 2 : relance après un entretien",
        paragraphs: [
          "Bonjour [Prénom Nom], merci encore pour notre échange du [date] au sujet du poste de [intitulé]. Notre discussion sur [un sujet abordé] a confirmé ma motivation à rejoindre votre équipe. Avez-vous pu avancer dans votre processus de recrutement ? Je reste disponible si vous avez besoin d'informations complémentaires. Bien cordialement, [Prénom Nom]",
        ],
      },
      {
        heading: "Modèle 3 : relance par LinkedIn ou téléphone",
        paragraphs: [
          "Sur LinkedIn : « Bonjour [Prénom], j'ai postulé le [date] au poste de [intitulé] chez [entreprise] et je suis très motivé par cette alternance. Savez-vous si les candidatures sont toujours à l'étude ? Merci d'avance ! »",
          "Au téléphone : présente-toi en une phrase, rappelle le poste et la date, et demande simplement où en est le recrutement. Prépare ton CV sous les yeux au cas où l'échange se transforme en mini-entretien.",
        ],
      },
      {
        heading: "Les erreurs à éviter",
        list: [
          "Relancer au bout de 2 jours : c'est trop tôt.",
          "Renvoyer exactement la même candidature sans rien ajouter.",
          "Un ton de reproche (« je n'ai toujours pas eu de réponse »).",
          "Relancer tous les jours, ou sur tous les canaux à la fois.",
        ],
      },
    ],
    faq: [
      {
        q: "Est-ce mal vu de relancer un recruteur ?",
        a: "Non, une relance polie montre ta motivation et ton sérieux. Ce qui est mal vu, c'est de relancer trop tôt ou trop souvent.",
      },
      {
        q: "Que faire si l'entreprise ne répond jamais ?",
        a: "Après deux relances sans réponse, considère la piste comme fermée et concentre-toi sur d'autres offres. Tu peux garder le contact sur LinkedIn pour une prochaine opportunité.",
      },
    ],
  },
  {
    slug: "candidature-spontanee-alternance",
    title: "Candidature spontanée en alternance : la méthode et un modèle de mail",
    metaDescription:
      "Beaucoup d'entreprises prennent des alternants sans publier d'offre. Comment les repérer, à qui écrire et quoi envoyer, avec un modèle de mail de candidature spontanée.",
    publishedAt: "2026-10-06",
    updatedAt: "2026-10-06",
    intro: [
      "Toutes les alternances ne sont pas publiées en ligne. Beaucoup d'entreprises, surtout les PME, accueillent des alternants chaque année sans jamais diffuser d'annonce. La candidature spontanée te permet d'arriver avant les autres, sans concurrence directe.",
    ],
    sections: [
      {
        heading: "Pourquoi la candidature spontanée marche en alternance",
        paragraphs: [
          "Pour une entreprise, recruter un alternant est un projet qui se prépare : si ta candidature arrive au bon moment, tu peux être la personne qui déclenche ce recrutement. Et comme il n'y a pas d'annonce, tu n'es pas comparé à des dizaines d'autres profils.",
        ],
      },
      {
        heading: "Quelles entreprises cibler",
        list: [
          "Celles qui ont déjà eu des alternants : cherche « alternant chez [entreprise] » sur LinkedIn.",
          "Les entreprises partenaires de ton école ou de ton CFA (demande la liste).",
          "Les entreprises qui publient déjà des offres dans ton métier : sur Stageio, les pages par métier et par ville listent les entreprises qui recrutent en ce moment.",
          "Les PME de ta ville dans ton secteur : moins sollicitées que les grands groupes.",
        ],
      },
      {
        heading: "À qui écrire",
        paragraphs: [
          "Au manager du service qui t'intéresse plutôt qu'à une adresse « contact » générique : c'est lui qui a besoin de renfort et qui décide. Trouve son nom sur LinkedIn ou sur le site de l'entreprise. Pour les grands groupes, passe aussi par leur page carrières, où il y a souvent un formulaire de candidature spontanée.",
        ],
      },
      {
        heading: "Ce qu'il faut envoyer",
        list: [
          "Un CV adapté au métier visé (pas ton CV générique).",
          "Un mail court qui remplace la lettre de motivation (modèle ci-dessous).",
          "Ton calendrier d'alternance (rythme école-entreprise) et ta date de début possible.",
          "Le diplôme préparé et le nom de ton école ou CFA.",
        ],
      },
      {
        heading: "Modèle de mail de candidature spontanée",
        paragraphs: [
          "Objet : Candidature spontanée – Alternance [métier] à partir de [mois]",
          "Bonjour [Madame/Monsieur Nom], étudiant en [diplôme] à [école], je recherche une alternance en [métier] à partir de [mois], au rythme de [rythme]. [Entreprise] m'intéresse particulièrement pour [raison précise : un produit, un projet, une valeur]. Lors de [expérience], j'ai [réalisation concrète], et j'aimerais mettre cette énergie au service de votre équipe [nom du service]. Vous trouverez mon CV en pièce jointe. Seriez-vous disponible pour un court échange ? Bien cordialement, [Prénom Nom] – [téléphone]",
        ],
      },
      {
        heading: "Et après ?",
        paragraphs: [
          "Sans réponse après 7 à 10 jours ouvrés, relance une fois (voir notre guide sur la relance de candidature). Garde un tableau de suivi : entreprise, contact, date d'envoi, date de relance, réponse.",
        ],
      },
    ],
    faq: [
      {
        q: "Faut-il joindre une lettre de motivation à une candidature spontanée ?",
        a: "Le mail fait office de lettre : il doit être court et personnalisé. Tu peux joindre une lettre en plus si l'entreprise le demande sur sa page carrières.",
      },
      {
        q: "Quand envoyer une candidature spontanée pour une alternance ?",
        a: "Idéalement 3 à 6 mois avant ta date de début, au moment où les entreprises préparent leurs recrutements d'alternants.",
      },
    ],
  },
  {
    slug: "trouver-un-stage",
    title: "Comment trouver un stage rapidement : la méthode en 7 étapes",
    metaDescription:
      "Quand chercher, où chercher, comment candidater et relancer : la méthode concrète pour décrocher un stage, plus les règles à connaître (convention, gratification, durée).",
    publishedAt: "2026-10-06",
    updatedAt: "2026-10-06",
    intro: [
      "Trouver un stage, c'est surtout une question de méthode : bien cibler, candidater régulièrement et relancer. Voici les 7 étapes qui font la différence, et les règles à connaître avant de signer.",
    ],
    sections: [
      {
        heading: "1. Commencer tôt",
        paragraphs: [
          "Commence à chercher 3 à 4 mois avant la date de début, et jusqu'à 6 mois pour un stage de fin d'études dans un grand groupe : leurs campagnes de recrutement démarrent tôt.",
        ],
      },
      {
        heading: "2. Définir ce que tu cherches",
        paragraphs: [
          "Métier visé, dates exactes, durée, ville ou télétravail possible : plus ta recherche est précise, plus tes candidatures sont convaincantes. Vérifie aussi ce que ton école exige (durée minimale, type de missions).",
        ],
      },
      {
        heading: "3. Préparer un CV et une lettre adaptables",
        paragraphs: [
          "Un CV d'une page centré sur tes compétences et tes projets, et une lettre de motivation que tu adaptes à chaque offre (voir notre guide sur la lettre de motivation de stage).",
        ],
      },
      {
        heading: "4. Chercher sur plusieurs canaux",
        list: [
          "Les plateformes d'offres comme Stageio, qui regroupent les offres de plusieurs sources et les trient selon ton profil.",
          "Le service stages et le réseau d'anciens de ton école.",
          "LinkedIn : offres, mais aussi messages directs aux managers.",
          "Les candidatures spontanées auprès des entreprises qui t'intéressent.",
        ],
      },
      {
        heading: "5. Candidater régulièrement",
        paragraphs: [
          "Mieux vaut 5 candidatures soignées par semaine pendant un mois que 50 envoyées le même soir. Note chaque envoi dans un tableau de suivi.",
        ],
      },
      {
        heading: "6. Relancer",
        paragraphs: [
          "Sans réponse au bout de 7 à 10 jours ouvrés, relance par mail. C'est souvent la relance qui déclenche l'entretien (voir notre guide avec modèles de mail).",
        ],
      },
      {
        heading: "7. Préparer les entretiens",
        paragraphs: [
          "Renseigne-toi sur l'entreprise, prépare 3 exemples concrets de ce que tu sais faire et des questions à poser. Les questions sont proches de celles d'un entretien d'alternance (voir notre guide dédié).",
        ],
      },
      {
        heading: "Les règles à connaître avant de signer",
        table: {
          headers: ["Règle", "Ce que dit la loi"],
          rows: [
            ["Convention de stage", "Obligatoire, signée par toi, l'entreprise et ton établissement"],
            ["Gratification", "Obligatoire au-delà de 2 mois (44 jours ou 308 heures) : minimum 4,50 € par heure en 2026"],
            ["Durée maximale", "6 mois par année d'enseignement dans la même entreprise (924 heures)"],
          ],
        },
      },
    ],
    faq: [
      {
        q: "Quand commencer à chercher un stage ?",
        a: "3 à 4 mois avant la date de début, et jusqu'à 6 mois avant pour un stage de fin d'études dans un grand groupe.",
      },
      {
        q: "Un stage de moins de 2 mois est-il payé ?",
        a: "Pas obligatoirement : la gratification n'est obligatoire qu'au-delà de 2 mois de présence (44 jours ou 308 heures). L'entreprise peut toutefois en verser une.",
      },
      {
        q: "Peut-on faire un stage sans convention ?",
        a: "Non, la convention de stage signée par l'étudiant, l'entreprise et l'établissement est obligatoire.",
      },
    ],
    sources: [
      { label: "Gratification minimale de stage (service-public.gouv.fr)", url: "https://entreprendre.service-public.gouv.fr/vosdroits/F32131" },
      { label: "Durée maximale d'un stage (justice.fr)", url: "https://www.justice.fr/fiche/stage-etudiant-milieu-professionnel" },
    ],
  },
  {
    slug: "rapport-de-stage",
    title: "Rapport de stage : plan type, contenu de chaque partie et erreurs à éviter",
    metaDescription:
      "Le plan d'un rapport de stage partie par partie (introduction, entreprise, missions, bilan), la longueur habituelle et les erreurs qui coûtent des points.",
    publishedAt: "2026-10-06",
    updatedAt: "2026-10-06",
    intro: [
      "Le rapport de stage sert à montrer ce que tu as fait, mais surtout ce que tu as compris et appris. Voici le plan qu'attendent la plupart des écoles et ce qu'il faut mettre dans chaque partie.",
    ],
    sections: [
      {
        heading: "D'abord : la consigne de ton école prime",
        paragraphs: [
          "Chaque école a ses attentes (nombre de pages, parties obligatoires, problématique ou non). Relis la consigne avant d'écrire la première ligne : un rapport parfait mais hors consigne perd des points.",
        ],
      },
      {
        heading: "Le plan type d'un rapport de stage",
        list: [
          "Page de garde : ton nom, ton école, l'entreprise, les dates, ton tuteur.",
          "Remerciements : courts et sincères (tuteur, équipe, école).",
          "Sommaire.",
          "Introduction.",
          "Présentation de l'entreprise et de ton service.",
          "Tes missions et réalisations.",
          "Analyse et bilan : compétences acquises, difficultés, regard critique.",
          "Conclusion.",
          "Annexes : documents utiles, numérotés et cités dans le texte.",
        ],
      },
      {
        heading: "Ce qu'il faut mettre dans l'introduction",
        paragraphs: [
          "Présente le contexte (ta formation, pourquoi ce stage), l'entreprise en une ou deux phrases, ta mission principale et, si ton école le demande, la problématique. Termine par l'annonce du plan.",
        ],
      },
      {
        heading: "La partie missions : du concret",
        paragraphs: [
          "Décris 2 à 4 missions importantes plutôt qu'une liste de tâches : le contexte, ce que tu as fait, les outils utilisés et le résultat (avec des chiffres si possible : délais tenus, volume traité, amélioration obtenue).",
        ],
      },
      {
        heading: "Le bilan : ce qui fait la différence",
        paragraphs: [
          "C'est la partie la plus lue. Montre ce que tu as appris (compétences techniques et relationnelles), les difficultés rencontrées et comment tu les as gérées, et ce que ce stage change pour ton projet professionnel.",
        ],
      },
      {
        heading: "Quelle longueur ?",
        paragraphs: [
          "Cela dépend de l'école et du niveau : souvent une vingtaine de pages hors annexes pour un stage de licence, davantage pour un stage de fin d'études. Suis la consigne : plus long n'est pas mieux noté.",
        ],
      },
      {
        heading: "Les erreurs qui coûtent des points",
        list: [
          "Copier la présentation de l'entreprise depuis son site.",
          "Lister des tâches sans expliquer leur intérêt ni leur résultat.",
          "Un bilan qui se limite à « ce stage m'a beaucoup apporté ».",
          "Les fautes d'orthographe : fais relire.",
          "Divulguer des informations confidentielles : demande à ton tuteur ce que tu peux citer.",
        ],
      },
      {
        heading: "Le conseil qui fait gagner des heures",
        paragraphs: [
          "Prends des notes chaque semaine pendant ton stage : ce que tu as fait, les outils, les difficultés, les résultats. Au moment d'écrire, tu auras toute la matière au lieu de chercher tes souvenirs.",
        ],
      },
    ],
    faq: [
      {
        q: "Combien de pages pour un rapport de stage ?",
        a: "Cela dépend de ton école : souvent une vingtaine de pages hors annexes en licence, davantage en fin d'études. La consigne de l'école fait foi.",
      },
      {
        q: "Faut-il une problématique dans un rapport de stage ?",
        a: "Seulement si ton école la demande, ce qui est fréquent en master et en école de commerce ou d'ingénieurs.",
      },
    ],
  },
  {
    slug: "lettre-de-motivation-stage",
    title: "Lettre de motivation pour un stage : structure et exemple",
    metaDescription:
      "La structure vous-moi-nous, la bonne longueur et un exemple de lettre de motivation pour un stage à adapter, avec les erreurs qui font décrocher le recruteur.",
    publishedAt: "2026-10-06",
    updatedAt: "2026-10-06",
    intro: [
      "Une lettre de motivation de stage doit répondre à une seule question : pourquoi toi, pour ce stage, dans cette entreprise ? Voici la structure qui marche et un exemple à adapter.",
    ],
    sections: [
      {
        heading: "La structure en 3 paragraphes : vous, moi, nous",
        list: [
          "Vous : ce qui t'attire dans l'entreprise et dans ce stage précis (un projet, un produit, une valeur).",
          "Moi : ce que tu apportes, avec 1 ou 2 exemples concrets (projet, job, association) en lien avec les missions.",
          "Nous : ce que vous allez construire ensemble pendant le stage et ta demande d'entretien.",
        ],
      },
      {
        heading: "Quelle longueur ?",
        paragraphs: [
          "Une demi-page à une page maximum, soit 170 à 250 mots. Un recruteur lit une lettre en quelques dizaines de secondes : chaque phrase doit servir.",
        ],
      },
      {
        heading: "Exemple de lettre de motivation de stage",
        paragraphs: [
          "Objet : Candidature au stage [intitulé] – [dates]",
          "Madame, Monsieur, [Entreprise] développe [projet ou produit précis], et c'est exactement le type de projet sur lequel je veux progresser pendant mon stage de [durée] à partir de [date].",
          "Étudiant en [formation] à [école], j'ai [réalisation concrète liée aux missions, ex. : mené un projet d'étude de marché pour une association, analysé ses ventes et proposé 3 actions dont 2 ont été mises en place]. Cette expérience m'a appris [compétence utile pour le poste].",
          "Rejoindre votre équipe [service] me permettrait de [ce que tu veux apprendre] tout en vous apportant [ce que tu sais déjà faire]. Je serais ravi d'en discuter lors d'un entretien. Je vous prie d'agréer, Madame, Monsieur, mes salutations distinguées. [Prénom Nom]",
        ],
      },
      {
        heading: "Les erreurs à éviter",
        list: [
          "La lettre passe-partout envoyée à toutes les entreprises : ça se voit tout de suite.",
          "Répéter ton CV au lieu de l'illustrer.",
          "Parler uniquement de ce que le stage t'apporte, sans dire ce que tu apportes.",
          "Les formules toutes faites (« dynamique et motivé ») sans preuve.",
          "Oublier les dates et la durée du stage.",
        ],
      },
      {
        heading: "Gagner du temps sans perdre en qualité",
        paragraphs: [
          "Garde une base solide et adapte à chaque offre le paragraphe « vous » et l'exemple du paragraphe « moi ». Avec Stageio, la lettre est générée pour chaque offre à partir de ton profil : tu n'as plus qu'à la relire et la personnaliser.",
        ],
      },
    ],
    faq: [
      {
        q: "Faut-il une lettre de motivation pour un stage ?",
        a: "Souvent oui, surtout pour les candidatures spontanées et les grandes entreprises. Quand elle est facultative, une lettre courte et ciblée reste un vrai plus.",
      },
      {
        q: "Lettre de motivation ou mail de candidature ?",
        a: "Si tu postules par mail, le corps du mail doit être une version courte de ta lettre (5 à 8 lignes), avec la lettre complète en pièce jointe si l'offre la demande.",
      },
    ],
  },
  {
    slug: "contrat-apprentissage-ou-contrat-pro",
    title: "Contrat d'apprentissage ou contrat de professionnalisation : les différences en 2026",
    metaDescription:
      "Âge, durée, formation, salaire, diplôme : le comparatif clair entre contrat d'apprentissage et contrat de professionnalisation, pour choisir la bonne alternance en 2026.",
    publishedAt: "2026-10-07",
    updatedAt: "2026-10-07",
    intro: [
      "Les deux sont des contrats d'alternance : tu es salarié, tu alternes entreprise et formation, et ta formation est gratuite pour toi. Mais ils ne visent pas le même public, ne durent pas pareil et ne paient pas pareil. Le comparatif en un coup d'œil.",
    ],
    sections: [
      {
        heading: "Le comparatif en un tableau",
        table: {
          headers: ["", "Contrat d'apprentissage", "Contrat de professionnalisation"],
          rows: [
            ["Pour qui", "16 à 29 ans (jusqu'à la veille des 30 ans), avec des exceptions", "16 à 25 ans, demandeurs d'emploi de 26 ans et plus, bénéficiaires du RSA, de l'ASS ou de l'AAH"],
            ["Objectif", "Un diplôme ou un titre professionnel (RNCP)", "Une qualification professionnelle (titre RNCP, CQP ou qualification reconnue par la branche)"],
            ["Durée", "6 mois à 3 ans, selon la durée de la formation", "6 à 12 mois en général, jusqu'à 36 mois dans certains cas"],
            ["Part de formation", "Au moins 25 % du temps", "15 à 25 % de la durée, 150 heures minimum"],
            ["Salaire minimum", "27 % à 100 % du SMIC selon l'âge et l'année", "55 % à 80 % du SMIC avant 26 ans, au moins le SMIC après"],
            ["Cotisations", "Allégées (rien jusqu'à 50 % du SMIC pour les contrats récents)", "Cotisations salariales normales"],
          ],
        },
      },
      {
        heading: "Lequel choisir ?",
        list: [
          "Tu prépares un diplôme (BTS, bachelor, licence pro, master, diplôme d'ingénieur) : c'est presque toujours l'apprentissage.",
          "Tu vises une formation courte et très professionnelle, ou tu as plus de 29 ans et tu es demandeur d'emploi : le contrat pro est souvent la seule option.",
          "Côté salaire : le contrat pro paie plus en 1re année, mais l'apprentissage progresse chaque année et presque sans cotisations.",
        ],
      },
      {
        heading: "Ce qui est pareil dans les deux contrats",
        list: [
          "Tu es salarié : congés payés, mutuelle d'entreprise, droits à la retraite et au chômage.",
          "Tu as un tuteur ou maître d'apprentissage dans l'entreprise.",
          "Ta formation est financée : tu ne paies pas l'école.",
          "Le temps passé en formation compte comme du temps de travail.",
        ],
      },
      {
        heading: "Les exceptions à la limite d'âge en apprentissage",
        paragraphs: [
          "Pas de limite d'âge pour les personnes en situation de handicap, les sportifs de haut niveau et les personnes qui ont un projet de création ou de reprise d'entreprise nécessitant le diplôme. La limite passe à 35 ans pour enchaîner sur un diplôme supérieur à celui déjà obtenu en apprentissage, ou si ton contrat précédent a été rompu pour une raison indépendante de ta volonté.",
        ],
      },
    ],
    faq: [
      {
        q: "Quelle est la différence de salaire entre apprentissage et contrat pro ?",
        a: "En apprentissage, le minimum va de 27 % à 100 % du SMIC selon ton âge et ton année de contrat. En contrat pro, il va de 55 % à 80 % du SMIC avant 26 ans, selon ton âge et ton niveau de diplôme, et au moins le SMIC à partir de 26 ans. Calcule ton montant avec le simulateur Stageio.",
      },
      {
        q: "Peut-on faire un master en contrat de professionnalisation ?",
        a: "C'est possible si le master est inscrit au RNCP et que l'école le propose, mais la grande majorité des masters en alternance se font en apprentissage.",
      },
      {
        q: "Combien de temps dure un contrat d'apprentissage ?",
        a: "Entre 6 mois et 3 ans : la durée correspond en principe à celle de la formation préparée.",
      },
    ],
    sources: [
      { label: "Durée du contrat d'apprentissage (Code du travail, L6222-7-1)", url: "https://code.travail.gouv.fr/code-du-travail/l6222-7-1" },
      { label: "Contrat d'apprentissage (justice.fr)", url: "https://www.justice.fr/fiche/contrat-apprentissage" },
      { label: "Contrat de professionnalisation (service-public.gouv.fr)", url: "https://www.service-public.gouv.fr/particuliers/vosdroits/F15478" },
      { label: "Rémunération du contrat pro 2026 (Legisocial)", url: "https://www.legisocial.fr/reperes-sociaux/remuneration-contrat-professionnalisation-2026.html" },
    ],
  },
  {
    slug: "rupture-contrat-apprentissage",
    title: "Rupture du contrat d'apprentissage : comment arrêter ton alternance (et dans quels cas)",
    metaDescription:
      "Pendant les 45 premiers jours, après, par accord, par démission avec le médiateur ou par licenciement : toutes les façons de rompre un contrat d'apprentissage et les délais à respecter.",
    publishedAt: "2026-10-07",
    updatedAt: "2026-10-07",
    intro: [
      "Ton alternance ne se passe pas comme prévu ? Un contrat d'apprentissage peut être rompu, mais les règles changent complètement selon que tu es dans les 45 premiers jours ou après. Voici les cas possibles.",
    ],
    sections: [
      {
        heading: "Pendant les 45 premiers jours en entreprise : rupture libre",
        paragraphs: [
          "Pendant les 45 premiers jours, consécutifs ou non, de formation pratique en entreprise, toi comme l'employeur pouvez rompre le contrat sans justification et sans préavis. La rupture doit être faite par écrit et notifiée au CFA et à l'organisme qui a enregistré le contrat.",
        ],
      },
      {
        heading: "Après 45 jours : 3 façons de rompre",
        list: [
          "D'un commun accord : toi et l'employeur signez une rupture écrite, sans préavis. C'est la solution la plus simple si vous êtes d'accord.",
          "Par ta démission : tu dois d'abord saisir le médiateur de l'apprentissage (chambre consulaire : CCI, chambre de métiers ou chambre d'agriculture), puis informer ton employeur au moins 5 jours calendaires après cette saisine ; la rupture intervient au plus tôt 7 jours calendaires après que l'employeur a été informé.",
          "Par licenciement : seulement pour faute grave, force majeure, inaptitude constatée par la médecine du travail, ou exclusion définitive de ton CFA.",
        ],
      },
      {
        heading: "Le rôle du médiateur de l'apprentissage",
        paragraphs: [
          "Le médiateur est gratuit et neutre. En cas de démission, le passer est obligatoire ; en cas de conflit avec ton employeur, tu peux aussi le contacter avant d'en arriver là : il aide souvent à trouver une solution (changement de missions, de tuteur, d'horaires).",
        ],
      },
      {
        heading: "Et ta formation après la rupture ?",
        paragraphs: [
          "Ton CFA peut te garder en formation pendant quelques mois le temps de retrouver une entreprise : renseigne-toi auprès de lui dès que la rupture se profile. Et commence tout de suite à chercher un nouvel employeur, les pages Stageio par métier et par ville listent les entreprises qui recrutent en ce moment.",
        ],
      },
    ],
    faq: [
      {
        q: "Peut-on démissionner d'un contrat d'apprentissage ?",
        a: "Oui. Pendant les 45 premiers jours en entreprise, librement. Après, tu dois saisir le médiateur de l'apprentissage, informer ton employeur au moins 5 jours calendaires après, puis respecter un délai d'au moins 7 jours calendaires avant la rupture.",
      },
      {
        q: "L'employeur peut-il me licencier comme un salarié classique ?",
        a: "Non. Après les 45 premiers jours, il ne peut rompre le contrat que pour faute grave, force majeure, inaptitude ou exclusion définitive du CFA.",
      },
    ],
    sources: [
      { label: "Rompre un contrat d'apprentissage (Éditions Tissot)", url: "https://www.editions-tissot.fr/guide/rupture-contrat-apprentissage" },
      { label: "Rupture d'un contrat d'apprentissage (CIDJ)", url: "https://www.cidj.com/etudes-formations-alternance/alternance/rupture-d-un-contrat-d-apprentissage" },
      { label: "Contrat d'apprentissage (justice.fr)", url: "https://www.justice.fr/fiche/contrat-apprentissage" },
    ],
  },
  {
    slug: "aides-alternants",
    title: "Aides pour les alternants en 2026 : ce qui existe encore (et ce qui a disparu)",
    metaDescription:
      "Mobili-Jeune, prime d'activité, APL, carte d'étudiant des métiers, aides régionales… Les aides auxquelles un alternant a droit en 2026, et la fin de l'aide de 500 € au permis.",
    publishedAt: "2026-10-07",
    updatedAt: "2026-10-07",
    intro: [
      "Être alternant, c'est être payé, mais pas toujours assez pour un loyer, des transports et parfois deux villes. Plusieurs aides existent encore en 2026, et une aide très connue a disparu. Le point complet.",
    ],
    sections: [
      {
        heading: "À savoir : l'aide de 500 € au permis a été supprimée",
        paragraphs: [
          "L'aide de 500 € pour financer le permis de conduire des apprentis a été supprimée par la loi de finances 2026 : plus aucune nouvelle demande n'est acceptée depuis le 21 février 2026. Beaucoup de sites la citent encore, ne compte pas dessus. Des aides locales au permis existent selon les régions, les départements ou ton OPCO : renseigne-toi auprès de ton CFA.",
        ],
      },
      {
        heading: "Mobili-Jeune : jusqu'à 100 € par mois pour ton loyer",
        paragraphs: [
          "Proposée par Action Logement aux alternants de moins de 30 ans, elle prend en charge une partie de ton loyer, jusqu'à 100 € par mois, en complément de l'APL. Condition principale : un salaire brut qui ne dépasse pas 120 % du SMIC. La demande se fait en ligne sur le site d'Action Logement.",
        ],
      },
      {
        heading: "La prime d'activité, dès 18 ans",
        paragraphs: [
          "Les alternants de 18 ans et plus y ont droit si leur salaire net dépasse 78 % du SMIC net pendant trois mois consécutifs (c'est souvent le cas à partir de la 2e ou 3e année, ou en contrat pro). La demande se fait sur le site de la CAF, avec une déclaration de ressources tous les trois mois.",
        ],
      },
      {
        heading: "Les APL",
        paragraphs: [
          "Comme tout locataire, tu peux toucher l'aide au logement de la CAF selon tes revenus et ton loyer. Fais une simulation sur caf.fr dès que tu as ton bail : la demande n'est pas rétroactive, chaque mois de retard est perdu.",
        ],
      },
      {
        heading: "Les autres coups de pouce",
        list: [
          "La carte d'étudiant des métiers, remise aux apprentis : elle donne accès aux mêmes réductions que la carte étudiante (restos U, cinéma, transports selon les villes).",
          "Les aides de ta région : transport, hébergement, restauration ou premier équipement, très variables d'une région à l'autre.",
          "Le fonds social de ton CFA ou de ton OPCO en cas de coup dur.",
          "La prise en charge d'une partie de ton abonnement de transport par ton employeur, comme pour tout salarié.",
        ],
      },
    ],
    faq: [
      {
        q: "L'aide de 500 € au permis existe-t-elle encore pour les apprentis ?",
        a: "Non, elle a été supprimée en 2026 : plus de nouvelles demandes depuis le 21 février 2026. Il reste des aides locales selon ta région, ton département ou ton OPCO.",
      },
      {
        q: "Un alternant peut-il toucher la prime d'activité ?",
        a: "Oui, à partir de 18 ans, si son salaire net dépasse 78 % du SMIC net pendant trois mois consécutifs.",
      },
      {
        q: "Qui peut demander Mobili-Jeune ?",
        a: "Les alternants de moins de 30 ans dont le salaire brut ne dépasse pas 120 % du SMIC, pour une aide au loyer allant jusqu'à 100 € par mois.",
      },
    ],
    sources: [
      { label: "Fin de l'aide au permis pour les apprentis (En Voiture Simone)", url: "https://www.envoituresimone.com/fin-de-laide-apprentis" },
      { label: "Mobili-Jeune (aides-sociales.com)", url: "https://aides-sociales.com/aides/mobili-jeune" },
      { label: "Prime d'activité des étudiants et alternants (L'Étudiant)", url: "https://www.letudiant.fr/lifestyle/aides-financieres/les-etudiants-sont-ils-eligibles-a-la-prime-dactivite.html" },
    ],
  },
  {
    slug: "conges-alternant",
    title: "Congés d'un alternant : combien de jours et comment ça marche",
    metaDescription:
      "5 semaines de congés payés, 5 jours de révision avant les examens, les semaines d'école : combien de congés a un alternant et comment les poser.",
    publishedAt: "2026-10-07",
    updatedAt: "2026-10-07",
    intro: [
      "En alternance, tu es salarié : tu as donc droit aux congés payés comme tout le monde, plus un petit bonus pour réviser tes examens si tu es apprenti. Par contre, les semaines d'école ne sont pas des vacances.",
    ],
    sections: [
      {
        heading: "5 semaines de congés payés par an",
        paragraphs: [
          "Comme tout salarié, tu cumules 2,5 jours ouvrables de congés payés par mois de travail, soit 5 semaines sur une année complète. Les dates se posent avec ton employeur, en dehors de tes périodes de formation.",
        ],
      },
      {
        heading: "+ 5 jours pour réviser tes examens (apprentissage)",
        paragraphs: [
          "En apprentissage, tu as droit à 5 jours ouvrables de congé supplémentaire pour préparer tes examens, dans le mois qui les précède. Ils sont payés. Préviens ton employeur à l'avance et demande à ton CFA s'il organise des révisions sur ces jours-là.",
        ],
      },
      {
        heading: "Les semaines d'école ne sont pas des congés",
        paragraphs: [
          "Le temps passé en formation compte comme du temps de travail : il est payé, mais ce ne sont pas des vacances. Si ton école ferme pendant les vacances scolaires, tu es censé être en entreprise (sauf si tu poses des congés).",
        ],
      },
      {
        heading: "Bien poser tes congés",
        list: [
          "Récupère ton calendrier d'alternance dès la signature et repère les périodes en entreprise.",
          "Pose tes congés tôt, surtout l'été et à Noël, et toujours par écrit (mail ou outil RH).",
          "Garde tes 5 jours de révision pour le mois des examens finaux.",
        ],
      },
    ],
    faq: [
      {
        q: "Combien de congés payés a un alternant ?",
        a: "5 semaines par an, comme tout salarié : 2,5 jours ouvrables par mois de travail.",
      },
      {
        q: "Les congés de révision sont-ils payés ?",
        a: "Oui. En apprentissage, les 5 jours ouvrables pris dans le mois qui précède les examens sont rémunérés.",
      },
    ],
    sources: [
      { label: "Droits et devoirs de l'apprenti (ONISEP)", url: "https://www.onisep.fr/Cap-vers-l-emploi/Alternance/Le-contrat-d-apprentissage-le-contrat-de-professionnalisation/Les-droits-et-devoirs-de-l-apprenti" },
      { label: "Alternance et congés (Digischool)", url: "https://www.digischool.fr/articles/orientation/alternance/alternance-et-conges/" },
    ],
  },
  {
    slug: "convention-de-stage",
    title: "Convention de stage : à quoi elle sert et ce qu'elle doit contenir",
    metaDescription:
      "Qui la signe, quand, et les mentions obligatoires d'une convention de stage (missions, dates, gratification, tuteurs) : le guide pour ne rien rater avant ton premier jour.",
    publishedAt: "2026-10-07",
    updatedAt: "2026-10-07",
    intro: [
      "Pas de convention, pas de stage : c'est le document qui encadre ton stage entre toi, l'entreprise et ton école. Voici ce qu'elle doit contenir et les pièges à éviter.",
    ],
    sections: [
      {
        heading: "Qui signe la convention de stage ?",
        paragraphs: [
          "Trois parties : toi, l'entreprise (ou l'organisme d'accueil) et ton établissement d'enseignement. Elle est en général générée par ton école à partir des informations que tu remplis, puis signée par tout le monde.",
        ],
      },
      {
        heading: "Elle doit être signée avant le premier jour",
        paragraphs: [
          "Commencer un stage sans convention signée expose l'entreprise à une requalification en contrat de travail, et toi à ne pas être couvert. Lance les démarches dès que l'entreprise t'a dit oui : les signatures peuvent prendre plusieurs jours.",
        ],
      },
      {
        heading: "Ce que la convention doit contenir",
        list: [
          "L'identité des trois parties, de ton enseignant référent et de ton tuteur en entreprise.",
          "L'intitulé exact de ta formation.",
          "Les dates de début et de fin, la durée hebdomadaire et les horaires (dont le travail de nuit ou le week-end s'il y en a).",
          "Les missions confiées et les compétences visées.",
          "Le montant de la gratification et ses modalités de versement (minimum légal de 4,50 € par heure en 2026 si le stage dépasse 2 mois).",
          "Les avantages éventuels (titres-restaurant, transport), les congés et autorisations d'absence.",
          "Les conditions de suivi et d'évaluation du stage.",
        ],
      },
      {
        heading: "Les erreurs à éviter",
        list: [
          "Des missions trop vagues (« aide au service ») : demande qu'elles soient précises, elles protègent le contenu de ton stage.",
          "Des dates qui ne collent pas à ton calendrier d'école.",
          "Oublier la gratification alors que le stage dure plus de 2 mois.",
        ],
      },
    ],
    faq: [
      {
        q: "Peut-on commencer un stage avant la signature de la convention ?",
        a: "Non. La convention doit être signée par les trois parties avant le premier jour de stage.",
      },
      {
        q: "Qui fournit la convention de stage ?",
        a: "Ton établissement d'enseignement, le plus souvent via une plateforme en ligne où tu saisis les informations du stage.",
      },
    ],
    sources: [
      { label: "Gratification minimale de stage (service-public.gouv.fr)", url: "https://entreprendre.service-public.gouv.fr/vosdroits/F32131" },
      { label: "La convention de stage de A à Z (Université Paris Cité)", url: "https://u-paris.fr/lcao/la-convention-de-stage-de-a-a-z" },
      { label: "Convention de stage : informations obligatoires (Digischool)", url: "https://www.digischool.fr/articles/orientation/alternance/convention-de-stage-informations-obligatoires/" },
    ],
  },
  {
    slug: "alternance-age-limite",
    title: "Alternance : jusqu'à quel âge ? Limites et exceptions en 2026",
    metaDescription:
      "Apprentissage jusqu'à 29 ans (et parfois 35 ans ou sans limite), contrat pro dès 16 ans et après 26 ans pour les demandeurs d'emploi : les âges pour faire une alternance.",
    publishedAt: "2026-10-07",
    updatedAt: "2026-10-07",
    intro: [
      "« Je suis trop vieux pour une alternance ? » Probablement pas. Les limites d'âge dépendent du type de contrat, et il existe pas mal d'exceptions.",
    ],
    sections: [
      {
        heading: "Contrat d'apprentissage : de 16 à 29 ans",
        paragraphs: [
          "Tu peux signer un contrat d'apprentissage de 16 ans (15 ans si tu as terminé la 3e) jusqu'à la veille de tes 30 ans.",
        ],
      },
      {
        heading: "Les exceptions en apprentissage",
        list: [
          "Pas de limite d'âge si tu es en situation de handicap, sportif de haut niveau, ou si tu as un projet de création ou de reprise d'entreprise qui nécessite le diplôme.",
          "Jusqu'à 35 ans si tu enchaînes sur un diplôme supérieur à celui obtenu lors de ton précédent apprentissage.",
          "Jusqu'à 35 ans si ton contrat précédent a été rompu pour une raison indépendante de ta volonté.",
        ],
      },
      {
        heading: "Contrat de professionnalisation : pas de limite pour les demandeurs d'emploi",
        paragraphs: [
          "Le contrat pro est ouvert aux 16-25 ans qui complètent leur formation initiale, mais aussi aux demandeurs d'emploi de 26 ans et plus et aux bénéficiaires du RSA, de l'ASS ou de l'AAH, sans limite d'âge. C'est la voie d'alternance classique pour une reconversion.",
        ],
      },
      {
        heading: "Le salaire change avec l'âge",
        paragraphs: [
          "En apprentissage comme en contrat pro, le salaire minimum augmente avec l'âge : un apprenti de 21 ans touche plus qu'un apprenti de 18 ans la même année de contrat, et à partir de 26 ans c'est au moins le SMIC. Fais le calcul avec le simulateur Stageio.",
        ],
      },
    ],
    faq: [
      {
        q: "Peut-on faire une alternance à 30 ans ?",
        a: "En apprentissage, seulement dans les cas d'exception (handicap, sportif de haut niveau, création d'entreprise, diplôme supérieur ou rupture involontaire jusqu'à 35 ans). En contrat de professionnalisation, oui si tu es demandeur d'emploi.",
      },
      {
        q: "Quel est l'âge minimum pour une alternance ?",
        a: "16 ans, ou 15 ans si tu as terminé la classe de 3e.",
      },
    ],
    sources: [
      { label: "Contrat d'apprentissage (justice.fr)", url: "https://www.justice.fr/fiche/contrat-apprentissage" },
      { label: "Contrat de professionnalisation (service-public.gouv.fr)", url: "https://www.service-public.gouv.fr/particuliers/vosdroits/F15478" },
    ],
  },
];
