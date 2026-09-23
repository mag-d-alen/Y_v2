create table drishti_annotations (
  id uuid primary key default gen_random_uuid(),
  asana_variant_id uuid not null unique references asana_variants (id) on delete cascade,
  point text not null check (point in (
    'noseTip', 'thirdEye', 'navel', 'hand', 'toes',
    'farRight', 'farLeft', 'thumbs', 'upward'
  )),
  created_at timestamptz not null default now()
);

alter table drishti_annotations enable row level security;

create policy "Drishti annotations are publicly readable" on drishti_annotations for select using (true);
