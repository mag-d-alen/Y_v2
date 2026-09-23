create table rotation_annotations (
  id uuid primary key default gen_random_uuid(),
  asana_variant_id uuid not null references asana_variants (id) on delete cascade,
  bone text not null check (bone in ('thighL', 'thighR', 'upperArmL', 'upperArmR', 'upperBack')),
  direction text not null check (direction in ('internal', 'external', 'left', 'right')),
  created_at timestamptz not null default now(),
  unique (asana_variant_id, bone)
);

alter table rotation_annotations enable row level security;

create policy "Rotation annotations are publicly readable" on rotation_annotations for select using (true);
