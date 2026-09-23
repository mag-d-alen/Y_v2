create table ground_contact_annotations (
  id uuid primary key default gen_random_uuid(),
  asana_variant_id uuid not null references asana_variants (id) on delete cascade,
  point text not null check (point in (
    'crownOfHead', 'forehead', 'backOfHead',
    'palmL', 'palmR', 'fingertipsL', 'fingertipsR', 'forearmL', 'forearmR',
    'shoulderL', 'shoulderR', 'chest',
    'sitBones', 'sacrum', 'outerHipL', 'outerHipR', 'upperBack',
    'kneeL', 'kneeR', 'shinL', 'shinR',
    'heelL', 'heelR', 'ballOfFootL', 'ballOfFootR',
    'outerFootEdgeL', 'outerFootEdgeR', 'topOfFootL', 'topOfFootR',
    'wristL', 'wristR', 'ankleL', 'ankleR', 'bigToeL', 'bigToeR',
    'elbowL', 'elbowR', 'lowerBack', 'belly',
    'backOfHandL', 'backOfHandR', 'backOfNeck', 'thighL', 'thighR'
  )),
  created_at timestamptz not null default now(),
  unique (asana_variant_id, point)
);

create table load_annotations (
  id uuid primary key default gen_random_uuid(),
  asana_variant_id uuid not null references asana_variants (id) on delete cascade,
  point text not null check (point in (
    'crownOfHead', 'forehead', 'backOfHead',
    'palmL', 'palmR', 'fingertipsL', 'fingertipsR', 'forearmL', 'forearmR',
    'shoulderL', 'shoulderR', 'chest',
    'sitBones', 'sacrum', 'outerHipL', 'outerHipR', 'upperBack',
    'kneeL', 'kneeR', 'shinL', 'shinR',
    'heelL', 'heelR', 'ballOfFootL', 'ballOfFootR',
    'outerFootEdgeL', 'outerFootEdgeR', 'topOfFootL', 'topOfFootR',
    'wristL', 'wristR', 'ankleL', 'ankleR', 'bigToeL', 'bigToeR',
    'elbowL', 'elbowR', 'lowerBack', 'belly',
    'backOfHandL', 'backOfHandR', 'backOfNeck', 'thighL', 'thighR'
  )),
  load_fraction double precision not null check (load_fraction >= 0 and load_fraction <= 1),
  created_at timestamptz not null default now(),
  unique (asana_variant_id, point)
);

alter table ground_contact_annotations enable row level security;
alter table load_annotations enable row level security;

create policy "Ground contact annotations are publicly readable" on ground_contact_annotations for select using (true);
create policy "Load annotations are publicly readable" on load_annotations for select using (true);
