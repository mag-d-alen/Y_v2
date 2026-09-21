alter table postures rename to asanas;
alter table posture_variants rename to asana_variants;
alter table asana_variants rename column posture_id to asana_id;
alter table pose_data rename column posture_variant_id to asana_variant_id;
alter table muscle_annotations rename column posture_variant_id to asana_variant_id;

alter table asana_variants drop column difficulty_tier cascade;

alter table asana_variants add column ashtanga_series smallint check (ashtanga_series between 1 and 6);
alter table asana_variants add column label text not null check (label = 'standard' or label ~ '^[a-z]$');

alter table asana_variants add unique (asana_id, tradition, label);

create policy "Asanas are publicly readable" on asanas for select using (true);
create policy "Asana variants are publicly readable" on asana_variants for select using (true);
create policy "Pose data is publicly readable" on pose_data for select using (true);
create policy "Muscle annotations are publicly readable" on muscle_annotations for select using (true);
