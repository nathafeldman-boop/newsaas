-- CDI et CDD (07/11) : offres d'emploi ouvertes aux débutants, importées de
-- France Travail (voir src/lib/franceTravail/emploisSync.ts).
alter type contract_type add value if not exists 'cdd';
alter type contract_type add value if not exists 'cdi';
