import { SECTORS } from "@/lib/onboarding/options";

// Secteur d'une offre, deviné sur son texte (24/10, Nathan : « mets tous les
// secteurs possibles » ; sur TikTok, une étudiante éducatrice spécialisée :
// « ça ne marche pas dans mon secteur »). L'ancienne table ne couvrait que
// 41 des 113 secteurs proposés à l'inscription, et ses motifs commençant par
// une lettre accentuée (« Éducation », « Énergie », « Événementiel ») ne
// trouvaient jamais rien (\b de JavaScript ne connaît pas les accents). Un
// profil « Travail social » ou « Coiffure » n'avait donc aucune offre : le
// deck filtre par secteur.
//
// Le texte est mis en minuscules sans accents, puis comparé dans cet ordre :
// intitulé, catégorie de la source (métier ROME chez France Travail), puis
// description. Les secteurs sont testés du plus précis au plus général
// (« vendeur en boulangerie » : Boulangerie avant Vente). `desc: false` :
// mots trop courants dans les descriptions (« mutuelle santé », « nous
// recrutons », « qualités de communication ») pour en tirer un secteur.

type SectorRule = { sector: (typeof SECTORS)[number]; pattern: RegExp; desc: boolean };

const rule = (sector: SectorRule["sector"], pattern: RegExp, desc = true): SectorRule => ({ sector, pattern, desc });

