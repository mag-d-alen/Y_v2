create table body_contact_annotations (
  id uuid primary key default gen_random_uuid(),
  asana_variant_id uuid not null references asana_variants (id) on delete cascade,
  point_a text not null check (point_a in (
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
  point_b text not null check (point_b in (
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
  contact_type text not null check (contact_type in ('grasp', 'touch', 'hook', 'press')),
  created_at timestamptz not null default now(),
  unique (asana_variant_id, point_a, point_b)
);

alter table body_contact_annotations enable row level security;

create policy "Body contact annotations are publicly readable" on body_contact_annotations for select using (true);
