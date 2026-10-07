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
    related: ["soutenance-de-stage", "convention-de-stage"],
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
  {
    slug: "cv-stage",
    title: "CV pour un stage : la structure qui marche quand on n'a pas (encore) d'expérience",
    metaDescription:
      "Quoi mettre sur un CV de stage quand on débute : rubriques, ordre, projets, jobs étudiants, compétences. La structure d'un CV d'une page qui donne envie de te rencontrer.",
    publishedAt: "2026-10-07",
    updatedAt: "2026-10-07",
    related: ["soft-skills-cv", "lettre-de-motivation-stage", "mail-candidature-stage-alternance"],
    intro: [
      "Personne n'attend d'un étudiant une carrière de 10 ans. Ce que le recruteur cherche sur un CV de stage : ce que tu sais faire, ce que tu as déjà prouvé (même hors entreprise) et pourquoi ce stage. Voici comment le montrer sur une seule page.",
    ],
    sections: [
      {
        heading: "La structure d'un CV de stage, dans l'ordre",
        list: [
          "En-tête : prénom, nom, téléphone, mail, ville, lien LinkedIn. Pas d'adresse complète ni de date de naissance.",
          "Titre : le stage visé et les dates (« Stage en marketing digital – 6 mois à partir de janvier 2027 »).",
          "Formation : ton diplôme en cours en premier, avec les matières ou projets en lien avec le stage.",
          "Expériences et projets : stages, jobs étudiants, projets d'école, associatif. Tout compte s'il montre une compétence.",
          "Compétences : outils et logiciels, langues avec un niveau réaliste, 2 ou 3 savoir-être prouvés ailleurs sur le CV.",
          "Centres d'intérêt : seulement s'ils disent quelque chose de toi (sport en compétition, projet perso, bénévolat).",
        ],
      },
      {
        heading: "Pas d'expérience ? Mets en avant tes projets",
        paragraphs: [
          "Un projet d'école, un site que tu as créé, un événement organisé pour ton asso : décris-les comme des expériences, avec une ligne sur ce que tu as fait et une ligne sur le résultat (« Organisation d'un tournoi de 120 participants, budget de 2 000 € tenu »). C'est souvent plus parlant qu'un job sans lien avec le poste.",
        ],
      },
      {
        heading: "Les jobs étudiants comptent",
        paragraphs: [
          "Serveur, vendeur, babysitting, livraison : ces expériences prouvent que tu es fiable, que tu tiens un rythme et que tu sais gérer des clients. Mets-les, avec une compétence précise à chaque fois (« gestion de la caisse et des encaissements, 300 clients par jour »).",
        ],
      },
      {
        heading: "Adapter ton CV à chaque offre en 5 minutes",
        list: [
          "Reprends dans ton titre l'intitulé exact du stage.",
          "Remonte en premier l'expérience ou le projet le plus proche des missions.",
          "Reprends 3 ou 4 mots-clés de l'offre dans tes compétences (logiciels, méthodes) : beaucoup d'entreprises trient les CV avec un logiciel.",
        ],
      },
      {
        heading: "Les erreurs qui font décrocher le recruteur",
        list: [
          "Plus d'une page.",
          "Une photo de vacances ou une adresse mail fantaisiste.",
          "Des fautes d'orthographe.",
          "Un niveau de langue surévalué (il sera testé en entretien).",
          "Un PDF nommé « CV.pdf » : nomme-le « CV-Prenom-Nom-Stage-Marketing.pdf ».",
        ],
      },
    ],
    faq: [
      {
        q: "Faut-il mettre une photo sur un CV de stage ?",
        a: "Ce n'est pas obligatoire en France. Si tu en mets une, choisis une photo sobre et récente, sur fond neutre.",
      },
      {
        q: "Quelle longueur pour un CV de stage ?",
        a: "Une page, toujours. Le recruteur le lit en quelques secondes : l'essentiel doit sauter aux yeux.",
      },
    ],
  },
  {
    slug: "mail-candidature-stage-alternance",
    title: "Mail de candidature pour un stage ou une alternance : modèles à copier",
    metaDescription:
      "Objet, corps du mail, pièces jointes, signature : comment écrire un mail de candidature pour un stage ou une alternance, avec 2 modèles prêts à adapter.",
    publishedAt: "2026-10-07",
    updatedAt: "2026-10-07",
    intro: [
      "Le mail est la première chose que le recruteur lit, avant ton CV. Un mail court, précis et sans faute donne envie d'ouvrir tes pièces jointes. Voici comment l'écrire, avec deux modèles.",
    ],
    sections: [
      {
        heading: "L'objet : clair et cherchable",
        paragraphs: [
          "Indique le type de contrat, le poste et ton nom : « Candidature alternance – Assistant RH – Léa Martin ». S'il y a une référence d'offre, ajoute-la. Le recruteur doit pouvoir retrouver ton mail en tapant le nom du poste.",
        ],
      },
      {
        heading: "Le corps du mail en 4 phrases",
        list: [
          "Qui tu es : formation, école, et le poste visé.",
          "Pourquoi cette entreprise : un élément précis, pas une généralité.",
          "Ce que tu apportes : une réalisation concrète en lien avec les missions.",
          "La suite : tes pièces jointes, tes disponibilités pour un échange.",
        ],
      },
      {
        heading: "Modèle 1 : réponse à une offre",
        paragraphs: [
          "Objet : Candidature [stage/alternance] – [intitulé du poste] – [Prénom Nom]",
          "Bonjour [Madame/Monsieur Nom], étudiant en [formation] à [école], je vous adresse ma candidature pour le poste de [intitulé] publié sur [site]. [Entreprise] m'attire particulièrement pour [raison précise]. Lors de [expérience ou projet], j'ai [réalisation concrète], une expérience directement utile pour [mission de l'offre]. Vous trouverez ci-joint mon CV et ma lettre de motivation. Je serais ravi d'échanger avec vous à votre convenance. Bien cordialement, [Prénom Nom] – [téléphone] – [lien LinkedIn]",
        ],
      },
      {
        heading: "Modèle 2 : version courte pour un formulaire ou LinkedIn",
        paragraphs: [
          "Bonjour [Prénom], je prépare un [diplôme] à [école] et je cherche [un stage / une alternance] en [métier] à partir de [date]. Votre offre de [intitulé] correspond exactement à ce que je cherche, notamment pour [élément de l'offre]. Mon CV est en pièce jointe : seriez-vous disponible pour en parler ? Merci et belle journée, [Prénom Nom]",
        ],
      },
      {
        heading: "Les pièces jointes",
        list: [
          "En PDF uniquement, jamais en Word.",
          "Des noms de fichiers clairs : « CV-Prenom-Nom.pdf », « LM-Prenom-Nom-Entreprise.pdf ».",
          "Pour une alternance, ajoute ton calendrier d'alternance si tu l'as.",
        ],
      },
      {
        heading: "Avant d'envoyer",
        list: [
          "Relis le nom de l'entreprise et du recruteur (une erreur de nom = candidature à la poubelle).",
          "Envoie-toi le mail d'abord pour vérifier l'affichage et les pièces jointes.",
          "Utilise une adresse mail sobre (prenom.nom@...).",
          "Note la date d'envoi pour relancer au bout de 7 à 10 jours ouvrés.",
        ],
      },
    ],
    faq: [
      {
        q: "Faut-il écrire la lettre de motivation dans le corps du mail ?",
        a: "Non : le mail doit être court (5 à 8 lignes). Mets la lettre complète en pièce jointe si l'offre la demande.",
      },
      {
        q: "Quel est le meilleur moment pour envoyer une candidature ?",
        a: "En semaine, le matin, quand les recruteurs trient leurs mails. Évite le vendredi soir et le week-end.",
      },
    ],
  },
  {
    slug: "questions-a-poser-en-entretien",
    title: "Les questions à poser au recruteur à la fin d'un entretien (stage ou alternance)",
    metaDescription:
      "« Avez-vous des questions ? » : 15 questions à poser au recruteur en entretien de stage ou d'alternance, celles qui marquent des points et celles à éviter.",
    publishedAt: "2026-10-07",
    updatedAt: "2026-10-07",
    intro: [
      "« Avez-vous des questions ? » arrive à la fin de presque tous les entretiens. Répondre « non » donne l'impression que le poste ne t'intéresse pas vraiment. Prépare 3 ou 4 questions parmi celles-ci.",
    ],
    sections: [
      {
        heading: "Sur le poste et les missions",
        list: [
          "À quoi ressemblera une semaine type ?",
          "Quels seront les premiers projets sur lesquels je travaillerai ?",
          "Quels outils ou logiciels utilise l'équipe au quotidien ?",
          "Qu'est-ce qui ferait de ce stage (ou de cette alternance) une réussite pour vous ?",
        ],
      },
      {
        heading: "Sur l'équipe et l'encadrement",
        list: [
          "Qui sera mon tuteur, et comment se passe le suivi au quotidien ?",
          "Combien de personnes compte l'équipe, et avec quels autres services travaille-t-elle ?",
          "Comment se passe l'intégration des nouveaux arrivants ?",
        ],
      },
      {
        heading: "Sur l'entreprise et l'avenir",
        list: [
          "Quels sont les grands projets de l'équipe pour l'année à venir ?",
          "Qu'ont fait les stagiaires ou alternants précédents après leur contrat ?",
          "Y a-t-il des possibilités d'embauche à la fin du contrat ?",
        ],
      },
      {
        heading: "Sur la suite du recrutement",
        list: [
          "Quelles sont les prochaines étapes ?",
          "Quand pensez-vous revenir vers moi ?",
        ],
      },
      {
        heading: "Les questions à éviter en premier entretien",
        list: [
          "Celles dont la réponse est sur le site de l'entreprise (ça montre que tu n'as pas préparé).",
          "Démarrer par les congés, le télétravail ou les avantages : garde-les pour la fin du processus.",
          "« Est-ce que j'ai le poste ? » : demande plutôt les prochaines étapes.",
        ],
      },
    ],
    faq: [
      {
        q: "Combien de questions poser en fin d'entretien ?",
        a: "2 à 4 questions suffisent. Prépares-en davantage, car certaines auront peut-être déjà trouvé leur réponse pendant l'entretien.",
      },
      {
        q: "Peut-on poser une question sur le salaire en entretien d'alternance ?",
        a: "Oui, à la fin et simplement, d'autant que le minimum est fixé par la loi selon ton âge et ton année de contrat. Tu peux demander si l'entreprise applique la grille légale ou une grille plus favorable.",
      },
    ],
  },
  {
    slug: "se-presenter-en-entretien",
    title: "Se présenter en entretien en 1 minute : la méthode et un exemple",
    metaDescription:
      "« Présentez-vous » : la structure passé-présent-futur pour se présenter en 1 minute en entretien de stage ou d'alternance, avec un exemple complet et les erreurs à éviter.",
    publishedAt: "2026-10-07",
    updatedAt: "2026-10-07",
    intro: [
      "C'est souvent la première question de l'entretien, et celle qui donne le ton. Une présentation d'une minute, préparée mais pas récitée, met le recruteur dans de bonnes dispositions pour la suite.",
    ],
    sections: [
      {
        heading: "La structure : passé, présent, futur",
        list: [
          "Passé (15 secondes) : ton parcours en une phrase et l'expérience qui t'a le plus appris.",
          "Présent (20 secondes) : ce que tu prépares, ce que tu sais faire, ce qui t'intéresse dans le métier.",
          "Futur (20 secondes) : pourquoi ce poste et cette entreprise sont la suite logique.",
        ],
      },
      {
        heading: "Exemple de présentation pour une alternance",
        paragraphs: [
          "« Je m'appelle Léa, j'ai 20 ans. Après un bac STMG, j'ai fait un BTS NDRC, et c'est mon job d'été en boutique qui m'a donné le goût de la relation client : j'y ai géré la caisse et dépassé mon objectif de ventes du mois d'août. Aujourd'hui je prépare un bachelor commerce, et ce qui me plaît le plus, c'est la prospection et le suivi des clients sur la durée. Votre poste de chargée de clientèle m'intéresse parce que vous travaillez avec des PME locales, et c'est exactement le type de relation que je veux développer pendant mes deux ans d'alternance. »",
        ],
      },
      {
        heading: "Les erreurs à éviter",
        list: [
          "Réciter ton CV ligne par ligne.",
          "Parler de ta vie privée sans lien avec le poste.",
          "Dépasser 2 minutes : le recruteur décroche.",
          "Apprendre par cœur un texte : retiens la structure et 2 ou 3 phrases clés, pas un discours.",
        ],
      },
      {
        heading: "S'entraîner efficacement",
        paragraphs: [
          "Chronomètre-toi à voix haute 3 ou 4 fois, puis enregistre-toi en vidéo une fois : tu repéreras les tics de langage et les passages trop longs. Adapte la dernière partie (le « futur ») à chaque entreprise.",
        ],
      },
    ],
    faq: [
      {
        q: "Combien de temps doit durer une présentation en entretien ?",
        a: "Entre 1 minute et 1 minute 30. Au-delà, le recruteur décroche ; en dessous de 30 secondes, tu passes à côté de l'occasion de te mettre en valeur.",
      },
      {
        q: "Faut-il donner son âge en se présentant ?",
        a: "Ce n'est pas obligatoire. En alternance, ça peut être utile car ton âge détermine ton salaire minimum, mais le recruteur l'a souvent déjà sur ton dossier.",
      },
    ],
  },
  {
    slug: "trouver-alternance-linkedin",
    title: "Trouver une alternance ou un stage avec LinkedIn : la méthode pas à pas",
    metaDescription:
      "Profil, recherche d'offres, messages aux managers, alertes : comment utiliser LinkedIn pour trouver une alternance ou un stage, avec un modèle de message d'approche.",
    publishedAt: "2026-10-07",
    updatedAt: "2026-10-07",
    intro: [
      "LinkedIn n'est pas qu'un CV en ligne : c'est l'endroit où tu peux parler directement aux personnes qui recrutent. Bien utilisé, il te fait passer devant des candidats qui ne font qu'envoyer des CV.",
    ],
    sections: [
      {
        heading: "1. Un profil qui donne envie de cliquer",
        list: [
          "Une photo nette où l'on voit ton visage.",
          "Un titre explicite : « Étudiant en BTS GPME – En recherche d'alternance en gestion à Lyon dès septembre ».",
          "Un résumé de 3 ou 4 lignes : ce que tu prépares, ce que tu sais faire, ce que tu cherches.",
          "Active la mention « Ouvert aux opportunités » visible par les recruteurs.",
        ],
      },
      {
        heading: "2. Chercher les offres et créer des alertes",
        paragraphs: [
          "Dans l'onglet Emplois, cherche « alternance [métier] » ou « stage [métier] » et filtre par ville et par date de publication. Crée une alerte pour être prévenu des nouvelles offres. Complète avec une plateforme qui regroupe les offres de plusieurs sources : les annonces publiées depuis moins de 3 jours sont celles où tu as le plus de chances.",
        ],
      },
      {
        heading: "3. Contacter directement les managers",
        paragraphs: [
          "Repère l'entreprise qui t'intéresse, puis dans l'onglet « Personnes », cherche le responsable du service visé. Envoie une demande de connexion avec une note courte, ou un message si tu as LinkedIn Premium.",
        ],
      },
      {
        heading: "Modèle de message d'approche",
        paragraphs: [
          "« Bonjour [Prénom], je prépare un [diplôme] à [école] et je cherche une alternance en [métier] à partir de [mois]. Votre équipe [nom] m'intéresse beaucoup, notamment pour [projet ou élément précis]. Prendriez-vous des alternants cette année ? Je peux vous envoyer mon CV. Merci d'avance ! »",
        ],
      },
      {
        heading: "4. Publier ta recherche",
        paragraphs: [
          "Un post simple (« Je cherche une alternance en [métier] à [ville] à partir de [mois], voici ce que je sais faire… ») avec ton CV en visuel est souvent partagé par ton réseau, tes profs et ton école. Utilise les hashtags #alternance ou #stage et ta ville.",
        ],
      },
    ],
    faq: [
      {
        q: "Faut-il LinkedIn Premium pour trouver une alternance ?",
        a: "Non. La version gratuite suffit : demande de connexion avec une note, recherche d'offres, alertes et publications.",
      },
      {
        q: "Combien de personnes contacter par jour ?",
        a: "Mieux vaut 5 à 10 messages personnalisés par jour que des dizaines de messages identiques, que LinkedIn peut limiter.",
      },
    ],
  },
  {
    slug: "refuser-une-offre",
    title: "Refuser une offre de stage ou d'alternance poliment (modèle de mail)",
    metaDescription:
      "Tu as accepté ailleurs ? Comment refuser une offre de stage ou d'alternance sans te griller, avec un modèle de mail de refus court et professionnel.",
    publishedAt: "2026-10-07",
    updatedAt: "2026-10-07",
    intro: [
      "Bonne nouvelle : tu as plusieurs propositions. Refuser une offre fait partie du jeu, à condition de le faire vite et proprement : le monde professionnel est petit, et cette entreprise pourrait te recontacter plus tard.",
    ],
    sections: [
      {
        heading: "Les 3 règles",
        list: [
          "Réponds vite : dès que ta décision est prise, pour que l'entreprise puisse contacter un autre candidat.",
          "Par écrit, même si tu as aussi appelé.",
          "Court, sincère et positif : remercie, donne une raison simple, laisse la porte ouverte.",
        ],
      },
      {
        heading: "Modèle de mail de refus",
        paragraphs: [
          "Objet : Votre proposition de [stage/alternance] – [intitulé]",
          "Bonjour [Madame/Monsieur Nom], je vous remercie sincèrement pour votre proposition et pour le temps que vous m'avez accordé pendant le processus de recrutement. Après réflexion, j'ai choisi de donner suite à une autre proposition, plus proche de [mon projet / ma spécialisation / ma ville d'études]. Ce choix n'a pas été facile, car votre équipe et le poste m'ont beaucoup plu. J'espère que nos chemins se recroiseront. Bien cordialement, [Prénom Nom]",
        ],
      },
      {
        heading: "Faut-il donner la vraie raison ?",
        paragraphs: [
          "Reste simple et honnête sans entrer dans les détails : « un projet plus proche de ma spécialisation » ou « une entreprise plus proche de mon école » suffisent. Inutile de comparer les salaires ou de critiquer l'offre.",
        ],
      },
      {
        heading: "Et si tu avais déjà dit oui ?",
        paragraphs: [
          "Si la convention de stage ou le contrat n'est pas encore signé, préviens immédiatement l'entreprise, par téléphone puis par écrit, en t'excusant pour le changement. Une fois le contrat d'alternance signé, ce ne sont plus les mêmes règles : renseigne-toi sur la rupture du contrat d'apprentissage.",
        ],
      },
    ],
    faq: [
      {
        q: "Peut-on refuser une offre après l'avoir acceptée à l'oral ?",
        a: "Oui, tant que rien n'est signé, mais préviens le plus vite possible et excuse-toi : l'entreprise a peut-être déjà refusé d'autres candidats.",
      },
      {
        q: "Faut-il appeler ou écrire pour refuser une offre ?",
        a: "Les deux sont bien : un appel est plus personnel, mais confirme toujours par un mail court.",
      },
    ],
  },
  {
    slug: "quand-chercher-son-alternance",
    title: "Quand chercher son alternance ? Le calendrier mois par mois",
    metaDescription:
      "À quel moment chercher ton alternance pour la rentrée de septembre : le calendrier mois par mois, la règle légale des 3 mois et que faire si tu t'y prends tard.",
    publishedAt: "2026-10-07",
    updatedAt: "2026-10-07",
    related: ["alternance-sans-entreprise", "trouver-une-alternance", "candidature-spontanee-alternance", "relancer-candidature"],
    intro: [
      "La question revient chaque année : trop tôt, les offres ne sont pas encore là ; trop tard, les meilleures sont parties. La bonne réponse : commence à préparer ton dossier 6 à 8 mois avant la rentrée et à candidater 4 à 6 mois avant. Voici le calendrier détaillé pour une rentrée en septembre, et ce que dit la loi si tu signes après la rentrée.",
    ],
    sections: [
      {
        heading: "Le calendrier pour une rentrée en septembre",
        table: {
          headers: ["Période", "Ce que tu fais"],
          rows: [
            ["Novembre – décembre", "Tu choisis ton diplôme et ton métier cible, tu listes les écoles ou CFA qui le proposent en alternance."],
            ["Janvier – mars", "Candidatures aux formations (via Parcoursup après le bac, sur les sites des écoles sinon). Tu prépares ton CV et ton profil LinkedIn. Premières candidatures aux grandes entreprises, qui recrutent tôt."],
            ["Avril – juin", "Période la plus chargée : beaucoup d'offres publiées, entretiens, relances. Vise plusieurs candidatures par semaine."],
            ["Juillet – août", "Ne t'arrête pas : les PME et les petites structures recrutent souvent tard, et la concurrence baisse pendant l'été."],
            ["Septembre – novembre", "Encore possible : la loi laisse jusqu'à 3 mois après le début de la formation pour démarrer le contrat (voir plus bas)."],
          ],
        },
      },
      {
        heading: "Pourquoi les grandes entreprises recrutent tôt",
        paragraphs: [
          "Les grands groupes (banques, distribution, industrie, cabinets de conseil) organisent leurs campagnes d'alternance comme des campagnes de recrutement classiques : publication groupée des offres en début d'année, tests en ligne, entretiens au printemps. Si tu vises ces entreprises, candidate dès janvier-février.",
          "Les PME, les commerces et les associations recrutent plutôt quand le besoin apparaît, souvent entre mai et septembre. Ce sont aussi celles qui répondent le mieux aux candidatures spontanées.",
        ],
      },
      {
        heading: "La règle des 3 mois : jusqu'à quand peut-on signer ?",
        paragraphs: [
          "Pour le contrat d'apprentissage, le Code du travail (article L6222-12) fixe une fenêtre : le contrat ne peut pas commencer plus de 3 mois avant le début du cycle de formation au CFA, ni plus de 3 mois après. Pour une formation qui démarre début septembre, tu peux donc signer un contrat qui commence jusqu'à début décembre environ.",
          "Bonus : si tu n'as pas encore d'entreprise à la rentrée, tu peux dans certains cas commencer la formation au CFA sans employeur pendant 3 mois maximum, le temps de trouver. On t'explique tout dans notre guide dédié à l'alternance sans entreprise.",
          "Le contrat de professionnalisation, lui, n'est pas calé sur une rentrée unique : beaucoup d'organismes de formation ont plusieurs entrées dans l'année. Si tu rates septembre, renseigne-toi.",
        ],
      },
      {
        heading: "Ton rythme de candidatures",
        list: [
          "De janvier à mars : 3 à 5 candidatures soignées par semaine, ciblées sur les entreprises qui recrutent tôt.",
          "D'avril à août : 5 à 10 candidatures par semaine, en mélangeant offres publiées et candidatures spontanées.",
          "Relance chaque candidature sans réponse au bout de 7 à 10 jours ouvrés.",
          "Les offres de moins de 3 jours sont celles où tu as le plus de chances : regarde les nouvelles offres tous les jours plutôt qu'une fois par semaine.",
        ],
      },
      {
        heading: "Les erreurs de calendrier les plus fréquentes",
        list: [
          "Attendre d'être admis à l'école pour chercher l'entreprise : fais les deux en parallèle.",
          "Tout miser sur 3 ou 4 grandes entreprises : leurs processus sont longs et très demandés.",
          "Arrêter en juillet en pensant que « c'est fini » : beaucoup de contrats se signent en août et septembre.",
          "Oublier de vérifier que l'école accepte encore des alternants : certaines formations ferment leurs inscriptions quand elles sont pleines.",
        ],
      },
    ],
    faq: [
      {
        q: "Est-il trop tard pour chercher une alternance en septembre ?",
        a: "Non. Pour un contrat d'apprentissage, le contrat peut démarrer jusqu'à 3 mois après le début de la formation, et certains CFA te laissent commencer la formation sans entreprise pendant ce délai. Mais ne traîne pas : chaque semaine compte.",
      },
      {
        q: "Combien de temps faut-il pour trouver une alternance ?",
        a: "C'est très variable selon le métier et la ville. Compte plusieurs semaines à plusieurs mois : c'est pour ça qu'il vaut mieux commencer 4 à 6 mois avant la rentrée.",
      },
      {
        q: "Peut-on commencer une alternance en janvier ?",
        a: "Oui, si ta formation propose une rentrée décalée ou si tu signes dans les 3 mois qui suivent le début du cycle. Le contrat de professionnalisation est souvent plus souple sur les dates d'entrée.",
      },
    ],
    sources: [
      { label: "Durée et dates du contrat d'apprentissage (Code du travail, L6222-7 à L6222-14, Légifrance)", url: "https://www.legifrance.gouv.fr/codes/id/LEGISCTA000006195910" },
      { label: "Contrat d'apprentissage (service-public.gouv.fr)", url: "https://www.service-public.gouv.fr/particuliers/vosdroits/F2918" },
    ],
  },
  {
    slug: "alternance-sans-entreprise",
    title: "Pas d'entreprise à la rentrée : commencer ton alternance sans employeur",
    metaDescription:
      "Tu n'as pas trouvé d'entreprise pour ton alternance ? La loi te permet de commencer la formation au CFA pendant 3 mois sans employeur. Conditions, statut et plan d'action.",
    publishedAt: "2026-10-07",
    updatedAt: "2026-10-07",
    related: ["quand-chercher-son-alternance", "candidature-spontanee-alternance", "contrat-apprentissage-ou-contrat-pro", "trouver-une-alternance"],
    intro: [
      "La rentrée arrive et tu n'as toujours pas signé de contrat ? Pas de panique : tu n'es pas obligé de renoncer à ta formation. Le Code du travail prévoit un dispositif pour commencer ton année au CFA pendant que tu continues à chercher ton entreprise. Voici comment ça marche et comment utiliser ces 3 mois au maximum.",
    ],
    sections: [
      {
        heading: "Ce que dit la loi",
        paragraphs: [
          "D'après l'article L6222-12-1 du Code du travail, si tu as entre 16 et 29 ans révolus (ou au moins 15 ans si tu as terminé le collège) et que tu n'as pas encore été embauché par un employeur, tu peux, à ta demande, commencer un cycle de formation en apprentissage dans la limite de 3 mois.",
          "Pendant cette période, tu as le statut de stagiaire de la formation professionnelle, et le CFA doit t'accompagner dans ta recherche d'employeur.",
        ],
      },
      {
        heading: "Ce que ça change concrètement",
        list: [
          "Tu suis les cours avec ta promo dès la rentrée : tu ne prends pas de retard.",
          "Tu ne touches pas de salaire tant que tu n'as pas signé de contrat : prévois ton budget en conséquence.",
          "Tu restes couvert pour ta protection sociale grâce au statut de stagiaire de la formation professionnelle.",
          "Dès que tu signes un contrat d'apprentissage, il prend le relais. Sa durée est réduite du nombre de mois déjà passés en formation.",
        ],
      },
      {
        heading: "Comment en profiter",
        paragraphs: [
          "Tous les CFA ne le proposent pas pour toutes leurs formations, et certaines formations sont déjà pleines. Contacte directement le CFA ou l'école qui t'a admis, explique ta situation et demande s'ils t'acceptent sans contrat pour démarrer l'année. Fais-le avant la rentrée si possible.",
        ],
      },
      {
        heading: "Ton plan d'action pour les 3 mois",
        list: [
          "Semaine 1 : demande au CFA la liste des entreprises partenaires et des offres qu'il reçoit. C'est sa mission de t'aider.",
          "Chaque jour : regarde les nouvelles offres de ta ville et de ton métier, et postule dans les 48 heures.",
          "Chaque semaine : envoie des candidatures spontanées aux entreprises proches de chez toi et de ton école, avec ton rythme école/entreprise précis.",
          "Mets en avant le fait que tu as déjà commencé la formation : c'est rassurant pour l'employeur, qui sait que tu es motivé et déjà inscrit.",
          "Relance tout ce qui reste sans réponse au bout de 7 à 10 jours ouvrés.",
        ],
      },
      {
        heading: "Et si tu n'as rien trouvé au bout de 3 mois ?",
        paragraphs: [
          "Le dispositif s'arrête : tu ne peux pas rester en apprentissage sans contrat. Parle avec ton école des solutions possibles : continuer la formation sous un autre statut quand elle le permet, viser une entrée en contrat de professionnalisation (souvent possible à d'autres moments de l'année), ou préparer la rentrée suivante en commençant ta recherche beaucoup plus tôt.",
        ],
      },
    ],
    faq: [
      {
        q: "Est-ce que je suis payé pendant les 3 mois sans entreprise ?",
        a: "Non, pas de salaire tant qu'aucun contrat n'est signé. Tu as en revanche le statut de stagiaire de la formation professionnelle, qui te couvre pour ta protection sociale.",
      },
      {
        q: "Le CFA peut-il refuser de me prendre sans contrat ?",
        a: "Tous les CFA ne proposent pas ce démarrage sans employeur, ou pas pour toutes les formations. Demande directement à ton école, le plus tôt possible.",
      },
      {
        q: "Que se passe-t-il pour la durée de mon contrat si je signe en novembre ?",
        a: "Ton contrat d'apprentissage est raccourci du nombre de mois déjà passés en formation : tu termines en même temps que ta promo.",
      },
    ],
    sources: [
      { label: "Durée du contrat et démarrage sans employeur (Code du travail, L6222-7 à L6222-14, Légifrance)", url: "https://www.legifrance.gouv.fr/codes/id/LEGISCTA000006195910" },
      { label: "Contrat d'apprentissage (service-public.gouv.fr)", url: "https://www.service-public.gouv.fr/particuliers/vosdroits/F2918" },
    ],
  },
  {
    slug: "soutenance-de-stage",
    title: "Soutenance de stage : le plan, les slides et les questions du jury",
    metaDescription:
      "Réussir ta soutenance de stage ou d'alternance : plan type, nombre de slides, comment répéter et les questions que le jury pose presque toujours.",
    publishedAt: "2026-10-07",
    updatedAt: "2026-10-07",
    related: ["rapport-de-stage", "premier-jour-en-entreprise", "se-presenter-en-entretien"],
    intro: [
      "La soutenance, c'est l'oral qui conclut ton stage ou ton année d'alternance : tu présentes ce que tu as fait et ce que tu en retires devant un jury (un prof, parfois ton tuteur). Ce n'est pas un résumé de ton rapport : c'est une démonstration que tu as compris ton travail et ce que tu as appris.",
      "Le format exact (durée, notation, jury) dépend de ton école : lis bien les consignes officielles avant de commencer, et respecte-les à la minute près.",
    ],
    sections: [
      {
        heading: "Le plan type",
        list: [
          "Introduction (1 min) : qui tu es, ta formation, l'entreprise et ton poste en une phrase, puis l'annonce du plan.",
          "L'entreprise (2 min max) : son activité, sa taille, ton service. Pas de copier-coller du site web : seulement ce qui aide à comprendre tes missions.",
          "Tes missions (le cœur, environ la moitié du temps) : 2 ou 3 missions principales, pour chacune le contexte, ce que tu as fait concrètement et le résultat, avec un chiffre si possible.",
          "Ce que tu as appris (2-3 min) : compétences acquises, difficultés rencontrées et comment tu les as gérées.",
          "Conclusion (1 min) : bilan et lien avec ton projet professionnel (la suite de tes études, le métier que tu vises).",
        ],
      },
      {
        heading: "Les slides : moins, c'est mieux",
        list: [
          "Une idée par slide, un titre qui dit l'idée (« J'ai réduit le délai de traitement des commandes de 20 % ») plutôt qu'un titre vague (« Mission 2 »).",
          "Compte environ une slide par minute de présentation.",
          "Peu de texte : des mots-clés, un schéma, une capture de ton travail. Le jury doit t'écouter, pas te lire.",
          "Numérote les slides : le jury s'en sert pour ses questions.",
          "Vérifie la confidentialité : certaines données de l'entreprise ne doivent pas apparaître. Demande à ton tuteur ce que tu peux montrer.",
        ],
      },
      {
        heading: "Répéter sans réciter",
        paragraphs: [
          "Répète au moins 3 fois à voix haute, chronomètre en main, idéalement devant quelqu'un. Tu dois connaître parfaitement ta première et ta dernière phrase, et le fil de ta présentation : le reste, tu le dis avec tes mots. Un texte appris par cœur se voit tout de suite et te déstabilise à la première question.",
        ],
      },
      {
        heading: "Les questions que le jury pose presque toujours",
        list: [
          "« Quelle a été ta plus grande difficulté, et comment l'as-tu surmontée ? »",
          "« Si tu devais refaire ce stage, que changerais-tu ? »",
          "« En quoi ce stage a-t-il confirmé (ou changé) ton projet professionnel ? »",
          "« Quel lien fais-tu entre tes cours et tes missions ? »",
          "« Pourquoi avoir fait ce choix plutôt qu'un autre ? » sur une décision que tu as présentée.",
        ],
      },
      {
        heading: "Le jour J",
        list: [
          "Arrive en avance, teste le matériel (adaptateur, clé USB et version PDF de secours).",
          "Une tenue proche de celle de ton entreprise, un cran au-dessus.",
          "Regarde le jury, pas l'écran. Parle un peu plus lentement que d'habitude.",
          "Face à une question difficile : prends 2 secondes pour réfléchir. « Je ne sais pas, mais voici comment je chercherais » vaut mieux qu'une réponse inventée.",
          "Remercie le jury et ton tuteur à la fin.",
        ],
      },
    ],
    faq: [
      {
        q: "Combien de temps dure une soutenance de stage ?",
        a: "Ça dépend de l'école et du niveau : souvent entre 10 et 20 minutes de présentation, suivies de questions. Suis la durée indiquée par ton école à la minute près.",
      },
      {
        q: "Combien de slides pour une soutenance de stage ?",
        a: "Environ une slide par minute de présentation, titre et conclusion compris. Une soutenance de 15 minutes tient en 12 à 15 slides.",
      },
      {
        q: "Peut-on lire ses notes pendant la soutenance ?",
        a: "Tu peux garder quelques mots-clés sous les yeux, mais évite de lire : le jury évalue aussi ta capacité à présenter ton travail.",
      },
    ],
  },
  {
    slug: "soft-skills-cv",
    title: "Soft skills : lesquelles mettre sur ton CV (et comment les prouver)",
    metaDescription:
      "Les soft skills qui comptent pour un stage ou une alternance, celles à éviter, et la méthode pour les prouver avec un exemple concret plutôt qu'avec des adjectifs.",
    publishedAt: "2026-10-07",
    updatedAt: "2026-10-07",
    related: ["cv-stage", "cv-alternance", "entretien-alternance"],
    intro: [
      "Quand tu as peu d'expérience, les recruteurs regardent surtout ton potentiel : ta façon de travailler, d'apprendre, de communiquer. C'est ça, les soft skills (ou savoir-être). Le problème : tout le monde écrit « dynamique, motivé, rigoureux ». Pour te démarquer, choisis-en peu et prouve-les.",
    ],
    sections: [
      {
        heading: "Les soft skills les plus recherchées chez les étudiants",
        list: [
          "Capacité d'apprentissage : tu comprends vite et tu progresses seul.",
          "Autonomie : tu avances sans qu'on vérifie chaque étape, et tu sais quand demander de l'aide.",
          "Communication : tu expliques clairement, à l'écrit comme à l'oral.",
          "Organisation : tu tiens des délais en jonglant entre cours et travail.",
          "Esprit d'équipe : tu travailles bien avec des profils différents.",
          "Adaptabilité : tu gères les imprévus et les changements de priorité.",
          "Sens du client ou du service : utile dans le commerce, la vente, la relation client et l'hôtellerie.",
        ],
      },
      {
        heading: "Choisis selon le métier",
        table: {
          headers: ["Métier", "Soft skills à mettre en avant"],
          rows: [
            ["Commercial, vente", "Aisance relationnelle, persévérance, sens de l'écoute"],
            ["Ressources humaines", "Écoute, discrétion, organisation"],
            ["Marketing, communication", "Créativité, curiosité, esprit d'analyse"],
            ["Développeur, data", "Autonomie, logique, capacité d'apprentissage"],
            ["Comptabilité, gestion", "Rigueur, fiabilité, organisation"],
            ["Assistant(e), administratif", "Organisation, polyvalence, discrétion"],
          ],
        },
      },
      {
        heading: "La méthode pour les prouver",
        paragraphs: [
          "Une soft skill sans preuve ne vaut rien. Pour chacune, trouve une situation réelle : un job étudiant, un projet d'école, une asso, un sport. Puis écris une ligne avec ce que tu as fait et le résultat.",
          "Exemple : au lieu de « organisé », écris « Job étudiant 15 h/semaine en parallèle de ma licence, moyenne maintenue à 13/20 ». Au lieu de « esprit d'équipe », écris « Projet de groupe de 5 personnes : coordination du planning et des rendus, livré dans les délais ».",
        ],
      },
      {
        heading: "Où les mettre sur ton CV",
        list: [
          "Dans tes expériences, sous forme de résultats : c'est l'endroit le plus convaincant.",
          "Dans une courte rubrique « Atouts » : 3 ou 4 qualités maximum, celles de l'offre.",
          "Dans ton accroche en haut du CV : une seule, celle qui colle le mieux au poste.",
          "Dans ta lettre ou ton mail de candidature : reprends-en une avec un exemple développé.",
        ],
      },
      {
        heading: "Les erreurs à éviter",
        list: [
          "La liste de 10 adjectifs : le recruteur n'en retient aucun.",
          "Les qualités que tout le monde met sans preuve : « dynamique », « motivé », « passionné ».",
          "Les soft skills sans rapport avec l'offre : relis l'annonce et reprends ses mots.",
          "Les auto-évaluations en barres ou en étoiles (« communication : 4/5 ») : ça ne veut rien dire pour un recruteur.",
        ],
      },
    ],
    faq: [
      {
        q: "Combien de soft skills mettre sur un CV ?",
        a: "3 ou 4, choisies selon l'offre et chacune appuyée par un exemple dans tes expériences.",
      },
      {
        q: "Quelle est la différence entre hard skills et soft skills ?",
        a: "Les hard skills sont des compétences techniques qui s'apprennent et se vérifient (Excel, une langue, un logiciel). Les soft skills concernent ta façon de travailler (autonomie, communication, organisation).",
      },
      {
        q: "Comment parler de ses soft skills en entretien ?",
        a: "Avec une histoire courte : la situation, ce que tu as fait, le résultat. Prépare un exemple pour chacune des qualités que tu as mises sur ton CV.",
      },
    ],
  },
  {
    slug: "premier-jour-en-entreprise",
    title: "Premier jour de stage ou d'alternance : les bons réflexes",
    metaDescription:
      "Ce qu'il faut préparer avant ton premier jour en stage ou en alternance, comment te comporter la première semaine et les erreurs qui laissent une mauvaise impression.",
    publishedAt: "2026-10-07",
    updatedAt: "2026-10-07",
    related: ["convention-de-stage", "conges-alternant", "soutenance-de-stage"],
    intro: [
      "Tu as décroché ton stage ou ton alternance, bravo. Le premier jour, personne n'attend que tu saches tout faire : on regarde surtout si tu es fiable, curieux et facile à intégrer. Voici comment bien démarrer.",
    ],
    sections: [
      {
        heading: "La veille : ce que tu prépares",
        list: [
          "Confirme l'heure d'arrivée, l'adresse exacte et le nom de la personne à demander à l'accueil.",
          "Teste ton trajet à l'avance ou prévois une marge de 20 minutes.",
          "Demande le code vestimentaire si tu as un doute. Sinon, vise un cran au-dessus de ce que tu as vu en entretien.",
          "Prépare tes papiers : pièce d'identité, numéro de sécurité sociale, RIB (pour ton salaire si tu es alternant ou pour ta gratification de stage).",
          "Stage : vérifie que ta convention est signée par toutes les parties (toi, l'école, l'entreprise) avant le premier jour.",
        ],
      },
      {
        heading: "Le premier jour",
        list: [
          "Arrive 5 à 10 minutes en avance, pas plus.",
          "Prends un carnet : note les prénoms, les outils, les process. Tu poseras moins deux fois la même question.",
          "Présente-toi simplement : ton prénom, ta formation, ton rythme (pour une alternance), ce sur quoi tu vas travailler.",
          "Demande à ton tuteur un point en fin de journée pour savoir ce qu'il attend de toi la première semaine.",
          "Téléphone en poche : regarde ce que font les autres avant de le sortir en réunion.",
        ],
      },
      {
        heading: "La première semaine",
        paragraphs: [
          "Ton objectif : comprendre comment l'équipe fonctionne et livrer une première petite tâche bien faite. Pose des questions, mais regroupe-les : un point de 10 minutes avec ton tuteur vaut mieux que 15 interruptions.",
          "En fin de semaine, propose un point : ce que tu as fait, ce que tu as compris, ce qui reste flou. Fixe avec ton tuteur 2 ou 3 objectifs pour le mois : c'est la base de ton rapport ou de ta soutenance plus tard.",
        ],
      },
      {
        heading: "Spécial alternance : gérer le rythme",
        list: [
          "Partage ton calendrier école/entreprise avec ton équipe dès le premier jour, pour qu'on ne te confie pas une tâche urgente juste avant une semaine de cours.",
          "Avant de partir à l'école, fais un point écrit de ce que tu laisses en cours.",
          "En rentrant, demande ce qui a changé en ton absence.",
        ],
      },
      {
        heading: "Les erreurs qui laissent une mauvaise impression",
        list: [
          "Arriver en retard sans prévenir, même de 5 minutes.",
          "Ne rien noter et redemander les mêmes informations.",
          "Rester bloqué une journée entière sans demander d'aide.",
          "Critiquer l'organisation dès la première semaine. Observe d'abord, propose ensuite.",
          "Refuser les tâches simples : tout le monde commence par là.",
        ],
      },
    ],
    faq: [
      {
        q: "Comment s'habiller pour son premier jour de stage ?",
        a: "Comme l'équipe, un cran au-dessus. Si tu ne sais pas, demande à ton tuteur ou à la personne qui t'a recruté : c'est une question normale.",
      },
      {
        q: "Que dire pour se présenter le premier jour ?",
        a: "Ton prénom, ta formation, la durée ou le rythme de ton contrat et ce sur quoi tu vas travailler. Dix secondes suffisent, puis intéresse-toi aux autres.",
      },
      {
        q: "Faut-il apporter quelque chose le premier jour ?",
        a: "Tes papiers (pièce d'identité, numéro de sécurité sociale, RIB), un carnet et un stylo. Pour un stage, vérifie aussi que ta convention est signée.",
      },
    ],
  },
  {
    slug: "lettre-de-motivation-chatgpt",
    title: "Lettre de motivation avec ChatGPT : la méthode pour qu'elle te ressemble",
    metaDescription:
      "Utiliser ChatGPT ou une autre IA pour ta lettre de motivation de stage ou d'alternance sans envoyer un texte générique : la méthode, un prompt à copier et les pièges à éviter.",
    publishedAt: "2026-10-07",
    updatedAt: "2026-10-07",
    related: ["lettre-de-motivation-alternance", "lettre-de-motivation-stage", "mail-candidature-stage-alternance"],
    intro: [
      "Utiliser une IA pour écrire ta lettre de motivation n'a rien d'interdit, et ça peut te faire gagner beaucoup de temps. Le vrai risque, ce n'est pas de « se faire repérer » : c'est d'envoyer la même lettre lisse et vague que des dizaines d'autres candidats. Un recruteur la jette en dix secondes, IA ou pas.",
      "La règle : l'IA t'aide à structurer et à reformuler, mais le contenu (tes expériences, tes raisons, l'entreprise) vient de toi.",
    ],
    sections: [
      {
        heading: "Étape 1 : rassemble la matière avant d'ouvrir l'IA",
        list: [
          "L'offre complète, copiée en entier.",
          "2 ou 3 choses précises sur l'entreprise : un produit, un projet récent, une valeur que tu as vraiment remarquée.",
          "2 expériences à toi qui collent à l'offre (job, projet, asso), avec ce que tu as fait et le résultat.",
          "La vraie raison pour laquelle tu postules, même simple : le métier, le secteur, la ville, le rythme.",
        ],
      },
      {
        heading: "Étape 2 : un prompt qui donne un vrai résultat",
        paragraphs: [
          "Exemple à adapter : « Je postule à cette offre d'alternance [colle l'offre]. Voici mes expériences : [tes 2 expériences avec résultats]. Voici pourquoi cette entreprise m'intéresse : [tes 2-3 éléments]. Écris une lettre de motivation de 200 à 250 mots, ton direct et professionnel, en 3 paragraphes : pourquoi eux, ce que j'apporte avec mes exemples, la conclusion avec mon rythme d'alternance. N'invente aucune information. Évite les formules toutes faites comme « dynamique et motivé » ou « je me permets de vous adresser ». »",
        ],
      },
      {
        heading: "Étape 3 : réécris avec ta voix",
        list: [
          "Lis le texte à voix haute : chaque phrase que tu ne dirais jamais en entretien, tu la reformules.",
          "Vérifie chaque fait : l'IA invente parfois des détails sur l'entreprise ou sur toi. Une erreur factuelle, c'est rédhibitoire.",
          "Ajoute un détail que seul toi peux écrire : une anecdote, un chiffre, une observation sur l'entreprise.",
          "Coupe : une bonne lettre d'étudiant tient en 15 lignes. L'IA a tendance à rallonger.",
        ],
      },
      {
        heading: "Les signes d'une lettre « générée » à corriger",
        list: [
          "Des phrases qui pourraient s'appliquer à n'importe quelle entreprise.",
          "Des superlatifs en série : « passionné », « véritable », « au cœur de », « incroyable opportunité ».",
          "Trois adjectifs à la suite pour te décrire, sans exemple.",
          "Une structure trop parfaite, sans aucune information concrète.",
          "Le nom d'une autre entreprise oublié d'une lettre précédente (ça arrive plus souvent qu'on ne croit).",
        ],
      },
      {
        heading: "Ce que l'IA ne doit jamais faire à ta place",
        paragraphs: [
          "Inventer une expérience, un diplôme ou une compétence que tu n'as pas. Ça se voit en entretien, et c'est de toute façon malhonnête. Et pour les candidatures spontanées ou les relances, un mail court écrit par toi marche souvent mieux qu'une longue lettre.",
        ],
      },
    ],
    faq: [
      {
        q: "Les recruteurs voient-ils qu'une lettre a été écrite avec ChatGPT ?",
        a: "Les détecteurs automatiques ne sont pas fiables, mais un recruteur repère très vite une lettre générique, sans exemple ni détail sur l'entreprise. Si ta lettre contient tes vraies expériences et des éléments précis sur l'entreprise, la question ne se pose plus.",
      },
      {
        q: "Est-ce que c'est interdit d'utiliser l'IA pour sa candidature ?",
        a: "Non. C'est un outil comme un correcteur d'orthographe, à condition que tout ce qui est écrit soit vrai et que tu sois capable d'en parler en entretien.",
      },
      {
        q: "Quelle longueur pour une lettre de motivation de stage ou d'alternance ?",
        a: "200 à 300 mots, soit une quinzaine de lignes. Pour une candidature par mail, le message lui-même peut faire 5 à 8 lignes, avec la lettre en pièce jointe si l'offre la demande.",
      },
    ],
  },
  {
    slug: "gratification-de-stage",
    title: "Gratification de stage 2026 : montant, calcul et droits du stagiaire",
    metaDescription:
      "Gratification minimale de stage en 2026 : 4,50 € de l'heure, obligatoire au-delà de 2 mois. Calcul, exemple à temps plein, impôts, tickets resto et transport.",
    publishedAt: "2026-10-07",
    updatedAt: "2026-10-07",
    related: ["convention-de-stage", "trouver-un-stage", "stage-de-fin-d-etudes"],
    intro: [
      "Un stagiaire n'a pas de salaire : il reçoit une gratification. Elle est obligatoire dès que ton stage dépasse 2 mois dans la même entreprise, et la loi fixe un minimum. Voici combien tu dois toucher en 2026, comment c'est calculé et les autres droits que beaucoup de stagiaires oublient de demander.",
    ],
    sections: [
      {
        heading: "Quand la gratification est-elle obligatoire ?",
        paragraphs: [
          "Dès que ton stage dure plus de 2 mois de présence, consécutifs ou non, dans le même organisme d'accueil et sur la même année scolaire ou universitaire. Concrètement : plus de 44 jours de présence à 7 heures par jour, soit plus de 308 heures.",
          "Dans ce cas, elle est due dès le premier jour du stage, pas seulement à partir du troisième mois, et elle est versée chaque mois. En dessous de ce seuil, l'entreprise peut te gratifier mais n'y est pas obligée.",
        ],
      },
      {
        heading: "Le montant minimum en 2026",
        paragraphs: [
          "Le minimum légal est de 4,50 € par heure de stage effectuée. Ce n'est qu'un plancher : l'entreprise peut verser plus, ce qui est fréquent dans certains secteurs (tech, finance, conseil), et ta convention de stage indique le montant exact.",
        ],
        table: {
          headers: ["Temps de présence", "Heures par mois (moyenne)", "Gratification minimale par mois"],
          rows: [
            ["35 h par semaine", "151,67 h", "environ 682 €"],
            ["28 h par semaine", "121,33 h", "environ 546 €"],
            ["20 h par semaine", "86,67 h", "environ 390 €"],
          ],
        },
      },
      {
        heading: "Comment c'est calculé",
        paragraphs: [
          "La gratification se calcule sur les heures réellement effectuées : 4,50 € × le nombre d'heures du mois. Comme le nombre de jours travaillés varie d'un mois à l'autre, le montant peut changer légèrement chaque mois, sauf si l'entreprise lisse les versements sur la durée du stage.",
          "Brut ou net ? Jusqu'au minimum légal, la gratification n'est soumise à aucune cotisation sociale : tu touches la même somme en net. Au-dessus, seule la partie qui dépasse le minimum est soumise à cotisations.",
          "Pour un calcul sur ta situation, utilise notre simulateur : il donne la gratification minimale selon tes heures par semaine.",
        ],
      },
      {
        heading: "Impôts : faut-il déclarer sa gratification ?",
        paragraphs: [
          "Les gratifications de stage sont exonérées d'impôt sur le revenu dans la limite du montant annuel du SMIC (article 81 bis du Code général des impôts). Pour la quasi-totalité des stagiaires, il n'y a donc rien à payer. La limite s'applique sur l'année, quelle que soit la durée du stage.",
        ],
      },
      {
        heading: "Les autres droits du stagiaire",
        list: [
          "Tickets restaurant ou accès au restaurant d'entreprise, dans les mêmes conditions que les salariés.",
          "Prise en charge d'une partie de tes frais de transport en commun, comme les salariés.",
          "Congés et absences : prévus dans ta convention. Pour un stage de plus de 2 mois, la convention doit prévoir des congés et autorisations d'absence.",
          "Durée maximale : 6 mois par année d'enseignement dans le même organisme d'accueil (924 heures de présence).",
        ],
      },
      {
        heading: "Si ta gratification n'est pas versée",
        paragraphs: [
          "Commence par en parler à ton tuteur ou aux RH : c'est souvent un oubli administratif. Si rien ne bouge, préviens ton école, qui a signé la convention : elle peut intervenir. Garde une trace écrite de tes échanges et de tes heures de présence.",
        ],
      },
    ],
    faq: [
      {
        q: "Quel est le montant de la gratification de stage en 2026 ?",
        a: "Au minimum 4,50 € par heure de stage, soit environ 682 € par mois pour un stage à temps plein de 35 heures par semaine. L'entreprise peut verser plus.",
      },
      {
        q: "Un stage de 2 mois est-il payé ?",
        a: "La gratification n'est obligatoire qu'au-delà de 2 mois de présence (plus de 308 heures). Pour un stage de 2 mois pile ou moins, l'entreprise n'est pas obligée de te gratifier, mais elle peut le faire.",
      },
      {
        q: "La gratification de stage est-elle imposable ?",
        a: "Non, dans la limite du montant annuel du SMIC, ce qui couvre la quasi-totalité des stages.",
      },
      {
        q: "La gratification est-elle versée pendant les congés ?",
        a: "Ça dépend de ta convention : la gratification est calculée sur les heures de présence, mais la convention peut prévoir le maintien de la gratification pendant les congés. Vérifie-la avant de signer.",
      },
    ],
    sources: [
      { label: "Gratification minimale de stage (service-public.gouv.fr)", url: "https://entreprendre.service-public.gouv.fr/vosdroits/F32131" },
      { label: "Exonération d'impôt des gratifications de stage (Code général des impôts, art. 81 bis, Légifrance)", url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000029236245" },
    ],
  },
  {
    slug: "choisir-son-ecole-en-alternance",
    title: "Choisir son école ou son CFA en alternance : les 7 points à vérifier",
    metaDescription:
      "Diplôme reconnu (RNCP), taux de réussite et d'insertion, rythme, aide à trouver une entreprise, frais : comment choisir une école ou un CFA en alternance sans te faire avoir.",
    publishedAt: "2026-10-07",
    updatedAt: "2026-10-07",
    related: ["bts-bachelor-master-alternance", "quand-chercher-son-alternance", "contrat-apprentissage-ou-contrat-pro"],
    intro: [
      "En alternance, ton école compte autant que ton entreprise : c'est elle qui délivre ton diplôme, qui t'aide (ou pas) à trouver un contrat et qui fixe ton rythme. Les écoles d'alternance se sont multipliées, et toutes ne se valent pas. Voici ce qu'il faut vérifier avant de t'inscrire.",
    ],
    sections: [
      {
        heading: "1. Le diplôme est-il reconnu ?",
        paragraphs: [
          "Un contrat d'apprentissage doit préparer un diplôme ou un titre à finalité professionnelle enregistré au Répertoire national des certifications professionnelles (RNCP). Vérifie le numéro RNCP de la formation sur le site de France Compétences, et le niveau indiqué (niveau 5 = bac+2, niveau 6 = bac+3, niveau 7 = bac+5).",
          "Attention au mot « bachelor » ou « MBA » : ce sont des appellations commerciales. Ce qui compte, c'est le titre RNCP ou le diplôme national (BTS, BUT, licence, master) qu'il y a derrière.",
        ],
      },
      {
        heading: "2. Les résultats de l'école",
        paragraphs: [
          "Chaque année, les CFA doivent rendre publics plusieurs indicateurs (article L6111-8 du Code du travail) : taux d'obtention du diplôme, taux de poursuite d'études, taux d'interruption en cours de formation, taux d'insertion professionnelle et taux de rupture des contrats d'apprentissage. Ils sont consultables sur la plateforme InserJeunes. Un taux de rupture ou d'abandon élevé doit te poser question.",
        ],
      },
      {
        heading: "3. L'aide pour trouver une entreprise",
        list: [
          "L'école a-t-elle un service relations entreprises, avec des offres réservées à ses étudiants ?",
          "Combien d'étudiants de l'an dernier ont trouvé un contrat avant la rentrée ?",
          "Que se passe-t-il si tu n'as pas d'entreprise à la rentrée : peux-tu commencer quand même ?",
        ],
      },
      {
        heading: "4. Le rythme",
        paragraphs: [
          "1 semaine école / 3 semaines entreprise, 2 jours / 3 jours, un mois sur deux... Le rythme change beaucoup ton quotidien et ce que les entreprises acceptent. Certains métiers préfèrent des périodes longues en entreprise (commerce, chantier), d'autres s'adaptent à tout. Vérifie aussi la distance entre l'école et les entreprises que tu vises.",
        ],
      },
      {
        heading: "5. Les frais",
        paragraphs: [
          "En contrat d'apprentissage, la formation est gratuite pour toi et pour tes parents : c'est garanti par la loi (article L6211-1 du Code du travail). Elle est financée par l'opérateur de compétences (OPCO) de ton entreprise. Méfie-toi d'une école qui te demande des frais de scolarité pour une formation en apprentissage, ou qui te fait payer si tu ne trouves pas d'entreprise sans te l'avoir dit clairement avant l'inscription.",
        ],
      },
      {
        heading: "6. Les avis d'anciens",
        paragraphs: [
          "Cherche des anciens étudiants sur LinkedIn (recherche par nom de l'école et formation) et envoie un message court : la plupart répondent volontiers. Demande-leur comment s'est passée la recherche d'entreprise, la qualité des cours et ce qu'ils font aujourd'hui.",
        ],
      },
      {
        heading: "7. Le lieu",
        paragraphs: [
          "Pendant l'alternance, tu feras des allers-retours entre ton école et ton entreprise. Choisir une école dans la ville où il y a le plus d'offres dans ton métier augmente beaucoup tes chances. Regarde le nombre d'offres par ville avant de choisir.",
        ],
      },
    ],
    faq: [
      {
        q: "Une école d'alternance peut-elle être payante ?",
        a: "Pas en contrat d'apprentissage : la formation est gratuite pour l'apprenti et sa famille. En contrat de professionnalisation, les frais sont normalement pris en charge par l'entreprise et son OPCO. Lis bien les conditions si tu ne trouves pas d'entreprise.",
      },
      {
        q: "Comment savoir si un diplôme est reconnu par l'État ?",
        a: "Vérifie qu'il s'agit d'un diplôme national (BTS, BUT, licence, master) ou d'un titre enregistré au RNCP, avec son numéro et son niveau, sur le site de France Compétences.",
      },
      {
        q: "Faut-il trouver l'école ou l'entreprise en premier ?",
        a: "Les deux en parallèle : l'école te donne une date de rentrée et un rythme à proposer aux entreprises, et l'entreprise valide ton inscription définitive.",
      },
    ],
    sources: [
      { label: "Formation gratuite pour l'apprenti (Code du travail, L6211-1)", url: "https://code.travail.gouv.fr/code-du-travail/l6211-1" },
      { label: "Indicateurs publiés par les CFA (Code du travail, L6111-8)", url: "https://code.travail.gouv.fr/code-du-travail/l6111-8" },
    ],
  },
  {
    slug: "bts-bachelor-master-alternance",
    title: "BTS, BUT, bachelor ou master en alternance : lequel choisir ?",
    metaDescription:
      "Les diplômes qu'on peut préparer en alternance, du CAP au master : durée, niveau, débouchés et comment choisir selon ton profil et le métier que tu vises.",
    publishedAt: "2026-10-07",
    updatedAt: "2026-10-07",
    related: ["choisir-son-ecole-en-alternance", "alternance-age-limite", "trouver-une-alternance"],
    intro: [
      "Presque tous les diplômes peuvent se préparer en alternance, du CAP au diplôme d'ingénieur. Le bon choix dépend de ton niveau actuel, du métier visé et du temps que tu veux passer en études. Voici les principaux, avec leur niveau officiel.",
    ],
    sections: [
      {
        heading: "Les diplômes possibles en alternance",
        table: {
          headers: ["Diplôme", "Niveau", "Durée habituelle", "Pour qui"],
          rows: [
            ["CAP", "Niveau 3", "1 à 2 ans", "Apprendre un métier manuel ou de service, dès la fin du collège"],
            ["Bac pro", "Niveau 4 (bac)", "2 à 3 ans", "Métier technique ou commercial avec un bac en poche"],
            ["BTS", "Niveau 5 (bac+2)", "2 ans", "Après le bac, pour être vite opérationnel"],
            ["BUT", "Niveau 6 (bac+3)", "3 ans", "Après le bac, formation universitaire technologique"],
            ["Licence professionnelle", "Niveau 6 (bac+3)", "1 an", "Après un bac+2, pour se spécialiser"],
            ["Bachelor (titre RNCP)", "Niveau 6 (bac+3)", "1 à 3 ans", "Écoles privées ou consulaires, vérifier le titre RNCP"],
            ["Master, diplôme d'ingénieur ou d'école de commerce", "Niveau 7 (bac+5)", "2 ans (ou 3 pour l'ingénieur)", "Après un bac+3, postes de cadre"],
          ],
        },
      },
      {
        heading: "Comment choisir",
        list: [
          "Pars du métier : regarde les offres d'alternance de ce métier et le niveau qu'elles demandent.",
          "Tu veux travailler vite : BTS ou BUT, très appréciés des entreprises pour leur côté opérationnel.",
          "Tu as déjà un bac+2 : licence pro ou bachelor pour te spécialiser en 1 an, ou une 3e année de BUT.",
          "Tu vises un poste de cadre : master ou école en alternance, souvent après un bac+3.",
          "Regarde ton âge : le contrat d'apprentissage est en principe ouvert jusqu'à 29 ans révolus (avec des exceptions).",
        ],
      },
      {
        heading: "Ce qui change selon le niveau",
        paragraphs: [
          "Ton salaire minimum d'apprenti dépend de ton âge et de ton année de contrat, pas du diplôme : comme on prépare souvent un master plus âgé qu'un BTS, il est en général plus élevé, et certaines entreprises proposent plus que le minimum aux bac+5. En revanche, les places en master en alternance sont plus disputées : commence ta recherche d'entreprise tôt.",
          "Bon à savoir : enchaîner plusieurs diplômes en alternance est possible. Beaucoup d'étudiants font un BTS puis une licence pro ou un bachelor, toujours en alternance.",
        ],
      },
      {
        heading: "Attention aux appellations",
        paragraphs: [
          "« Bachelor », « MBA », « Mastère » (avec un e) ne sont pas des diplômes nationaux. Ils peuvent être d'excellentes formations, à condition d'être enregistrés au RNCP à un niveau précis. Demande toujours le numéro RNCP et vérifie-le sur le site de France Compétences.",
        ],
      },
    ],
    faq: [
      {
        q: "Peut-on faire un BTS en alternance ?",
        a: "Oui, c'est même l'un des diplômes les plus préparés en alternance, en 2 ans, dans presque tous les secteurs (commerce, gestion, informatique, industrie).",
      },
      {
        q: "Quelle est la différence entre un bachelor et une licence ?",
        a: "La licence et le BUT sont des diplômes nationaux. Le bachelor est une appellation utilisée par des écoles : il peut correspondre à un titre RNCP de niveau 6 (bac+3), voire à un diplôme visé par l'État. Vérifie son numéro RNCP.",
      },
      {
        q: "Peut-on faire un master en alternance ?",
        a: "Oui, beaucoup de masters et d'écoles de commerce ou d'ingénieurs proposent l'alternance, souvent sur les 2 dernières années.",
      },
    ],
  },
  {
    slug: "entretien-de-stage",
    title: "Entretien de stage : les questions spécifiques au stage et quoi répondre",
    metaDescription:
      "Dates, durée, convention, missions, gratification : les questions propres à un entretien de stage, avec des exemples de réponses et ce que tu dois vérifier de ton côté.",
    publishedAt: "2026-10-07",
    updatedAt: "2026-10-07",
    related: ["se-presenter-en-entretien", "questions-a-poser-en-entretien", "convention-de-stage"],
    intro: [
      "Un entretien de stage ressemble à un entretien classique, avec des questions en plus : tes dates, la durée, ta convention, ce que ton école attend. Si tu les prépares, tu passes pour quelqu'un d'organisé. Sinon, tu laisses un flou qui peut coûter la place.",
    ],
    sections: [
      {
        heading: "Les questions logistiques (à connaître par cœur)",
        list: [
          "« Quelles sont vos dates de stage ? » : donne les dates exactes de début et de fin possibles, et ta marge de souplesse.",
          "« Le stage est-il obligatoire dans votre cursus ? » : oui ou non, et quel est l'objectif fixé par l'école (stage de découverte, de fin d'études, mission précise).",
          "« Pouvez-vous avoir une convention ? » : oui, explique comment ton école la gère et en combien de temps elle est signée.",
          "« Êtes-vous disponible à temps plein ? » : précise si tu as des cours ou des examens pendant la période.",
        ],
      },
      {
        heading: "Les questions sur ta motivation",
        list: [
          "« Pourquoi ce stage chez nous ? » : 2 raisons précises sur l'entreprise, puis le lien avec ton projet.",
          "« Qu'attendez-vous de ce stage ? » : ce que tu veux apprendre et ce que tu veux apporter. Pas « découvrir le monde de l'entreprise », trop vague.",
          "« Qu'avez-vous retenu de vos stages précédents ? » : une compétence apprise et une chose que tu ferais différemment.",
          "« Où vous voyez-vous après vos études ? » : une direction cohérente avec le stage, sans forcément de poste précis.",
        ],
      },
      {
        heading: "Les questions sur les missions",
        paragraphs: [
          "On peut te demander comment tu t'y prendrais pour une tâche du stage (« Comment organiseriez-vous un événement pour 50 clients ? », « Comment analyseriez-vous ces chiffres ? »). Personne n'attend une réponse parfaite : montre ta méthode. Les étapes, les questions que tu poserais, comment tu vérifierais le résultat.",
        ],
      },
      {
        heading: "Ce que tu dois vérifier de ton côté",
        list: [
          "Les missions concrètes et qui sera ton tuteur.",
          "Les horaires, le télétravail possible, le lieu.",
          "La gratification si le stage dépasse 2 mois : elle est obligatoire, au minimum 4,50 € par heure en 2026.",
          "Les tickets restaurant et le remboursement du transport, auxquels tu as droit comme les salariés.",
          "Les possibilités d'embauche ou d'alternance après le stage, si c'est ton objectif.",
        ],
      },
      {
        heading: "Parler de la gratification sans gêne",
        paragraphs: [
          "Si on ne t'en parle pas, pose la question à la fin, simplement : « Pouvez-vous me préciser la gratification prévue et les avantages (tickets restaurant, transport) ? » C'est une question normale, que les recruteurs attendent.",
        ],
      },
    ],
    faq: [
      {
        q: "Combien de temps dure un entretien de stage ?",
        a: "Souvent entre 20 et 45 minutes, parfois en deux étapes (RH puis tuteur). Prévois de pouvoir rester un peu plus longtemps.",
      },
      {
        q: "Faut-il parler de la gratification en entretien de stage ?",
        a: "Oui, à la fin, si le recruteur ne l'a pas fait. Pour un stage de plus de 2 mois, elle est obligatoire : demander le montant prévu est normal.",
      },
      {
        q: "Que répondre à « avez-vous d'autres pistes de stage ? »",
        a: "La vérité, simplement : « J'ai d'autres candidatures en cours, mais votre stage est mon premier choix parce que… ». Ça montre que tu es demandé sans fermer la porte.",
      },
    ],
  },
  {
    slug: "profil-linkedin-etudiant",
    title: "Profil LinkedIn étudiant : la checklist pour être contacté par les recruteurs",
    metaDescription:
      "Photo, titre, résumé, expériences, compétences, mode « Open to work » : la checklist complète pour un profil LinkedIn d'étudiant qui attire les offres de stage et d'alternance.",
    publishedAt: "2026-10-07",
    updatedAt: "2026-10-07",
    related: ["trouver-alternance-linkedin", "cv-alternance", "soft-skills-cv"],
    intro: [
      "Quand tu postules, le recruteur tape souvent ton nom sur LinkedIn. Et certains recruteurs cherchent directement des étudiants pour leurs stages et alternances. Un profil complet, c'est 1 heure de travail une fois pour toutes. Voici la checklist, dans l'ordre de ce que le recruteur voit.",
    ],
    sections: [
      {
        heading: "Le haut du profil (ce qu'on voit en 3 secondes)",
        list: [
          "Photo : ton visage, de face, fond neutre, lumière du jour. Pas besoin de costume, mais pas de photo de soirée.",
          "Bannière : une image simple liée à ton domaine, ou une couleur unie.",
          "Titre : pas seulement « Étudiant », mais ce que tu cherches. Exemple : « Étudiant BTS NDRC | Recherche alternance commerciale à Lyon dès septembre ».",
          "Ville : celle où tu cherches, pour apparaître dans les recherches des recruteurs locaux.",
          "« Open to work » : active-le en précisant le type de poste (stage, alternance), la ville et la date de début.",
        ],
      },
      {
        heading: "La section « Infos » (ton résumé)",
        paragraphs: [
          "4 à 6 lignes à la première personne : ta formation, ce qui t'intéresse, une ou deux réalisations, et ce que tu cherches avec les dates et ton rythme. Termine par une phrase d'invitation : « Ouvert aux échanges, n'hésitez pas à me contacter ».",
        ],
      },
      {
        heading: "Expériences et formation",
        list: [
          "Mets tes jobs étudiants, stages, missions associatives et projets marquants, avec 2 lignes de résultats chacun.",
          "Pour ta formation : le nom exact du diplôme, l'école, les années, et 2 ou 3 matières ou projets en lien avec ce que tu cherches.",
          "Ajoute tes certifications (langues, outils, MOOC) si elles sont utiles pour le poste.",
        ],
      },
      {
        heading: "Compétences",
        paragraphs: [
          "Ajoute les compétences qui reviennent dans les offres que tu vises (outils, langues, techniques) : ce sont des mots-clés que les recruteurs utilisent dans leurs recherches. Épingle les 3 plus importantes en haut de la liste.",
        ],
      },
      {
        heading: "Les erreurs qui font fuir",
        list: [
          "Un profil vide avec juste ton école.",
          "Une URL de profil avec des chiffres : personnalise-la (prénom-nom) dans les paramètres.",
          "Des fautes d'orthographe dans le titre ou le résumé.",
          "Un titre et un CV qui ne disent pas la même chose (dates, diplôme, recherche).",
        ],
      },
      {
        heading: "Faire vivre ton profil (10 minutes par semaine)",
        list: [
          "Ajoute des personnes de ton secteur et de ta ville, avec un court message personnalisé.",
          "Commente intelligemment 1 ou 2 posts par semaine de professionnels de ton domaine.",
          "Publie de temps en temps : un projet d'école terminé, une certification, ce que tu as appris en stage.",
        ],
      },
    ],
    faq: [
      {
        q: "Faut-il activer « Open to work » quand on est étudiant ?",
        a: "Oui, en choisissant les bons types de postes (stage, alternance), la ville et la date de début. Les recruteurs filtrent souvent sur ce critère.",
      },
      {
        q: "Que mettre dans son titre LinkedIn quand on est étudiant ?",
        a: "Ta formation et ce que tu cherches, avec la ville et la date. Exemple : « Étudiante en master RH | Recherche alternance à Paris dès septembre ».",
      },
      {
        q: "Faut-il une photo professionnelle sur LinkedIn ?",
        a: "Pas forcément faite par un photographe : une photo nette, de face, avec un fond neutre, suffit largement.",
      },
    ],
  },
  {
    slug: "stage-de-fin-d-etudes",
    title: "Stage de fin d'études : comment le choisir pour décrocher un CDI",
    metaDescription:
      "Le stage de fin d'études est souvent ton premier pas vers un CDI. Comment choisir l'entreprise et les missions, quand chercher, et ce que dit la loi si tu es embauché après.",
    publishedAt: "2026-10-07",
    updatedAt: "2026-10-07",
    related: ["gratification-de-stage", "trouver-un-stage", "convention-de-stage"],
    intro: [
      "Le stage de fin d'études n'est pas un stage comme les autres : c'est souvent le dernier avant ton premier emploi, et beaucoup d'entreprises s'en servent comme période de recrutement. Bien le choisir peut te faire gagner des mois de recherche d'emploi.",
    ],
    sections: [
      {
        heading: "Les bons critères de choix",
        list: [
          "Les missions : de vraies responsabilités, que tu pourras raconter en entretien d'embauche. Méfie-toi des offres vagues.",
          "La possibilité d'embauche : demande franchement en entretien si le stage peut déboucher sur un CDI ou un CDD.",
          "Le tuteur : quelqu'un de disponible, qui a déjà encadré des stagiaires.",
          "Le secteur et la ville où tu veux travailler ensuite : ton premier réseau se construit là.",
          "La gratification : obligatoire au-delà de 2 mois, au minimum 4,50 € par heure en 2026.",
        ],
      },
      {
        heading: "Quand chercher",
        paragraphs: [
          "Commence 4 à 6 mois avant la date de début. Pour un stage de fin d'études qui commence en février ou mars, les offres sortent souvent dès l'automne précédent, en particulier dans les grandes entreprises. Les PME publient plus tard, au fil de leurs besoins.",
        ],
      },
      {
        heading: "La durée",
        paragraphs: [
          "Un stage dure au maximum 6 mois par année d'enseignement dans le même organisme d'accueil (924 heures de présence). Si tu vises une embauche, un stage long est un avantage : tu as le temps de faire tes preuves et l'entreprise d'anticiper ton recrutement.",
        ],
      },
      {
        heading: "Si l'entreprise t'embauche après ton stage",
        paragraphs: [
          "Le Code du travail (article L1221-24) prévoit deux avantages si tu es embauché dans les 3 mois qui suivent ton stage de dernière année :",
        ],
        list: [
          "La durée de ton stage est déduite de ta période d'essai, dans la limite de la moitié de celle-ci (sauf accord collectif plus favorable).",
          "Si le poste correspond aux missions de ton stage, la durée du stage est déduite entièrement de la période d'essai.",
          "Si ton stage a duré plus de 2 mois, il compte aussi dans ton ancienneté.",
        ],
      },
      {
        heading: "Transformer le stage en CDI",
        list: [
          "Dès le premier mois, dis à ton tuteur que tu aimerais rester si l'occasion se présente.",
          "Fixe des objectifs clairs et fais un point régulier sur tes résultats.",
          "Intéresse-toi aux autres équipes : une ouverture de poste peut venir d'ailleurs.",
          "Deux mois avant la fin, pose la question directement : « Est-ce qu'un poste pourrait s'ouvrir à la fin de mon stage ? »",
        ],
      },
    ],
    faq: [
      {
        q: "Quelle est la durée maximale d'un stage de fin d'études ?",
        a: "6 mois par année d'enseignement dans le même organisme d'accueil, soit 924 heures de présence.",
      },
      {
        q: "Le stage compte-t-il dans la période d'essai si je suis embauché ?",
        a: "Oui, si tu es embauché dans les 3 mois après un stage de dernière année : la durée du stage est déduite de la période d'essai (dans la limite de la moitié, ou entièrement si le poste correspond à tes missions de stage).",
      },
      {
        q: "Vaut-il mieux un stage dans une grande entreprise ou une PME ?",
        a: "Les deux ont des avantages : une grande entreprise apporte un nom sur ton CV et des process structurés, une PME donne souvent plus de responsabilités et un accès direct aux décideurs. Choisis selon les missions proposées.",
      },
    ],
    sources: [
      { label: "Stage et période d'essai en cas d'embauche (Code du travail, L1221-24)", url: "https://code.travail.gouv.fr/code-du-travail/l1221-24" },
      { label: "Gratification minimale de stage (service-public.gouv.fr)", url: "https://entreprendre.service-public.gouv.fr/vosdroits/F32131" },
    ],
  },
  {
    slug: "periode-essai-alternance",
    title: "Période d'essai en alternance : apprentissage et contrat pro, les règles",
    metaDescription:
      "Apprentissage : 45 jours en entreprise pour rompre librement. Contrat pro : période d'essai du CDD ou du CDI. Durées, renouvellement et comment ça se passe si ça s'arrête.",
    publishedAt: "2026-10-07",
    updatedAt: "2026-10-07",
    related: ["rupture-contrat-apprentissage", "contrat-apprentissage-ou-contrat-pro", "premier-jour-en-entreprise"],
    intro: [
      "Les premières semaines d'une alternance servent à vérifier que ça colle, de ton côté comme de celui de l'entreprise. Mais les règles ne sont pas les mêmes en contrat d'apprentissage et en contrat de professionnalisation. Voici ce qu'il faut savoir.",
    ],
    sections: [
      {
        heading: "Contrat d'apprentissage : les 45 premiers jours en entreprise",
        paragraphs: [
          "Le contrat d'apprentissage ne parle pas de « période d'essai » au sens classique, mais l'effet est le même : pendant les 45 premiers jours de formation pratique en entreprise, consécutifs ou non, toi comme l'employeur pouvez rompre le contrat sans avoir à donner de motif. La rupture doit être faite par écrit.",
          "Attention au calcul : seuls les jours passés en entreprise comptent, pas les jours de cours au CFA. Avec un rythme de 2 jours en entreprise par semaine, ces 45 jours peuvent donc s'étaler sur plusieurs mois.",
          "Après ces 45 jours, la rupture n'est plus libre : accord écrit des deux parties, démission avec passage par le médiateur, ou licenciement dans des cas précis. On détaille tout dans notre guide sur la rupture du contrat d'apprentissage.",
        ],
      },
      {
        heading: "Contrat de professionnalisation : la période d'essai du droit commun",
        paragraphs: [
          "Le contrat de professionnalisation est un contrat de travail classique, en CDD ou en CDI. La période d'essai suit donc les règles habituelles. Elle n'est pas automatique : elle doit être prévue dans ton contrat.",
        ],
        table: {
          headers: ["Type de contrat pro", "Durée maximale de la période d'essai"],
          rows: [
            ["CDD de 6 mois ou moins", "1 jour par semaine de contrat, dans la limite de 2 semaines"],
            ["CDD de plus de 6 mois", "1 mois"],
            ["CDI, employé ou ouvrier", "2 mois"],
            ["CDI, agent de maîtrise ou technicien", "3 mois"],
            ["CDI, cadre", "4 mois"],
          ],
        },
      },
      {
        heading: "Peut-elle être renouvelée ?",
        paragraphs: [
          "En CDD, la période d'essai n'est pas renouvelable. En CDI, elle peut l'être une seule fois, et seulement si un accord de branche le prévoit et que ton contrat le mentionne. Le renouvellement doit être accepté par écrit, par toi, avant la fin de la première période.",
        ],
      },
      {
        heading: "Si l'entreprise met fin à l'essai",
        paragraphs: [
          "Pendant la période d'essai d'un contrat pro, l'employeur peut y mettre fin sans motif, mais il doit respecter un délai de prévenance qui dépend de ton temps de présence dans l'entreprise (de 24 heures à 1 mois). De ton côté, tu dois aussi prévenir, en général 48 heures à l'avance (24 heures si tu es là depuis moins de 8 jours).",
          "Préviens tout de suite ton école ou ton CFA : il peut t'aider à retrouver une entreprise, et en apprentissage tu peux sous conditions continuer ta formation le temps d'en trouver une nouvelle.",
        ],
      },
      {
        heading: "Réussir ces premières semaines",
        list: [
          "Fais un point avec ton tuteur à la fin de la première semaine et au bout d'un mois : qu'est-ce qui va, qu'est-ce qui doit changer ?",
          "Note ce que tu fais chaque semaine : utile pour ton école et pour montrer ta progression.",
          "Si quelque chose ne va pas (missions sans rapport avec ta formation, horaires non respectés), parles-en tôt à ton tuteur puis à ton CFA.",
        ],
      },
    ],
    faq: [
      {
        q: "Y a-t-il une période d'essai en contrat d'apprentissage ?",
        a: "Pas sous ce nom, mais pendant les 45 premiers jours de formation pratique en entreprise (consécutifs ou non), l'apprenti comme l'employeur peuvent rompre le contrat librement, par écrit.",
      },
      {
        q: "Les jours au CFA comptent-ils dans les 45 jours ?",
        a: "Non, seuls les jours de formation pratique en entreprise sont comptés.",
      },
      {
        q: "Quelle est la période d'essai d'un contrat pro en CDD de 12 mois ?",
        a: "1 mois maximum, sans renouvellement possible.",
      },
    ],
    sources: [
      { label: "Contrat d'apprentissage (service-public.gouv.fr)", url: "https://www.service-public.gouv.fr/particuliers/vosdroits/F2918" },
      { label: "Contrat de professionnalisation (service-public.gouv.fr)", url: "https://www.service-public.gouv.fr/particuliers/vosdroits/F15478" },
    ],
  },
  {
    slug: "annee-de-cesure",
    title: "Année de césure : comment l'organiser (stage, job, voyage)",
    metaDescription:
      "Une année de césure pour faire un stage, travailler ou voyager sans perdre ta place : statut étudiant, convention, bourse, et comment préparer ton projet.",
    publishedAt: "2026-10-07",
    updatedAt: "2026-10-07",
    related: ["trouver-un-stage", "stage-a-l-etranger", "convention-de-stage"],
    intro: [
      "La césure, c'est une pause dans tes études (un semestre ou une année universitaire au maximum) pour vivre une expérience : un stage long, un emploi, un service civique, un projet personnel ou un voyage. Bien préparée, elle pèse lourd sur un CV. Voici comment ça marche.",
    ],
    sections: [
      {
        heading: "Les règles principales",
        list: [
          "Durée : au maximum l'équivalent d'une année universitaire.",
          "Tu restes inscrit dans ton établissement et tu gardes ton statut d'étudiant pendant toute la césure.",
          "Une convention est signée entre toi et ton établissement : elle garantit ta réinscription dans ta formation à ton retour.",
          "La césure est facultative et se fait à ta demande : ton établissement examine ton projet avant de donner son accord.",
          "Bourse : tu peux demander à la conserver, mais c'est ton établissement qui décide selon ton projet.",
        ],
      },
      {
        heading: "Que faire pendant une césure ?",
        table: {
          headers: ["Option", "Pour qui", "À savoir"],
          rows: [
            ["Stage en entreprise", "Tester un métier, se constituer une vraie expérience", "Une convention de stage reste nécessaire, et les règles de gratification s'appliquent."],
            ["Emploi (CDD, saisonnier...)", "Financer la suite de ses études, gagner en autonomie", "Tu es salarié, avec un vrai contrat de travail."],
            ["Service civique", "S'engager dans une mission d'intérêt général", "Indemnisé, de 6 à 12 mois en général."],
            ["Projet personnel ou entrepreneurial", "Créer une activité, un projet associatif", "Prépare un plan précis : ton école le demandera."],
            ["Voyage, séjour linguistique", "Progresser en langue, ouvrir ses horizons", "Garde une trace de ce que tu fais pour le valoriser au retour."],
          ],
        },
      },
      {
        heading: "Comment la demander",
        list: [
          "Renseigne-toi tôt (souvent au printemps pour l'année suivante) : chaque établissement fixe son calendrier et son dossier.",
          "Prépare un projet écrit : ce que tu vas faire, pourquoi, et ce que tu en attends pour ta formation ou ton projet pro.",
          "Demande quels sont les frais d'inscription pendant la césure : ils sont souvent réduits.",
          "Vérifie avec le Crous ce qu'il advient de ta bourse et de ton logement étudiant.",
        ],
      },
      {
        heading: "Valoriser sa césure sur son CV",
        paragraphs: [
          "Une césure n'est pas un trou dans ton CV si tu la racontes avec des résultats : ce que tu as appris, ce que tu as produit, les responsabilités que tu as eues. Une ligne comme « Stage de 6 mois chez [entreprise] pendant ma césure : refonte du suivi client, 200 comptes gérés » vaut largement une année de cours en plus.",
        ],
      },
    ],
    faq: [
      {
        q: "Est-ce qu'on reste étudiant pendant une année de césure ?",
        a: "Oui : tu restes inscrit dans ton établissement et tu conserves ton statut d'étudiant pendant toute la période de césure.",
      },
      {
        q: "Peut-on garder sa bourse pendant une césure ?",
        a: "Tu peux demander son maintien, mais la décision revient à ton établissement, en fonction de ton projet.",
      },
      {
        q: "Peut-on faire un stage pendant une année de césure ?",
        a: "Oui, c'est même l'option la plus courante. Il faut une convention de stage, comme pour un stage classique.",
      },
    ],
  },
  {
    slug: "stage-a-l-etranger",
    title: "Faire un stage à l'étranger : démarches, financement et checklist",
    metaDescription:
      "Trouver un stage à l'étranger, la convention, le visa, l'assurance santé, les bourses (dont Erasmus+) : la checklist complète pour partir en stage hors de France.",
    publishedAt: "2026-10-07",
    updatedAt: "2026-10-07",
    related: ["trouver-un-stage", "convention-de-stage", "annee-de-cesure"],
    intro: [
      "Un stage à l'étranger fait progresser en langue, donne une vraie ligne différenciante sur ton CV et te fait souvent grandir plus vite qu'un stage classique. Mais il demande plus de préparation : convention, visa, logement, santé, budget. Voici la checklist dans l'ordre.",
    ],
    sections: [
      {
        heading: "1. Trouver le stage (6 à 9 mois avant)",
        list: [
          "Commence par le service des relations internationales de ton école : offres réservées, entreprises partenaires, anciens déjà partis.",
          "Cherche les filiales à l'étranger d'entreprises françaises : plus simples pour la convention et l'accompagnement.",
          "Utilise LinkedIn en filtrant par pays, et envoie des candidatures spontanées en anglais ou dans la langue locale.",
          "Adapte ton CV aux usages du pays (photo ou non, longueur, format) : renseigne-toi pays par pays.",
        ],
      },
      {
        heading: "2. La convention de stage",
        paragraphs: [
          "Si ton stage fait partie de ton cursus en France, une convention de stage est signée entre toi, ton école et l'organisme d'accueil, même à l'étranger. Elle précise tes missions, tes dates, ta gratification éventuelle et ta couverture santé et accidents. Fais-la valider avant de réserver quoi que ce soit.",
          "La gratification minimale française ne s'impose pas toujours à une entreprise étrangère : ce qui compte, c'est ce que prévoit ta convention et le droit du pays. Négocie-la avant de partir.",
        ],
      },
      {
        heading: "3. Visa et autorisation de travail",
        paragraphs: [
          "Dans l'Union européenne, un étudiant français n'a pas besoin de visa. Hors UE, les règles changent d'un pays à l'autre et les délais peuvent être longs : consulte le site de l'ambassade du pays dès que ton stage est confirmé.",
        ],
      },
      {
        heading: "4. Santé et assurance",
        list: [
          "Dans l'UE : demande ta carte européenne d'assurance maladie (CEAM) sur ton compte Ameli, au moins 2 semaines avant le départ.",
          "Hors UE : vérifie ce que couvre ta convention et prends une assurance santé internationale si nécessaire, les frais médicaux peuvent être très élevés.",
          "Vérifie la couverture responsabilité civile et accidents du travail prévue par ta convention.",
        ],
      },
      {
        heading: "5. Financer ton stage",
        list: [
          "Erasmus+ : bourse pour les stages dans un pays participant au programme. Le montant dépend du pays : demande à ton école, qui gère les candidatures.",
          "Aides de ta région ou de ton école à la mobilité internationale : chaque région a ses propres dispositifs.",
          "Bourse sur critères sociaux : selon ta situation, elle peut être maintenue pendant le stage. Renseigne-toi auprès de ton école et du Crous.",
          "Fais un budget complet : logement, transport, assurance, vie sur place. Dans certaines villes, le logement absorbe une grosse partie du budget.",
        ],
      },
      {
        heading: "6. Avant de partir",
        list: [
          "Pièce d'identité ou passeport valide pour toute la durée du séjour.",
          "Logement trouvé avant le départ, ou au moins pour les premières semaines.",
          "Copies numériques de tous tes documents (convention, assurance, passeport).",
          "Inscription sur le fil Ariane du ministère des Affaires étrangères pour être contacté en cas de crise.",
        ],
      },
    ],
    faq: [
      {
        q: "Faut-il une convention de stage pour un stage à l'étranger ?",
        a: "Oui, si le stage fait partie de ton cursus en France : la convention est signée entre toi, ton école et l'organisme d'accueil, comme pour un stage en France.",
      },
      {
        q: "Un stage à l'étranger est-il rémunéré ?",
        a: "Ça dépend du pays et de l'entreprise : la gratification minimale française ne s'impose pas toujours à un organisme étranger. Ce qui compte, c'est ta convention. Des bourses comme Erasmus+ peuvent compléter.",
      },
      {
        q: "Quand commencer à chercher un stage à l'étranger ?",
        a: "6 à 9 mois avant le départ, pour avoir le temps de trouver, signer la convention et régler visa et logement.",
      },
    ],
  },
  {
    slug: "alternance-deux-villes",
    title: "Alternance dans deux villes : gérer l'école et l'entreprise loin l'une de l'autre",
    metaDescription:
      "École à Paris, entreprise à Lyon ? Comment organiser une alternance entre deux villes : logement, transport, aides possibles, rythme et budget.",
    publishedAt: "2026-10-07",
    updatedAt: "2026-10-07",
    related: ["aides-alternants", "choisir-son-ecole-en-alternance", "premier-jour-en-entreprise"],
    intro: [
      "Trouver une entreprise loin de ton école, c'est fréquent : ça élargit beaucoup tes possibilités, mais ça demande de l'organisation et un budget. Avant de dire oui, fais les comptes et choisis la bonne formule.",
    ],
    sections: [
      {
        heading: "Est-ce compatible avec ton rythme ?",
        paragraphs: [
          "Le rythme de ton école change tout. Avec des périodes longues (2 à 4 semaines en entreprise, puis 1 à 2 semaines de cours), une double vie entre deux villes se gère bien. Avec un rythme de 2 ou 3 jours par semaine, les allers-retours hebdomadaires deviennent vite épuisants et chers.",
        ],
      },
      {
        heading: "Les formules de logement",
        table: {
          headers: ["Formule", "Avantages", "Inconvénients"],
          rows: [
            ["Logement près de l'entreprise + hébergement court près de l'école", "Tu vis là où tu passes le plus de temps", "Il faut trouver où dormir pendant les semaines de cours"],
            ["Deux logements", "Confort et stabilité", "Le plus cher : à réserver aux salaires qui le permettent"],
            ["Colocation ou sous-location à la semaine", "Souple et moins cher", "Moins d'intimité, à organiser à l'avance"],
            ["Foyers de jeunes travailleurs, résidences pour alternants", "Loyers adaptés, durées flexibles", "Places limitées : demande tôt"],
          ],
        },
      },
      {
        heading: "Les aides qui peuvent t'aider",
        list: [
          "Aide Mobili-Jeune d'Action Logement : jusqu'à 100 € par mois sur ton loyer si tu as moins de 30 ans et que tu gagnes au maximum 120 % du SMIC.",
          "APL : uniquement pour ton logement principal. Fais ta simulation sur le site de la CAF.",
          "Ton CFA : les frais d'hébergement et de restauration pendant les périodes de cours peuvent être en partie pris en charge. Demande ce qui est prévu.",
          "Ton entreprise : certaines remboursent une partie des trajets ou aident au logement. Pose la question avant de signer.",
          "Transport : l'employeur rembourse la moitié de ton abonnement de transport en commun pour aller au travail.",
        ],
      },
      {
        heading: "Fais ton budget avant de signer",
        paragraphs: [
          "Additionne loyers, trajets entre les deux villes, repas et abonnements, puis compare avec ton salaire net d'alternant et tes aides. Si le reste à vivre est trop faible, négocie avec l'entreprise (salaire au-dessus du minimum, aide au logement) ou cherche une entreprise plus proche de ton école.",
        ],
      },
      {
        heading: "Les bons réflexes",
        list: [
          "Réserve tes trains à l'avance et regarde les cartes de réduction jeunes.",
          "Préviens ton tuteur de tes dates de cours dès le début, pour qu'il anticipe tes absences.",
          "Prévois un temps de récupération : enchaîner trajets, cours et travail fatigue vite.",
        ],
      },
    ],
    faq: [
      {
        q: "Peut-on faire une alternance avec une entreprise dans une autre ville que l'école ?",
        a: "Oui, rien ne l'interdit. Il faut juste que le rythme école/entreprise soit tenable pour toi et que ton CFA et ton entreprise soient d'accord.",
      },
      {
        q: "Peut-on toucher les APL pour deux logements ?",
        a: "Non, les APL ne concernent que ton logement principal. D'autres aides (Mobili-Jeune, prise en charge par le CFA ou l'entreprise) peuvent compléter.",
      },
      {
        q: "Qui paie les trajets entre l'école et l'entreprise ?",
        a: "Ce n'est pas automatique : demande à ton CFA et à ton entreprise ce qu'ils prennent en charge. L'employeur rembourse dans tous les cas la moitié de ton abonnement de transport en commun domicile-travail.",
      },
    ],
  },
  {
    slug: "chomage-fin-alternance",
    title: "Chômage après une alternance : tes droits à la fin du contrat",
    metaDescription:
      "Fin de contrat d'apprentissage ou de professionnalisation : as-tu droit au chômage (ARE) ? Conditions, démarches, montant et ce qui change si le contrat est rompu avant la fin.",
    publishedAt: "2026-10-07",
    updatedAt: "2026-10-07",
    related: ["rupture-contrat-apprentissage", "aides-alternants", "contrat-apprentissage-ou-contrat-pro"],
    intro: [
      "Bonne nouvelle : en alternance, tu es salarié. À la fin de ton contrat d'apprentissage ou de professionnalisation, tu peux donc toucher l'allocation chômage (l'ARE, allocation d'aide au retour à l'emploi), à condition de remplir les mêmes conditions que les autres salariés. Voici lesquelles et comment t'y prendre.",
    ],
    sections: [
      {
        heading: "Les conditions pour toucher le chômage",
        list: [
          "Avoir travaillé au moins 6 mois (130 jours ou 910 heures) au cours des 24 derniers mois. Tes périodes d'alternance comptent, y compris les jours de cours : tu es sous contrat de travail.",
          "Avoir perdu ton emploi de façon involontaire : la fin normale d'un contrat à durée déterminée (c'est le cas de la plupart des contrats d'alternance) en fait partie.",
          "T'inscrire comme demandeur d'emploi à France Travail dans les 12 mois qui suivent la fin du contrat.",
          "Être à la recherche active d'un emploi.",
        ],
      },
      {
        heading: "Et si le contrat a été rompu avant la fin ?",
        paragraphs: [
          "Tout dépend de qui est à l'origine de la rupture. Un licenciement ouvre en principe des droits ; une démission non, sauf cas de démission considérée comme légitime par l'assurance chômage. Pour une rupture d'un commun accord, renseigne-toi directement auprès de France Travail avant de signer : c'est le seul à pouvoir te dire si tu seras indemnisé.",
          "Rappel : pendant les 45 premiers jours de formation en entreprise, le contrat d'apprentissage peut être rompu librement par toi ou par l'employeur. Après, les règles de rupture sont encadrées (voir notre guide sur la rupture du contrat d'apprentissage).",
        ],
      },
      {
        heading: "Combien vas-tu toucher ?",
        paragraphs: [
          "L'allocation est calculée à partir de tes salaires bruts des derniers mois. Comme un salaire d'alternant est souvent inférieur au SMIC, l'allocation est en général modeste. La durée d'indemnisation dépend du temps pendant lequel tu as travaillé : plus ton contrat a été long, plus tu peux être indemnisé longtemps.",
          "Pour connaître ton montant exact, fais la simulation sur le site de France Travail avec tes fiches de paie, ou demande à ton conseiller lors de ton inscription.",
        ],
      },
      {
        heading: "Les démarches, dans l'ordre",
        list: [
          "Avant la fin du contrat : récupère tes fiches de paie et vérifie que ton employeur te remettra bien ton attestation employeur (il la transmet à France Travail), ton certificat de travail et ton solde de tout compte.",
          "Le lendemain de la fin du contrat : inscris-toi sur francetravail.fr. Plus tu attends, plus tu retardes le début de l'indemnisation.",
          "L'indemnisation ne démarre pas le jour même : il y a un délai d'attente, et parfois un différé si tu as touché des indemnités de congés payés à la fin du contrat.",
          "Ensuite, actualise ta situation chaque mois sur ton espace France Travail, même si tu as retrouvé du travail entre-temps.",
        ],
      },
      {
        heading: "Les autres options si tu n'as pas de droits",
        list: [
          "Enchaîner une nouvelle alternance pour continuer tes études (un nouveau diplôme, un niveau au-dessus) : c'est souvent la meilleure suite.",
          "Le contrat d'engagement jeune (CEJ) : un accompagnement intensif avec une allocation, pour les jeunes de moins de 26 ans sans emploi ni formation. Renseigne-toi auprès de France Travail ou de la mission locale.",
          "La prime d'activité, dès que tu retravailles, même à temps partiel.",
        ],
      },
      {
        heading: "Et après un stage ?",
        paragraphs: [
          "Un stage ne donne pas droit au chômage : le stagiaire n'est pas salarié et la gratification n'est pas un salaire. Seuls tes emplois salariés (jobs étudiants, CDD, alternance) comptent pour ouvrir des droits.",
        ],
      },
    ],
    faq: [
      {
        q: "Un apprenti a-t-il droit au chômage à la fin de son contrat ?",
        a: "Oui. L'apprenti est un salarié : s'il a travaillé au moins 6 mois au cours des 24 derniers mois et que son contrat est arrivé à son terme, il peut toucher l'allocation chômage après s'être inscrit à France Travail.",
      },
      {
        q: "Les jours de cours au CFA comptent-ils pour le chômage ?",
        a: "Oui : pendant l'alternance, tu es sous contrat de travail en permanence, y compris pendant les périodes de formation.",
      },
      {
        q: "Peut-on toucher le chômage après un stage ?",
        a: "Non, un stage ne compte pas comme un emploi salarié et n'ouvre pas de droits à l'allocation chômage.",
      },
    ],
    sources: [
      { label: "Conditions pour avoir droit aux allocations chômage (Unédic)", url: "https://www.unedic.org/l-assurance-chomage-et-vous/demandeur-d-emploi-ou-salarie/mon-indemnisation/quelles-sont-les-conditions-pour-avoir-droit-aux-allocations-chomage" },
      { label: "Ai-je droit à l'allocation chômage (ARE) ? (France Travail)", url: "https://www.francetravail.fr/candidat/mes-droits-aux-aides-et-allocati/lessentiel-a-savoir-sur-lallocat/ai-je-droit-a-lallocation-chomag.html" },
    ],
  },
  {
    slug: "logement-alternance-stage",
    title: "Se loger pendant une alternance ou un stage : aides et solutions",
    metaDescription:
      "APL, aide Mobili-Jeune, garantie Visale, avance Loca-Pass, logements pour jeunes : toutes les solutions pour te loger pendant ton alternance ou ton stage, et les aides que tu peux cumuler.",
    publishedAt: "2026-10-07",
    updatedAt: "2026-10-07",
    related: ["aides-alternants", "alternance-deux-villes", "gratification-de-stage"],
    intro: [
      "Trouver un logement près de ton entreprise est souvent le casse-tête n°1 d'une alternance ou d'un stage, surtout dans les grandes villes. Bonne nouvelle : plusieurs aides existent et la plupart se cumulent. Voici lesquelles demander, et dans quel ordre.",
    ],
    sections: [
      {
        heading: "Les aides qui baissent ton loyer",
        list: [
          "Les aides au logement de la CAF (APL ou ALS selon le logement) : calculées selon tes ressources, ton loyer et ta ville. Fais la simulation sur caf.fr dès que tu as une adresse.",
          "L'aide Mobili-Jeune d'Action Logement (alternants) : de 10 € à 100 € par mois sur ton loyer, si tu as moins de 30 ans, que tu es en contrat d'apprentissage ou de professionnalisation dans une entreprise du secteur privé non agricole et que ton salaire brut ne dépasse pas 120 % du SMIC.",
        ],
      },
      {
        heading: "Mobili-Jeune : les conditions à ne pas rater",
        list: [
          "La demande se fait au plus tôt 3 mois avant et au plus tard 5 mois après le début de ton contrat d'alternance.",
          "Le logement doit être à plus de 70 km de ton ancienne adresse, ou à plus de 40 minutes de trajet.",
          "L'aide peut être demandée pour 2 années de formation au maximum.",
        ],
      },
      {
        heading: "Les aides pour décrocher le logement",
        list: [
          "La garantie Visale d'Action Logement : une caution gratuite qui rassure le propriétaire (elle couvre les loyers impayés). Si tu as 30 ans ou moins, tu peux y avoir droit quel que soit ton statut : étudiant, alternant, stagiaire. Fais ta demande sur visale.fr avant de visiter.",
          "L'avance Loca-Pass d'Action Logement : un prêt à 0 % jusqu'à 1 200 € pour payer ton dépôt de garantie, remboursable par petites mensualités.",
        ],
      },
      {
        heading: "Les solutions de logement adaptées aux alternants et stagiaires",
        table: {
          headers: ["Solution", "Pour qui", "À savoir"],
          rows: [
            ["Résidence Crous", "Étudiants (certaines résidences acceptent aussi les alternants)", "Loyers bas, places limitées : fais ta demande tôt."],
            ["Foyer de jeunes travailleurs (FJT)", "Jeunes actifs, alternants, stagiaires", "Durées souples (quelques semaines à quelques mois), loyers adaptés."],
            ["Résidence pour alternants ou étudiants", "Alternants, étudiants", "Souvent meublées, parfois à la semaine pour suivre ton rythme école/entreprise."],
            ["Colocation", "Tout le monde", "Le moins cher dans les grandes villes ; vérifie qui signe le bail et comment se répartit le dépôt de garantie."],
            ["Location meublée en bail mobilité", "Stagiaires, alternants, en formation", "Bail de 1 à 10 mois, sans dépôt de garantie : pratique pour un stage."],
          ],
        },
      },
      {
        heading: "Ton plan d'action",
        list: [
          "Dès que ton contrat ou ta convention est signé : demande la garantie Visale, puis cherche ton logement.",
          "Dès que tu as une adresse : fais ta demande d'aide au logement à la CAF, puis Mobili-Jeune si tu es alternant.",
          "Demande à ton CFA ou à ton école s'ils ont des partenariats avec des résidences ou des foyers.",
          "Demande à ton entreprise : certaines aident au logement ou connaissent des solutions près du site.",
        ],
      },
    ],
    faq: [
      {
        q: "Un alternant peut-il toucher les APL ?",
        a: "Oui, les aides au logement de la CAF sont ouvertes aux alternants comme aux étudiants, selon leurs ressources et leur loyer. Elles se cumulent avec l'aide Mobili-Jeune.",
      },
      {
        q: "Quel est le montant de l'aide Mobili-Jeune ?",
        a: "De 10 € à 100 € par mois, selon ton loyer et les autres aides que tu touches, pour les alternants de moins de 30 ans gagnant au maximum 120 % du SMIC.",
      },
      {
        q: "La garantie Visale est-elle gratuite ?",
        a: "Oui, elle est gratuite pour toi comme pour le propriétaire, qui doit accepter ce type de caution.",
      },
    ],
    sources: [
      { label: "Aides au logement pour les alternants (Action Logement)", url: "https://www.actionlogement.fr/guides/trouver-un-logement/quelles-aides-au-logement-pour-les-alternants-en-contrat-pro-ou-apprentissage" },
      { label: "L'aide Mobili-Jeune (Action Logement)", url: "https://www.actionlogement.fr/l-aide-mobili-jeune" },
      { label: "Aides au logement d'un étudiant (service-public.gouv.fr)", url: "https://www.service-public.gouv.fr/particuliers/vosdroits/F1563" },
    ],
  },
  {
    slug: "impots-alternant",
    title: "Impôts en alternance : faut-il déclarer ton salaire d'apprenti ?",
    metaDescription:
      "Salaire d'apprenti exonéré jusqu'à 21 622 € (revenus 2025), contrat pro imposable, rattachement aux parents, prélèvement à la source : ce que tu dois déclarer et comment.",
    publishedAt: "2026-10-07",
    updatedAt: "2026-10-07",
    related: ["aides-alternants", "gratification-de-stage", "contrat-apprentissage-ou-contrat-pro"],
    intro: [
      "Première fiche de paie, première déclaration d'impôts : en alternance, la question tombe vite. La réponse dépend surtout de ton contrat. En apprentissage, ton salaire est exonéré jusqu'à un plafond que tu ne dépasseras presque jamais. En contrat de professionnalisation, il se déclare comme n'importe quel salaire. Voici les règles, puis comment remplir ta déclaration.",
    ],
    sections: [
      {
        heading: "Apprenti : ton salaire est exonéré jusqu'au SMIC annuel",
        paragraphs: [
          "En contrat d'apprentissage, dans le privé comme dans le public, ton salaire n'est imposable que pour la partie qui dépasse le montant annuel du SMIC : 21 622 € pour les revenus 2025, déclarés au printemps 2026 (article 81 bis du Code général des impôts). Comme un salaire d'apprenti est un pourcentage du SMIC, tu restes en général en dessous : rien d'imposable.",
          "Exemple : tu as touché 22 000 € de salaire d'apprenti en 2025. Seuls 378 € (22 000 − 21 622) sont à déclarer.",
        ],
      },
      {
        heading: "Contrat de professionnalisation : pas d'exonération spécifique",
        paragraphs: [
          "L'exonération des apprentis ne s'applique pas au contrat de professionnalisation. Ton salaire se déclare en entier, comme celui de n'importe quel salarié. Avec un salaire modeste, l'impôt final est souvent faible, voire nul une fois les abattements appliqués, mais tu dois quand même le déclarer.",
        ],
      },
      {
        heading: "Déclarer seul ou être rattaché à tes parents ?",
        list: [
          "Tu peux être rattaché au foyer fiscal de tes parents si tu as moins de 21 ans au 1er janvier de l'année des revenus, ou moins de 25 ans si tu poursuis tes études.",
          "Si tu es rattaché, ce sont tes parents qui déclarent ton salaire dans leur déclaration, avec la même exonération : seule la partie au-dessus du plafond compte. Tu dois signer une demande de rattachement sur papier libre, qu'ils gardent en cas de contrôle.",
          "Si tu déclares seul, tu fais ta propre déclaration. Tes parents peuvent alors déduire de leurs revenus l'aide qu'ils te versent (pension alimentaire), dans certaines limites.",
          "Quelle option choisir ? Ça dépend des revenus de chacun : fais les deux simulations sur le simulateur d'impôt d'impots.gouv.fr avant de décider.",
        ],
      },
      {
        heading: "Le prélèvement à la source",
        paragraphs: [
          "Apprenti : tant que ton salaire cumulé de l'année reste sous le SMIC annuel, ton employeur ne prélève pas d'impôt sur ta paie.",
          "Contrat pro : ton employeur applique ton taux de prélèvement. Pour un premier emploi, sans taux connu, il applique un taux par défaut qui dépend de ton salaire, nul pour les petits salaires. Tu peux consulter et modifier ton taux dans ton espace sur impots.gouv.fr.",
        ],
      },
      {
        heading: "Remplir ta déclaration, étape par étape",
        list: [
          "Ta première déclaration peut se faire en ligne sur impots.gouv.fr. Garde tes fiches de paie de l'année, surtout celle de décembre, qui indique le cumul imposable.",
          "Vérifie le montant de salaire prérempli : seule la partie imposable doit y figurer. Corrige-le s'il ne correspond pas.",
          "Même avec 0 € imposable, fais ta déclaration : tu reçois ensuite un avis d'impôt (de non-imposition), souvent demandé pour un logement, une bourse ou des aides.",
          "Tu as eu plusieurs contrats dans l'année (job d'été, CDD, alternance) ? Chacun suit sa propre règle : l'exonération des apprentis ne concerne que le salaire d'apprenti.",
        ],
      },
      {
        heading: "Et la gratification de stage ? Et les jobs étudiants ?",
        paragraphs: [
          "Même principe pour les stagiaires : la gratification de stage est exonérée dans la même limite du SMIC annuel (voir notre guide sur la gratification de stage). Les salaires de jobs étudiants ont leur propre exonération, dans la limite de 3 fois le SMIC mensuel, si tu as 25 ans au plus au 1er janvier de l'année.",
        ],
      },
    ],
    faq: [
      {
        q: "Un apprenti paie-t-il des impôts ?",
        a: "En général non : son salaire est exonéré d'impôt sur le revenu jusqu'au montant annuel du SMIC (21 622 € pour les revenus 2025). Seule la partie au-dessus est imposable.",
      },
      {
        q: "Le salaire d'un contrat de professionnalisation est-il imposable ?",
        a: "Oui, il se déclare en entier : l'exonération réservée aux apprentis ne s'applique pas au contrat de professionnalisation.",
      },
      {
        q: "Mes parents doivent-ils déclarer mon salaire d'apprenti ?",
        a: "Seulement si tu es rattaché à leur foyer fiscal : ils déclarent alors la partie de ton salaire qui dépasse le plafond d'exonération. Si tu déclares seul, c'est toi qui le fais.",
      },
    ],
    sources: [
      { label: "Comment est imposé le salaire d'un apprenti ? (service-public.gouv.fr)", url: "https://www.service-public.gouv.fr/particuliers/vosdroits/F11249" },
      { label: "Le rattachement d'un enfant majeur au foyer fiscal (economie.gouv.fr)", url: "https://www.economie.gouv.fr/particuliers/impots-et-fiscalite/gerer-mon-impot-sur-le-revenu/le-rattachement-dun-enfant-majeur-au-foyer-fiscal-quels-avantages" },
      { label: "C'est ma première déclaration, que dois-je déclarer ? (impots.gouv.fr)", url: "https://www.impots.gouv.fr/particulier/questions/cest-ma-premiere-declaration-que-dois-je-declarer" },
    ],
  },
  {
    slug: "alternance-fonction-publique",
    title: "Alternance dans la fonction publique : mairie, hôpital, ministère",
    metaDescription:
      "Mairie, hôpital, ministère : comment trouver un apprentissage dans la fonction publique, ton salaire et les majorations possibles, tes droits et ce qui se passe après le contrat.",
    publishedAt: "2026-10-07",
    updatedAt: "2026-10-07",
    related: ["trouver-une-alternance", "candidature-spontanee-alternance", "aides-alternants"],
    intro: [
      "L'État, les collectivités (mairies, départements, régions) et les hôpitaux recrutent des apprentis, du CAP au master : informatique, RH, comptabilité, communication, petite enfance, espaces verts, social... Une bonne piste si tu vises le service public, ou si tu cherches une alternance en dehors des entreprises privées.",
    ],
    sections: [
      {
        heading: "Qui recrute des apprentis dans le public ?",
        list: [
          "La fonction publique d'État : ministères, préfectures, services de l'État dans les régions et les départements, établissements publics.",
          "La fonction publique territoriale : communes, intercommunalités, départements, régions.",
          "La fonction publique hospitalière : hôpitaux, EHPAD et établissements médico-sociaux publics.",
        ],
      },
      {
        heading: "Quel contrat ?",
        paragraphs: [
          "Dans l'administration, l'alternance passe par le contrat d'apprentissage : le contrat de professionnalisation est réservé aux entreprises. Tu es salarié, avec un vrai contrat de travail, des congés payés et un temps de formation au CFA compté comme du temps de travail. Mais tu n'es pas fonctionnaire : le contrat s'arrête à la date prévue.",
        ],
      },
      {
        heading: "Ton salaire",
        paragraphs: [
          "La base est la même que dans le privé : un pourcentage du SMIC qui dépend de ton âge et de ton année de contrat (calcule-le avec notre simulateur de salaire en alternance).",
          "L'employeur public peut ajouter une majoration de 10 ou 20 points. Avant 2020, elle était automatique selon le niveau du diplôme préparé ; depuis le décret du 24 avril 2020, chaque employeur décide. Pose la question avant de signer : la différence peut dépasser 300 € brut par mois.",
        ],
      },
      {
        heading: "Où trouver les offres",
        list: [
          "Choisir le service public (choisirleservicepublic.gouv.fr) : la plateforme officielle de recrutement des trois fonctions publiques, avec de nombreuses offres d'apprentissage.",
          "Emploi-territorial.fr : les offres des collectivités, y compris des petites communes.",
          "Les sites des hôpitaux et des collectivités de ta ville, rubrique « recrutement » ou « emploi ».",
          "La candidature spontanée au service RH : une mairie ou un service qui n'a rien publié peut quand même accueillir un apprenti si le poste correspond à ta formation.",
          "Comme dans le privé, beaucoup d'offres sortent au printemps pour une rentrée en septembre : commence tôt.",
        ],
      },
      {
        heading: "Et après le contrat ?",
        paragraphs: [
          "Un apprentissage dans le public ne fait pas de toi un fonctionnaire : pour être titularisé, il faut en principe réussir un concours. Mais l'expérience compte : tu connais le fonctionnement de l'administration, tu as un réseau, et tu peux enchaîner sur un poste de contractuel ou préparer les concours qui t'intéressent.",
        ],
      },
      {
        heading: "Les aides",
        paragraphs: [
          "Tu as droit à la plupart des aides des alternants (aides au logement de la CAF, prime d'activité selon tes revenus). Attention : l'aide Mobili-Jeune d'Action Logement est réservée aux alternants du secteur privé. Le détail dans notre guide des aides aux alternants.",
        ],
      },
    ],
    faq: [
      {
        q: "Peut-on faire une alternance dans une mairie ?",
        a: "Oui : les communes, comme les départements, les régions, les hôpitaux et les services de l'État, recrutent des apprentis, du CAP au master.",
      },
      {
        q: "Combien gagne un apprenti dans la fonction publique ?",
        a: "Au minimum la même chose que dans le privé : un pourcentage du SMIC selon ton âge et ton année de contrat. L'employeur peut ajouter 10 ou 20 points, sans y être obligé depuis 2020.",
      },
      {
        q: "Devient-on fonctionnaire après un apprentissage ?",
        a: "Non, pas automatiquement : il faut en principe passer un concours. L'apprentissage reste un bon tremplin pour découvrir le métier et décrocher un poste de contractuel.",
      },
    ],
    sources: [
      { label: "L'apprentissage, le bon choix pour vous (fonction-publique.gouv.fr)", url: "https://www.fonction-publique.gouv.fr/devenir-agent-public/lapprentissage-le-bon-choix-pour-vous" },
      { label: "Apprentissage dans la fonction publique : quelles sont les règles ? (service-public.gouv.fr)", url: "https://www.service-public.gouv.fr/particuliers/vosdroits/F3059" },
      { label: "Apprentissage dans le secteur public : décret du 24 avril 2020 (Centre Inffo)", url: "https://www.centre-inffo.fr/site-droit-formation/actualites-droit/adaptation-des-dispositions-reglementaires-sur-lapprentissage-dans-le-secteur-public-non-industriel-et-commercial" },
    ],
  },
  {
    slug: "bourse-et-alternance",
    title: "Bourse du Crous et alternance : peut-on cumuler ?",
    metaDescription:
      "En alternance, tu perds la bourse sur critères sociaux ; en stage, tu la gardes. Pourquoi, quoi faire si tu signes en cours d'année, et les aides qui restent possibles.",
    publishedAt: "2026-10-07",
    updatedAt: "2026-10-07",
    related: ["aides-alternants", "alternance-vs-stage", "logement-alternance-stage"],
    intro: [
      "La réponse courte : non en alternance, oui en stage. Dès que tu signes un contrat d'apprentissage ou de professionnalisation, tu n'as plus droit à la bourse sur critères sociaux du Crous. Pendant un stage, en revanche, tu la gardes. Voici pourquoi, et ce que tu peux toucher à la place.",
    ],
    sections: [
      {
        heading: "Pourquoi l'alternance fait perdre la bourse",
        paragraphs: [
          "La bourse sur critères sociaux est réservée aux étudiants en formation initiale qui n'ont pas de salaire. En alternance, tu es salarié : tu touches un salaire tous les mois et ta formation est financée sans que tu la paies (en apprentissage, elle est gratuite pour toi). Que ce soit en contrat d'apprentissage ou en contrat de professionnalisation, tu sors donc du cadre de la bourse.",
        ],
      },
      {
        heading: "Tu es boursier et tu signes un contrat en cours d'année ?",
        list: [
          "Préviens le Crous dès la signature, depuis ton espace sur messervices.etudiant.gouv.fr : la bourse s'arrête quand l'alternance commence.",
          "Si tu ne dis rien, les mensualités versées après la signature risquent de t'être réclamées. Mieux vaut les éviter que de devoir les rembourser.",
          "Si ton contrat est rompu et que tu reprends tes études sans contrat, rapproche-toi du Crous pour voir si tu peux retrouver tes droits.",
        ],
      },
      {
        heading: "Ce que tu gardes ou gagnes en alternance",
        list: [
          "Ton salaire, qui dépend de ton âge et de ton année de contrat (calcule-le avec notre simulateur de salaire en alternance).",
          "Le logement en résidence Crous reste possible selon les places, et le Crous peut aussi proposer des aides d'urgence.",
          "Les aides au logement de la CAF, la prime d'activité selon tes revenus, et l'aide Mobili-Jeune si ton employeur est du privé : le détail dans notre guide des aides aux alternants.",
          "Ton salaire d'apprenti n'est pas imposable jusqu'au SMIC annuel (voir notre guide sur les impôts en alternance).",
        ],
      },
      {
        heading: "En stage : tu gardes ta bourse",
        paragraphs: [
          "Un stage fait partie de ta formation : tu restes étudiant, et ta bourse est maintenue pendant le stage si ta formation est habilitée à recevoir des boursiers. Elle se cumule avec la gratification de stage.",
        ],
      },
      {
        heading: "Alternance ou formation classique avec bourse : comment comparer",
        paragraphs: [
          "Pose les deux chiffres côte à côte : ton salaire d'apprenti sur 12 mois (simulateur) et le montant de ta bourse sur l'année. N'oublie pas qu'en alternance, tes frais de scolarité sont payés et tu accumules de l'expérience. Pour beaucoup d'étudiants, l'alternance rapporte plus, mais fais le calcul avec tes propres montants.",
        ],
      },
    ],
    faq: [
      {
        q: "Peut-on toucher la bourse du Crous en alternance ?",
        a: "Non : en contrat d'apprentissage ou de professionnalisation, tu es salarié et tu n'as plus droit à la bourse sur critères sociaux.",
      },
      {
        q: "Garde-t-on sa bourse pendant un stage ?",
        a: "Oui : la bourse est maintenue pendant un stage intégré à ta formation et se cumule avec la gratification de stage.",
      },
      {
        q: "Que faire si je signe un contrat d'alternance en cours d'année ?",
        a: "Préviens le Crous dès la signature : la bourse s'arrête au début du contrat, et les mensualités touchées après pourraient t'être réclamées.",
      },
    ],
    sources: [
      { label: "Étudiant en apprentissage ou en stage (réseau des Crous)", url: "https://www.lescrous.fr/espace-partenaires/les-situations-rencontrees-par-les-etudiants/etudiant-en-apprentissage-stage/" },
      { label: "Boursiers : vos droits et vos devoirs (L'Étudiant)", url: "https://www.letudiant.fr/lifestyle/aides-financieres/boursiers-vos-droits-et-vos-devoirs-passes-a-la-loupe.html" },
      { label: "Contrat d'apprentissage (service-public.gouv.fr)", url: "https://www.service-public.gouv.fr/particuliers/vosdroits/F2918" },
    ],
  },
  {
    slug: "rythme-alternance",
    title: "Rythme de l'alternance : combien de temps à l'école et en entreprise ?",
    metaDescription:
      "2 jours / 3 jours, 1 semaine / 3 semaines, blocs d'un mois : les rythmes d'alternance, ce que dit la loi (25 % de formation minimum en apprentissage) et comment choisir.",
    publishedAt: "2026-10-07",
    updatedAt: "2026-10-07",
    related: ["contrat-apprentissage-ou-contrat-pro", "alternance-deux-villes", "conges-alternant"],
    intro: [
      "En alternance, tu partages ton temps entre l'école (ou le CFA) et l'entreprise. Le rythme change d'une formation à l'autre : quelques jours par semaine, une semaine sur trois, ou des blocs de plusieurs semaines. Voici ce que dit la loi, les rythmes les plus courants et comment choisir.",
    ],
    sections: [
      {
        heading: "Ce que dit la loi",
        list: [
          "Contrat d'apprentissage : la formation au CFA représente au moins 25 % de la durée totale du contrat.",
          "Contrat de professionnalisation : la formation représente entre 15 % et 25 % de la durée du contrat, avec au moins 150 heures (plus si un accord de branche le prévoit).",
          "Dans les deux cas, le temps passé en formation compte comme du temps de travail : tu es payé ces jours-là.",
        ],
      },
      {
        heading: "Les rythmes les plus courants",
        table: {
          headers: ["Rythme", "Pour qui", "À savoir"],
          rows: [
            ["2 jours école / 3 jours entreprise", "BTS, commerce, vente", "Tu es en entreprise chaque semaine : idéal pour suivre des clients ou un magasin."],
            ["1 semaine école / 2 ou 3 semaines entreprise", "BUT, licence pro, bachelor", "Bon compromis : des périodes en entreprise assez longues pour avancer sur un projet."],
            ["2 semaines / 2 semaines", "Bachelor, master", "Rythme régulier, pratique pour organiser ton logement."],
            ["Blocs d'un mois ou plus", "Master, écoles d'ingénieurs", "Idéal pour les projets longs (développement, ingénierie) et si l'école est loin de l'entreprise."],
          ],
        },
      },
      {
        heading: "Qui décide du rythme ?",
        paragraphs: [
          "C'est l'école ou le CFA qui fixe le rythme de chaque formation. L'entreprise l'accepte en signant le contrat. Demande le calendrier de l'année avant de candidater, et mets-le en avant en entretien : certains recruteurs cherchent un rythme précis.",
        ],
      },
      {
        heading: "Comment choisir ton rythme",
        list: [
          "Métiers de terrain (vente, commerce, relation client) : un rythme court te garde au contact des clients chaque semaine.",
          "Métiers de projet (développement, data, ingénierie, marketing) : les blocs longs te laissent le temps de livrer quelque chose.",
          "École et entreprise dans deux villes : préfère les blocs, sinon les trajets et le double loyer deviennent vite épuisants (voir notre guide sur l'alternance dans deux villes).",
        ],
      },
      {
        heading: "Et pendant les vacances scolaires ?",
        paragraphs: [
          "Tu es salarié : pas de vacances scolaires. Quand l'école ferme, tu es en entreprise. Tu as droit à 5 semaines de congés payés par an, comme les autres salariés, à poser en accord avec ton employeur (voir notre guide sur les congés d'un alternant).",
        ],
      },
    ],
    faq: [
      {
        q: "Quel est le rythme le plus courant en alternance ?",
        a: "Il n'y a pas de rythme unique : 2 jours à l'école et 3 en entreprise en BTS, une semaine sur trois ou des blocs de plusieurs semaines en licence, bachelor ou master. Chaque école fixe le sien.",
      },
      {
        q: "Combien de temps de formation en contrat d'apprentissage ?",
        a: "Au moins 25 % de la durée totale du contrat. En contrat de professionnalisation, c'est entre 15 % et 25 %, avec un minimum de 150 heures.",
      },
      {
        q: "Un alternant a-t-il les vacances scolaires ?",
        a: "Non : il est salarié. Quand l'école ferme, il est en entreprise. Il a droit à 5 semaines de congés payés par an.",
      },
    ],
    sources: [
      { label: "Contrat d'apprentissage (service-public.gouv.fr)", url: "https://www.service-public.gouv.fr/particuliers/vosdroits/F2918" },
      { label: "Contrat de professionnalisation (service-public.gouv.fr)", url: "https://www.service-public.gouv.fr/particuliers/vosdroits/F15478" },
    ],
  },
  {
    slug: "transport-alternance-stage",
    title: "Transport en alternance ou en stage : 50 % de ton abonnement remboursé",
    metaDescription:
      "Alternant ou stagiaire, ton employeur doit rembourser la moitié de ton abonnement de transport en commun ou de vélo en libre-service. Quels abonnements, comment le demander.",
    publishedAt: "2026-10-07",
    updatedAt: "2026-10-07",
    related: ["aides-alternants", "gratification-de-stage", "premier-jour-en-entreprise"],
    intro: [
      "Navigo, abonnement TCL, Tisséo ou vélo en libre-service : si tu vas au travail en transports en commun, ton employeur doit te rembourser la moitié de ton abonnement. Ça vaut pour les alternants comme pour les stagiaires. Beaucoup ne le demandent jamais : à Paris, la moitié d'un Navigo mensuel, c'est plus de 40 € par mois.",
    ],
    sections: [
      {
        heading: "La règle",
        list: [
          "Alternant (apprentissage ou contrat pro) : tu es salarié, donc tu as les mêmes droits que les autres salariés. L'employeur prend en charge 50 % de ton abonnement pour aller de chez toi à ton lieu de travail.",
          "Stagiaire : la loi te donne le même droit, dans les mêmes conditions que les salariés de l'entreprise (article L124-13 du Code de l'éducation).",
          "Ça marche aussi pour un abonnement à un service public de vélos en location.",
        ],
      },
      {
        heading: "Quels abonnements sont remboursés ?",
        list: [
          "Oui : les abonnements annuels, mensuels et hebdomadaires de transports en commun (métro, bus, tram, train régional) et de vélos en libre-service.",
          "Non : les tickets à l'unité et les carnets.",
          "Astuce : si tu payais au ticket, passe à un abonnement mensuel. Avec le remboursement, il te coûtera souvent moins cher.",
        ],
      },
      {
        heading: "Comment te faire rembourser",
        list: [
          "Envoie un justificatif de ton abonnement (attestation ou facture) au service RH ou à ton tuteur dès ton arrivée.",
          "Le remboursement apparaît sur ta fiche de paie (ou avec ta gratification si tu es stagiaire), en général chaque mois.",
          "Tu ne vois rien sur ta paie ? Demande-le simplement : c'est un droit, pas une faveur.",
        ],
      },
      {
        heading: "Et si tu viens en vélo, en voiture ou à pied ?",
        paragraphs: [
          "Le remboursement obligatoire ne concerne que les abonnements de transports en commun et de vélos en libre-service. Certaines entreprises versent en plus un forfait mobilités durables (vélo perso, covoiturage, trottinette) ou une prime de transport pour la voiture, mais ce n'est pas obligatoire : demande au service RH ce qui existe chez eux.",
        ],
      },
      {
        heading: "Et le trajet jusqu'à l'école ?",
        paragraphs: [
          "La prise en charge obligatoire concerne le trajet entre ton domicile et ton lieu de travail. Pour les trajets vers le CFA ou l'école, renseigne-toi auprès de ton CFA et de ta région, qui proposent parfois des aides au transport pour les apprentis.",
        ],
      },
    ],
    faq: [
      {
        q: "Un alternant a-t-il droit au remboursement de son Navigo ?",
        a: "Oui : comme tout salarié, l'alternant a droit à la prise en charge de 50 % de son abonnement de transport en commun pour le trajet domicile-travail.",
      },
      {
        q: "Un stagiaire a-t-il droit au remboursement de ses transports ?",
        a: "Oui : le Code de l'éducation lui donne droit à la prise en charge de ses frais de transport dans les mêmes conditions que les salariés, soit 50 % de l'abonnement.",
      },
      {
        q: "Les tickets de métro à l'unité sont-ils remboursés ?",
        a: "Non, seuls les abonnements (hebdomadaires, mensuels ou annuels) sont pris en charge.",
      },
    ],
    sources: [
      { label: "Prise en charge des frais de transport des alternants (question écrite, Assemblée nationale)", url: "https://questions.assemblee-nationale.fr/q17/17-5121QE.htm" },
      { label: "Apprentis : titres-restaurant et frais de transport (info-tpe.fr, ministère du Travail)", url: "https://www.info-tpe.fr/faqs/apprenti-e/article/apprentis-acces-aux-titres-restaurant-et-au-remboursement-des-frais-transports" },
    ],
  },
  {
    slug: "mail-de-remerciement",
    title: "Mail de remerciement après un entretien ou un stage : modèles",
    metaDescription:
      "Le mail de remerciement à envoyer après un entretien d'alternance ou de stage, et à la fin de ton stage : quand l'envoyer, quoi dire, et 3 modèles à copier.",
    publishedAt: "2026-10-07",
    updatedAt: "2026-10-07",
    related: ["relancer-candidature", "entretien-alternance", "refuser-une-offre"],
    intro: [
      "Un mail de remerciement prend 3 minutes et te démarque : peu de candidats l'envoient. Après un entretien, il rappelle ta motivation au recruteur au moment où il compare les profils. À la fin d'un stage, il laisse une bonne dernière impression et garde la porte ouverte pour une alternance, un CDD ou une recommandation.",
    ],
    sections: [
      {
        heading: "Quand l'envoyer",
        list: [
          "Après un entretien : le jour même ou le lendemain matin, au plus tard. Après, il perd son effet.",
          "À la fin d'un stage ou d'une alternance : ton dernier jour ou le lendemain, à ton tuteur, et un mot plus court à l'équipe.",
          "À qui : à la personne qui t'a reçu. Si vous étiez plusieurs, un mail à chacun ou un mail groupé qui les cite tous.",
        ],
      },
      {
        heading: "Ce qu'il doit contenir",
        list: [
          "Un merci précis : cite un sujet abordé en entretien ou un projet du stage. Un merci générique ne sert à rien.",
          "Un rappel de ta motivation en une phrase, avec ce que tu apportes.",
          "Pas de pavé : 5 à 8 lignes maximum, sans pièce jointe sauf si on te l'a demandé.",
          "Relis-toi : une faute d'orthographe dans un mail de 6 lignes se voit.",
        ],
      },
      {
        heading: "Modèle 1 : après un entretien d'alternance ou de stage",
        paragraphs: [
          "Objet : Merci pour notre échange – alternance [intitulé du poste]",
          "Bonjour [Madame / Monsieur Nom],",
          "Merci pour le temps que vous m'avez accordé aujourd'hui. Notre échange sur [sujet précis : le lancement de la nouvelle offre, l'organisation de l'équipe...] m'a confirmé mon envie de rejoindre [entreprise] pour mon alternance en [formation].",
          "Je suis convaincu(e) que [une compétence ou une expérience] me permettra d'être rapidement utile à l'équipe. Je reste disponible pour toute information complémentaire.",
          "Bien cordialement,",
          "[Prénom Nom] – [téléphone]",
        ],
      },
      {
        heading: "Modèle 2 : à ton tuteur, à la fin de ton stage",
        paragraphs: [
          "Objet : Merci pour ces [X] mois de stage",
          "Bonjour [Prénom],",
          "Mon stage se termine aujourd'hui et je tenais à vous remercier pour votre accompagnement. J'ai beaucoup appris, en particulier sur [compétence ou projet], et je repars avec [ce que tu as gagné : de l'autonomie, une première expérience en...].",
          "Si une opportunité d'alternance ou de poste se présente dans l'équipe, je serais ravi(e) d'en discuter. Je me permettrai aussi de vous demander une recommandation sur LinkedIn.",
          "Encore merci et à bientôt,",
          "[Prénom Nom]",
        ],
      },
      {
        heading: "Modèle 3 : à l'équipe, ton dernier jour",
        paragraphs: [
          "Objet : Merci à toute l'équipe !",
          "Bonjour à tous,",
          "C'est mon dernier jour chez [entreprise] : merci pour votre accueil, votre patience et tout ce que vous m'avez appris pendant ces [X] mois. Je garde un super souvenir de [un moment ou un projet].",
          "Vous pouvez me retrouver sur LinkedIn : [lien]. À bientôt, j'espère !",
          "[Prénom]",
        ],
      },
      {
        heading: "Après le mail",
        list: [
          "Pas de réponse une semaine après l'entretien ? Une relance polie est normale (voir notre guide pour relancer une candidature).",
          "À la fin d'un stage : ajoute ton tuteur et tes collègues sur LinkedIn dans la foulée, et récupère ton attestation de stage.",
        ],
      },
    ],
    faq: [
      {
        q: "Faut-il envoyer un mail de remerciement après un entretien ?",
        a: "Oui, c'est rarement fait et ça marque : envoie-le le jour même ou le lendemain, en 5 à 8 lignes, avec un détail précis de l'entretien et un rappel de ta motivation.",
      },
      {
        q: "Que mettre dans un mail de fin de stage ?",
        a: "Un merci précis à ton tuteur (un projet, une compétence apprise), ton intérêt pour une suite éventuelle (alternance, poste) et une demande de recommandation LinkedIn.",
      },
      {
        q: "Un mail de remerciement peut-il faire changer une décision ?",
        a: "Il ne remplace pas l'entretien, mais quand deux profils se valent, le candidat qui a montré sa motivation jusqu'au bout part avec un avantage.",
      },
    ],
  },
  {
    slug: "attestation-de-stage",
    title: "Attestation de stage : ce qu'elle contient et à quoi elle sert",
    metaDescription:
      "L'attestation de stage est obligatoire à la fin de chaque stage. Ce qu'elle doit indiquer, comment l'obtenir, et comment elle te permet de valider jusqu'à 2 trimestres de retraite.",
    publishedAt: "2026-10-07",
    updatedAt: "2026-10-07",
    related: ["convention-de-stage", "gratification-de-stage", "rapport-de-stage"],
    intro: [
      "À la fin de ton stage, l'entreprise doit te remettre une attestation de stage. Ce n'est pas un détail : ton école peut te la demander pour valider ton stage, elle prouve ton expérience sur ton CV, et elle te permet de faire compter ton stage pour ta retraite. Voici ce qu'elle contient et quoi en faire.",
    ],
    sections: [
      {
        heading: "Une obligation pour l'entreprise",
        paragraphs: [
          "L'organisme qui t'accueille doit te remettre une attestation de stage à la fin du stage (article D124-9 du Code de l'éducation). Son modèle est fixé par un arrêté : c'est un document standard, que l'entreprise remplit.",
        ],
      },
      {
        heading: "Ce qu'elle doit indiquer",
        list: [
          "Tes nom et prénom, ton école et ta formation.",
          "Le nom et l'adresse de l'organisme d'accueil.",
          "Les dates de début et de fin, et la durée effective totale du stage.",
          "Le montant total de la gratification que tu as touchée, s'il y en a une.",
        ],
      },
      {
        heading: "Comment l'obtenir",
        list: [
          "Demande-la à ton tuteur ou au service RH une ou deux semaines avant la fin du stage, pour l'avoir ton dernier jour.",
          "Vérifie la durée et le montant de la gratification : ce sont eux qui comptent pour la retraite.",
          "Garde-la précieusement, en version papier et en PDF : on te la redemandera, parfois des années plus tard.",
        ],
      },
      {
        heading: "Faire compter ton stage pour ta retraite",
        paragraphs: [
          "Un stage gratifié peut être validé pour ta retraite, dans la limite de 2 trimestres, en payant une cotisation. La demande se fait dans les 2 ans qui suivent la fin du stage, avec l'attestation de stage, qui indique la durée et le montant de la gratification.",
          "C'est une démarche à faire tôt : passé le délai de 2 ans, ce n'est plus possible. Renseigne-toi auprès de ta caisse de retraite (pour la plupart des stages en entreprise, l'Assurance retraite) pour connaître le montant à payer.",
        ],
      },
      {
        heading: "Attestation de stage, convention, rapport : ne confonds pas",
        table: {
          headers: ["Document", "Quand", "Qui le fait"],
          rows: [
            ["Convention de stage", "Avant le début du stage", "Ton école, l'entreprise et toi (signée par les trois)"],
            ["Attestation de stage", "À la fin du stage", "L'entreprise"],
            ["Rapport de stage", "Après le stage", "Toi, pour ton école"],
          ],
        },
      },
    ],
    faq: [
      {
        q: "L'entreprise est-elle obligée de me donner une attestation de stage ?",
        a: "Oui : l'organisme d'accueil doit remettre une attestation de stage à chaque stagiaire à la fin du stage, avec la durée effective et le montant total de la gratification.",
      },
      {
        q: "Un stage compte-t-il pour la retraite ?",
        a: "Un stage gratifié peut être validé dans la limite de 2 trimestres, en payant une cotisation, si tu en fais la demande dans les 2 ans qui suivent la fin du stage.",
      },
      {
        q: "Quelle différence entre attestation et convention de stage ?",
        a: "La convention est signée avant le stage par l'école, l'entreprise et toi ; l'attestation est remise par l'entreprise à la fin du stage.",
      },
    ],
    sources: [
      { label: "Encadrement des stages, décret du 27 novembre 2014 (Bulletin officiel de l'Éducation nationale)", url: "https://www.education.gouv.fr/bo/14/Hebdo46/MENS1422390D.htm" },
      { label: "Accueil d'un stagiaire : les obligations de l'entreprise (economie.gouv.fr)", url: "https://www.economie.gouv.fr/entreprises/gerer-ses-ressources-humaines-et-ses-salaries/accueil-dun-stagiaire-quelles-sont-vos-obligations" },
      { label: "Attestation de stage : le modèle fixé par arrêté (Legisocial)", url: "https://www.legisocial.fr/actualites-sociales/1351-attestation-de-stage-le-modele-est-fixe-par-un-arrete.html" },
    ],
  },
];
