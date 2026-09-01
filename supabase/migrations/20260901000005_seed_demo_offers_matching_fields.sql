-- Backfill start_date / education_level sur les offres de démo, pour tester
-- le nouvel affichage de la carte (📅 🎓).

update public.offers set start_date = '2026-09-01', education_level = 'Bac+3' where source = 'demo' and external_id = 'demo-001';
update public.offers set start_date = '2026-09-01', education_level = 'Bac+3' where source = 'demo' and external_id = 'demo-002';
update public.offers set start_date = '2026-08-24', education_level = 'Bac+2' where source = 'demo' and external_id = 'demo-003';
update public.offers set start_date = '2026-09-15', education_level = 'Bac+4' where source = 'demo' and external_id = 'demo-004';
update public.offers set start_date = '2026-09-01', education_level = 'Bac+2' where source = 'demo' and external_id = 'demo-005';
update public.offers set start_date = '2026-09-01', education_level = 'Bac+2' where source = 'demo' and external_id = 'demo-006';
update public.offers set start_date = '2026-09-01', education_level = 'Bac+3' where source = 'demo' and external_id = 'demo-007';
update public.offers set start_date = '2026-09-08', education_level = 'Bac+3' where source = 'demo' and external_id = 'demo-008';
update public.offers set start_date = '2026-09-15', education_level = 'Bac+5' where source = 'demo' and external_id = 'demo-009';
update public.offers set start_date = '2026-09-01', education_level = 'Bac+2' where source = 'demo' and external_id = 'demo-010';
update public.offers set start_date = '2026-09-15', education_level = 'Bac+4' where source = 'demo' and external_id = 'demo-011';
update public.offers set start_date = '2026-09-01', education_level = 'Bac+2' where source = 'demo' and external_id = 'demo-012';