export const SECTOR_RULES: SectorRule[] = [
  // Métiers et filières précis
  rule("Boulangerie et pâtisserie", /\b(boulang\w*|patiss\w*|viennois\w*|chocolati\w*|confiseu\w*)/),
  rule("Boucherie et poissonnerie", /\b(boucher\w*|boucherie|charcut\w*|poissonn\w*)/),
  rule("Sommellerie", /\b(sommelier\w*|sommellerie)\b/),
  rule("Viticulture et œnologie", /\b(viticult\w*|viticole|vinicole|vigne\w*|vignoble\w*|oenolog\w*|caviste|chai)\b/),
  rule("Coiffure", /\b(coiffeu\w*|coiffure|barbier|barber)\b/),
  rule("Beauté et esthétique", /\b(estheticien\w*|esthetique|beaute|cosmeti\w*|prothesiste ongulaire|onglerie|maquill\w*|parfumerie)\b/),
  rule("Yoga et bien-être", /\b(yoga|bien[- ]etre|sophrolog\w*|masseu\w*|spa)\b/),
  rule("Optique", /\b(opticien\w*|lunetier\w*|lunetterie|optique lunetterie|magasin d.optique)\b/),
  rule("Pharmacie", /\b(pharmac\w*|officine|preparateu\w* en pharmacie)\b/),
  rule("Vétérinaire", /\b(veterinair\w*|auxiliaire veterinaire|asv|toilett\w*|animalerie|soigneu\w* animalier)\b/),
  rule("Kinésithérapie", /\b(kine\w*|masseur kinesitherapeute|physiotherap\w*)\b/),
  rule("Nutrition et diététique", /\b(dieteti\w*|nutrition\w*)\b/),
  rule("Psychologie", /\b(psycholog\w*|neuropsycholog\w*)\b/),
  rule("Petite enfance", /\b(petite enfance|creche\w*|puericult\w*|aepe|assistant\w* maternel\w*|atsem|educat\w* de jeunes enfants|multi[- ]accueil)\b/),
  rule("Aide à domicile", /\b(aide a domicile|auxiliaire de vie|aide menager\w*|services? a la personne|aide a la personne)\b/),
  rule("Ambulance et secours", /\b(ambulanc\w*|secouris\w*)\b/),
  rule("Pompiers", /\b(pompier\w*|sapeur\w*)\b/),
  rule("Sécurité incendie", /\b(ssiap|securite incendie)\b/),
  rule("Police et sécurité civile", /\b(police (nationale|municipale)|policier\w*|gendarm\w*|securite civile)\b/),
  rule("Armée et défense", /\b(armee de terre|armee de l.air|militaire\w*|marine nationale|ministere des armees)\b/),
  rule("Sécurité", /\b(agent de securite|agent de surete|surete|securite privee|gardiennage|vigile|security guard|agent cynophile)\b/),
  rule("Douanes", /\b(douane\w*|declarant en douane)\b/),
  rule("Notariat", /\b(notari\w*|notaire\w*|clerc de notaire|office notarial)\b/),
  rule("Travail social", /\b(educat\w* specialis\w*|moniteu\w* educat\w*|assistant\w* de service social|assistant\w* social\w*|travailleu\w* social\w*|cesf|accompagnant\w* educati\w*|protection de l.enfance|protection judiciaire de la jeunesse|pjj|mecs|foyer de l.enfance|aide sociale a l.enfance|intervention socio[- ]?educative)\b/),
  rule("Esport", /\b(e-?sports?)\b/),
  rule("Jeux vidéo", /\b(jeux? video|game design\w*|game dev\w*|gameplay|level design\w*|studio de jeux?)\b/),
  rule("Blockchain et Web3", /\b(blockchain|web3|crypto\w*|nft)\b/),
  rule("Cybersécurité", /\b(cyber\w*|securite informatique|securite des systemes d.information|pentest\w*|infosec|rssi|soc analyst)\b/),
  rule("Intelligence artificielle", /\b(intelligence artificielle|machine learning|deep learning|ai engineer|ml engineer|llm|nlp|computer vision|vision par ordinateur)\b/),
  rule("Statistiques et actuariat", /\b(actuari\w*|statisticien\w*|biostatisti\w*)\b/),
  rule("Bijouterie et joaillerie", /\b(bijout\w*|joaill\w*|orfevr\w*|sertiss\w*)\b/),
  rule("Horlogerie", /\b(horlog\w*)\b/),
  rule("Photographie", /\b(photograph\w*|retouche photo)\b/),
  rule("Cinéma", /\b(cinema\w*|realisateu\w*|realisatrice|post[- ]production|court[- ]metrage|long[- ]metrage)\b/),
  rule("Télévision", /\b(televis\w*|chaine de tele\w*|plateau tv)\b/),
  rule("Radio", /\b(station de radio|animat\w* radio|chroniqu\w* radio|radio locale)\b/),
  rule("Musique", /\b(musi\w*|concert\w*|spectacle vivant|label musical)\b/),
  rule("Bibliothèque et documentation", /\b(bibliothe\w*|documentalist\w*|archivist\w*|archives|mediatheque\w*)\b/),
  rule("Édition et livre", /\b(edition\w*|editeu\w*|editrice\w*|librair\w*|maison d.edition|livres?)\b/, false),
  rule("Traduction et interprétariat", /\b(traduct\w*|traducteu\w*|traductrice\w*|interprete\w*|interpretariat)\b/),
  rule("Diplomatie et international", /\b(diploma\w*|ambassade\w*|consulat\w*|affaires etrangeres|organisation internationale|relations internationales)\b/),
  rule("Humanitaire et ONG", /\b(humanitair\w*|ong|solidarite internationale|aide internationale)\b/),
  rule("Politique", /\b(collaborat\w* parlementaire|assistant\w* parlementaire|attache\w* parlementaire|campagne electorale|affaires publiques|lobbying|cabinet du maire)\b/),
  rule("Administration publique", /\b(mairie\w*|collectivit\w*|administration publique|prefecture\w*|conseil departemental|conseil regional|communaute de communes|communaute d.agglomeration|metropole|hotel de ville|service public)\b/),
  rule("Fonction publique", /\b(fonction publique|fonctionnaire\w*|ministere\w*|agent territorial|adjoint administratif territorial|etablissement public)\b/),
  rule("Restauration collective", /\b(restauration collective|cuisine centrale|cantine\w*|restaurant scolaire|restauration scolaire|restaurant d.entreprise)\b/),
  rule("Décoration et ameublement", /\b(decorat\w*|ameublement|mobilier|cuisiniste|architecte d.interieur|home staging|literie)\b/),
  rule("Urbanisme", /\b(urbanis\w*|amenagement du territoire)\b/),
  rule("Paysagisme", /\b(paysag\w*|espaces? verts?|jardinier\w*|elagu\w*)\b/),
  rule("Horticulture", /\b(horticult\w*|pepinier\w*|fleuriste\w*|floral\w*|maraich\w*|arboricult\w*)\b/),
  rule("Sylviculture et forêt", /\b(sylvicult\w*|forestier\w*|forets?|bucheron\w*|bois et foret)\b/),
  rule("Pêche", /\b(peche|pecheu\w*|aquacult\w*|conchylicult\w*|ostreicult\w*|mareyage)\b/),
  rule("Agroalimentaire", /\b(agroalimentaire|agro[- ]alimentaire|industrie alimentaire|agri[- ]food|ligne de conditionnement alimentaire)\b/),
  rule("Agriculture", /\b(agricol\w*|agricult\w*|exploitation agricole|elevage|eleveu\w*|ouvrier agricole|farming|cerealier\w*|palefrenier\w*|soigneu\w* equin|equitation)\b/),

  // Hôtellerie, restauration, tourisme, loisirs
  rule("Hôtellerie", /\b(hotel\w*|hospitality|receptionniste\w*|night audit\w*|veilleu\w* de nuit|femme de chambre|valet de chambre|gouvernant\w*|concierge\w*|hebergement touristique)\b/),
  rule("Restauration", /\b(restaura\w*|cuisin\w*|commis|chef de partie|serveu\w*|barman|barmaid|barista|plongeu\w*|creperie|pizzaiolo|fast[- ]food|equipier polyvalent|employe\w* polyvalent\w* de restauration)\b/),
  rule("Tourisme", /\b(touris\w*|agence de voyages?|agent de voyages?|conseill\w* voyages?|voyagiste|guide touristique|office de tourisme|camping)\b/),
  rule("Événementiel", /\b(evenementi\w*|events?|organisation d.evenements|wedding planner)\b/),
  rule("Animation", /\b(animateu\w* (periscolaire|de loisirs|jeunesse|socio\w*)|bafa|bpjeps|centre de loisirs|periscolaire|accueil de loisirs)\b/),
  rule("Sport", /\b(sport\w*|coach sporti\w*|educat\w* sporti\w*|staps|fitness|salle de sport|maitre[- ]nageur|moniteu\w* d.equitation)\b/, false),

  // Santé et social
  rule("Biotechnologie", /\b(biotech\w*|bioproduction|bioprocede\w*)\b/),
  rule("Biologie", /\b(biolog\w*|laboratoire d.analyses?|technicien\w* de laboratoire|microbiolog\w*|biochimi\w*)\b/),
  rule("Chimie", /\b(chimi\w*|chemical|chemistry)\b/),
  rule("Recherche scientifique", /\b(recherche scientifique|chercheu\w*|doctorant\w*|these|r&d|recherche et developpement|laboratoire de recherche)\b/),
  rule("Santé", /\b(sante|medic\w*|infirmi\w*|soignant\w*|aide[- ]soignant\w*|paramedic\w*|hopita\w*|clinique\w*|ehpad|radiolog\w*|dentaire|orthophon\w*|ergotherap\w*|sage[- ]femme|manipulat\w* radio|secretaire medical\w*)\b/, false),
  rule("Social et action sociale", /\b(action sociale|medico[- ]social\w*|insertion professionnelle|mediat\w* social\w*|centre social|ccas)\b/),

  // Industrie et technique
  rule("Aéronautique", /\b(aeronauti\w*|aerospatial\w*|aviation|avions?|aeroport\w*|aircraft|helicoptere\w*)\b/),
  rule("Automobile", /\b(automobil\w*|automotive|carrosser\w*|carrossier\w*|garage\w*|concession\w*|mecanicien auto\w*|technicien auto\w*|vehicules? (legers|industriels)|poids lourds?|pneumati\w*|controle technique)\b/),
  rule("Électricité", /\b(electricien\w*|electricite|electrotechni\w*|domotique|installat\w* electri\w*|cablage electrique)\b/),
  rule("Électronique", /\b(electroni\w*|electronics|systemes? embarques?|microelectroni\w*)\b/),
  rule("Plomberie et chauffage", /\b(plomb\w*|chauffag\w*|cvc|climatisat\w*|frigori\w*|genie climatique|thermicien\w*)\b/),
  rule("Menuiserie et ébénisterie", /\b(menuis\w*|ebenist\w*|charpent\w*|agenceu\w*)\b/),
  rule("Mécanique", /\b(mecani\w*|usinage|usineu\w*|fraiseu\w*|tourneu\w*|chaudronn\w*|soudeu\w*|soudure|ajusteu\w*|cnc)\b/),
  rule("Maintenance", /\b(maintenance|maintenicien\w*|electromecani\w*|depannage|depanneu\w*)\b/),
  rule("Réseaux et télécoms", /\b(telecom\w*|fibre optique|technicien\w* reseaux?|administrat\w* reseaux?|ingenieu\w* reseaux?|reseaux et telecom\w*|radiofrequence\w*)\b/),
  rule("Énergie", /\b(energ\w*|renouvelable\w*|photovolta\w*|eolien\w*|nucleai\w*|solaire|hydrogene)\b/, false),
  rule("Développement durable", /\b(developpement durable|rse|sustainab\w*|transition ecologique|environnement\w*|ecolog\w*|bilan carbone|decarbonation|dechets|recyclage|traitement de l.eau|assainissement)\b/, false),
  rule("BTP", /\b(btp|batiment\w*|construction|chantier\w*|travaux publics|genie civil|macon\w*|couvreu\w*|peintre en batiment|plaquiste|carreleu\w*|conducteu\w* de travaux|terrassement|voirie|gros oeuvre|second oeuvre|etancheite|topograph\w*|geometre\w*|economiste de la construction)\b/, false),
  rule("Textile", /\b(textil\w*|couture|couturi\w*|maroquin\w*|tapissi\w*|confection)\b/),
  rule("Luxe", /\b(luxe|luxury|haute couture|maison de luxe)\b/),
  rule("Mode", /\b(fashion|pret[- ]a[- ]porter|stylis\w*|modelis\w*|mode et habillement)\b/),
  rule("Artisanat", /\b(artisan\w*|metiers? d.art|ceramist\w*|potier|souffleu\w* de verre|ferronn\w*)\b/),
  rule("Imprimerie et arts graphiques", /\b(imprim\w*|prepresse|arts graphiques|serigraph\w*|signaleti\w*|reprograph\w*)\b/),
  rule("Industrie", /\b(industri\w*|usine\w*|operat\w* de production|conducteu\w* de ligne|technicien\w* de production|plasturgi\w*|metallurgi\w*|fonderie)\b/, false),

  // Fonctions de l'entreprise et services
  rule("Nettoyage et propreté", /\b(nettoyage|proprete|agent\w* d.entretien|agent\w* de service\w*|laveu\w* de vitres)\b/),
  rule("Logistique et transport", /\b(logisti\w*|transport\w*|supply chain|entrepot\w*|warehouse|chauffeu\w*|magasini\w*|cariste\w*|preparateu\w* de commandes?|livreu\w*|messagerie|fret|affretement|transitaire\w*|approvisionn\w*|gestionnaire de stocks?)\b/, false),
  rule("Import-export", /\b(import[- ]export|commerce international|international trade|assistant\w* export|export)\b/),
  rule("Immobilier", /\b(immobili\w*|real estate|negociat\w* immobili\w*|syndic|gestion locative|property)\b/),
  // « Architecte logiciel / cloud / SI » : Informatique, plus bas.
  rule("Architecture", /\b(architect\w*)\b(?! (logiciel|solution|cloud|si|reseau|data|systeme|it|technique|applicati|d.entreprise))/),
  rule("Qualité", /\b(qualite|quality|qhse|qse|hse|metrolog\w*)\b/, false),
  rule("Banque", /\b(banque\w*|bancaire\w*|banking|conseill\w* (de )?clientele (bancaire|particulier\w*|professionnel\w*))\b/),
  rule("Assurance", /\b(assurances?(?! qualite)|assureu\w*|insurance|mutuelle\w*|sinistres?|courtage)\b/, false),
  rule("Comptabilité", /\b(comptab\w*|accounting|accountant|expert[- ]comptable|dcg|dscg|cabinet comptable)\b/),
  rule("Finance", /\b(finance\w*|financier\w*|financial|tresorer\w*|controle de gestion|controleu\w* de gestion|audit\w*|fiscal\w*|gestion de patrimoine|private equity|asset management|fusions?[- ]acquisitions)\b/, false),
  rule("Juridique et droit", /\b(juridique\w*|juriste\w*|avocat\w*|droit|paralegal|legal|contentieux|huissier\w*|commissaire de justice)\b/, false),
  rule("RH", /\b(rh|ressources humaines|human resources|hr|recrut\w*|talent acquisition|paie|sirh|gpec)\b/, false),
  rule("Achats", /\b(achats?|acheteu\w*|purchas\w*|procurement)\b/, false),
  rule("E-commerce", /\b(e-?commerce|marketplace|site marchand|e-?merchandis\w*)\b/),
  rule("Publicité", /\b(publicit\w*|advertis\w*|media planner|media buyer|regie publicitaire)\b/),
  rule("Communication", /\b(communicat\w*|community manag\w*|social media|reseaux sociaux|relations presse|attache\w* de presse|relations publiques|content manag\w*|charge\w* de contenus?|redact\w* web)\b/, false),
  rule("Journalisme et presse", /\b(journalis\w*|reporter\w*|pigiste\w*|presse ecrite|redaction en chef|secretaire de redaction)\b/),
  rule("Marketing", /\b(marketing|marketeu\w*|growth|seo|sea|acquisition digitale|brand manag\w*|trade marketing|crm|webmarketing|emailing)\b/, false),
  rule("Produit", /\b(product manag\w*|product owner|chef de produits?|product designer)\b/),
  rule("Design", /\b(design\w*|graphis\w*|ux|ui|directeu\w* artistique|infograph\w*|motion design\w*|webdesign\w*|illustrat\w*)\b/),
  rule("Audiovisuel", /\b(audiovisuel\w*|broadcast|videos?|videaste\w*|cadreu\w*|monteu\w* video|ingenieu\w* du son|regisseu\w*)\b/, false),
  rule("Culture", /\b(cultur\w*|musee\w*|patrimoine|mediat\w* culturel\w*|exposition\w*)\b/, false),
  rule("Art", /\b(artist\w*|galerie d.art|marche de l.art|beaux[- ]arts|commissaire d.exposition)\b/),
  rule("Data", /\b(data|donnees|analyst\w*|analytics|business intelligence|power bi|big data|data scien\w*)\b/, false),
  rule("Informatique", /\b(informati\w*|developpeu\w*(?! (commercial|d.affaires|business))|(?<!business )developer|software|logiciel\w*|devops|full ?stack|front[- ]?end|back[- ]?end|web|java|python|php|javascript|react|sql|systemes? d.information|helpdesk|support informatique|administrat\w* systemes?|cloud|it|tech|applications? mobiles?|erp|sap|architecte (logiciel|solutions?|cloud|si))\b/, false),
  rule("Administratif et secrétariat", /\b(secretai\w*|assistant\w* administrati\w*|assistant\w* de direction|assistant\w* de gestion|gestionnaire administrati\w*|agent\w* administrati\w*|employe\w* administrati\w*|office manag\w*|gpme|hote\w* d.accueil|agent\w* d.accueil|standardiste)\b/),
  rule("Service client", /\b(service client\w*|relation client\w*|conseill\w* client\w*|teleconseill\w*|charge\w* de clientele|customer (service|success|care)|centre d.appels?|call center)\b/, false),
  rule("Grande distribution", /\b(grande distribution|hypermarche\w*|supermarche\w*|employe\w* libre[- ]service|employe\w* commerci\w*|hote\w* de caisse|caissi\w*|mise en rayon|chef de rayon|manager de rayon|rayon\w*)\b/),
  rule("Franchise", /\b(franchis\w*)\b/),
  rule("Distribution", /\b(distribution|distributeu\w*|negoce|grossiste\w*)\b/, false),
  rule("Vente", /\b(vente\w*|vendeu\w*|commercia\w*|sales|business develop\w*|technico[- ]commercia\w*|ndrc|negociat\w*|prospect\w*|key account|account manag\w*|charge\w* d.affaires)\b/, false),
  rule("Commerce", /\b(commerce|magasin\w*|boutique\w*|retail|point de vente|mco|responsable de magasin|adjoint\w* de magasin)\b/, false),
  rule("Gestion de projet", /\b(chef de projets?|gestion de projets?|project manag\w*|pmo|charge\w* de projets?|scrum master)\b/),
  rule("Conseil", /\b(conseil|consultant\w*|consulting|cabinet de conseil|advisory)\b/, false),
  rule("Ingénierie", /\b(ingenieu\w*|engineering|engineer|bureau d.etudes?|ingenierie|genie)\b/, false),
  rule("Éducation et formation", /\b(formateu\w*|formatrice\w*|formation professionnelle|ingenierie pedagogique|pedagog\w*|soutien scolaire|educat\w*)\b/, false),
  rule("Enseignement", /\b(enseignant\w*|enseignement|professeu\w*|teacher|instituteu\w*)\b/),
];

