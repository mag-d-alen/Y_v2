create extension if not exists pgcrypto;

create table postures (
  id uuid primary key default gen_random_uuid(),
  sanskrit_name text not null unique,
  created_at timestamptz not null default now()
);

create table posture_variants (
  id uuid primary key default gen_random_uuid(),
  posture_id uuid not null references postures (id) on delete cascade,
  tradition text not null,
  difficulty_tier text not null,
  created_at timestamptz not null default now(),
  unique (posture_id, tradition, difficulty_tier)
);

create table pose_data (
  id uuid primary key default gen_random_uuid(),
  posture_variant_id uuid not null unique references posture_variants (id) on delete cascade,
  bones jsonb not null,
  created_at timestamptz not null default now()
);

create table muscle_annotations (
  id uuid primary key default gen_random_uuid(),
  posture_variant_id uuid not null references posture_variants (id) on delete cascade,
  muscle_id text not null,
  state text not null check (state in ('working', 'lengthening', 'shortened', 'neutral')),
  role_description text not null,
  created_at timestamptz not null default now(),
  unique (posture_variant_id, muscle_id)
);

alter table postures enable row level security;
alter table posture_variants enable row level security;
alter table pose_data enable row level security;
alter table muscle_annotations enable row level security;
