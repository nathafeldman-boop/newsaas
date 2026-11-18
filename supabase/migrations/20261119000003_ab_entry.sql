-- Test A/B d'entrée (18/11, Nathan : « la moitié sur la LP, l'autre moitié
-- directement sur l'inscription, 7 jours, puis garder ce qui rapporte le
-- plus ») : groupe de chaque inscrit, recopié depuis le cookie ab_entry.
alter table public.profiles add column if not exists ab_entry text;