export function normalizeForSector(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .toLowerCase()
    // Marques du féminin : « assistant(e) administratif(ve) », « vendeur·se ».
    .replace(/\((?:e|es|ve|ne|se|re|ere|euse|rice|trice)\)/g, "")
    .replace(/·(?:e|es|se|ve|ne|euse|rice|trice)\b/g, "");
}

function firstMatch(text: string, stage: "title" | "desc"): string | null {
  const normalized = normalizeForSector(text);
  for (const r of SECTOR_RULES) {
    if (stage === "desc" && !r.desc) continue;
    if (r.pattern.test(normalized)) return r.sector;
  }
  return null;
}

export function guessSector(categoryLabel: string | null | undefined, title: string, description: string): string | null {
  return (
    firstMatch(title, "title") ??
    (categoryLabel ? firstMatch(categoryLabel, "title") : null) ??
    firstMatch(description, "desc")
  );
}

const KNOWN_SECTORS = new Set<string>(SECTORS);

// Secteurs du profil, ramenés à la liste connue : un secteur saisi à la
// main (« + Autre » à l'inscription, ex. « éducatrice spécialisée ») ne
// correspondait à aucune offre ; on cherche les secteurs qu'il évoque. Les
// secteurs déjà connus restent tels quels. Un seul secteur par saisie, le
// plus précis (même ordre que pour les offres).
export function knownProfileSectors(sectors: string[]): string[] {
  const out = new Set<string>();
  for (const s of sectors) {
    if (KNOWN_SECTORS.has(s)) {
      if (s !== "Autre") out.add(s);
      continue;
    }
    const match = firstMatch(s, "title");
    if (match) out.add(match);
  }
  return [...out];
}
