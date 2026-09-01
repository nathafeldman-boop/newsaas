-- Offres de démonstration (source = 'demo') pour tester le swipe avant le branchement
-- de l'ingestion Mistral. À désactiver/supprimer en prod si besoin :
--   update public.offers set is_active = false where source = 'demo';

insert into public.offers
  (title, company, location, contract_type, sector, description, requirements, duration, salary, remote_policy, apply_url, source, external_id)
values
  ('Alternant Développeur Web Full-Stack', 'Numeria', 'Paris', 'alternance', 'Informatique',
   'Rejoins une équipe produit pour construire des features front (React) et back (Node) sur une plateforme SaaS en croissance.',
   'BUT/BTS info ou équivalent, bases en JavaScript, envie d''apprendre vite.', '12-24 mois', '900-1400€/mois', 'hybride',
   'https://example.com/offres/dev-fullstack', 'demo', 'demo-001'),

  ('Alternant Growth Marketing', 'Cabri Studio', 'Lyon', 'alternance', 'Marketing',
   'Pilotage de campagnes d''acquisition (Meta Ads, SEO), analyse de perf, veille concurrentielle.',
   'Formation marketing/communication, appétence pour la data.', '12 mois', '850-1100€/mois', 'sur site',
   'https://example.com/offres/growth-marketing', 'demo', 'demo-002'),

  ('Stage Assistant Chef de Projet', 'Buildway', 'Bordeaux', 'stage', 'BTP',
   'Suivi de chantier, coordination avec les sous-traitants, reporting client.',
   'École d''ingénieur ou BTP, permis B apprécié.', '6 mois', '700-900€/mois', 'sur site',
   'https://example.com/offres/chef-de-projet-btp', 'demo', 'demo-003'),

  ('Alternant Data Analyst', 'Fluxio', 'Nantes', 'alternance', 'Data',
   'Construction de dashboards, requêtes SQL, automatisation de reportings pour les équipes business.',
   'Master 1/2 data ou stats, SQL, Python de base.', '24 mois', '1000-1300€/mois', 'hybride',
   'https://example.com/offres/data-analyst', 'demo', 'demo-004'),

  ('Stage Marketing Digital', 'Halo Cosmetics', 'Marseille', 'stage', 'Marketing',
   'Gestion des réseaux sociaux, création de contenus, animation communauté.',
   'Formation communication/marketing, à l''aise avec Canva/CapCut.', '4-6 mois', '600-800€/mois', 'sur site',
   'https://example.com/offres/marketing-digital', 'demo', 'demo-005'),

  ('Alternant Commercial B2B', 'Vento Solutions', 'Lille', 'alternance', 'Vente',
   'Prospection, qualification de leads, participation aux rendez-vous clients avec les Account Executives.',
   'BTS NDRC/MUC ou équivalent, aisance relationnelle.', '12 mois', '900-1200€/mois', 'sur site',
   'https://example.com/offres/commercial-b2b', 'demo', 'demo-006'),

  ('Alternant UX/UI Designer', 'Studio Kaya', 'Paris', 'alternance', 'Design',
   'Conception de wireframes et maquettes, tests utilisateurs, montée en compétence sur un design system.',
   'Formation design, portfolio Figma souhaité.', '12-24 mois', '950-1300€/mois', 'hybride',
   'https://example.com/offres/ux-ui-designer', 'demo', 'demo-007'),

  ('Stage RH Recrutement', 'Talenzo', 'Toulouse', 'stage', 'RH',
   'Sourcing candidats, préqualification téléphonique, participation aux entretiens.',
   'Formation RH/psychologie, bon relationnel.', '6 mois', '650-850€/mois', 'sur site',
   'https://example.com/offres/rh-recrutement', 'demo', 'demo-008'),

  ('Alternant Ingénieur DevOps', 'Cloudra', 'Toulouse', 'alternance', 'Informatique',
   'Mise en place de pipelines CI/CD, supervision d''infra cloud (AWS), amélioration de la fiabilité.',
   'École d''ingénieur, bases Linux/Docker.', '24 mois', '1100-1500€/mois', 'remote',
   'https://example.com/offres/devops', 'demo', 'demo-009'),

  ('Stage Comptabilité / Finance', 'Ledger & Co', 'Strasbourg', 'stage', 'Finance',
   'Saisie comptable, rapprochements bancaires, support à la clôture mensuelle.',
   'BTS CG ou DCG en cours.', '3-6 mois', '600-750€/mois', 'sur site',
   'https://example.com/offres/comptabilite', 'demo', 'demo-010'),

  ('Alternant Product Manager Junior', 'Nestwork', 'Paris', 'alternance', 'Produit',
   'Rédaction de specs, priorisation backlog, coordination avec dev et design sur un produit B2B.',
   'Master école de commerce/ingé, appétence produit.', '12-24 mois', '1000-1400€/mois', 'hybride',
   'https://example.com/offres/product-manager', 'demo', 'demo-011'),

  ('Stage Community Management', 'Orbite Media', 'Rennes', 'stage', 'Marketing',
   'Animation des réseaux sociaux d''une marque grand public, création de contenus courts.',
   'Formation com/marketing, culture réseaux sociaux.', '4-6 mois', '600-750€/mois', 'sur site',
   'https://example.com/offres/community-management', 'demo', 'demo-012');
