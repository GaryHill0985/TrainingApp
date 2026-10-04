-- Lucas's Training: initial schema.
-- Plan content (seeded from lucas_plan_seed.json, coach-editable) is kept separate from logged data.
-- Every logged table has a client-generated uuid id, user_id, updated_at and a soft-delete flag so
-- phones can write offline and sync later with last-write-wins.

create extension if not exists pgcrypto;

-- ---------- People ----------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role text not null check (role in ('trainee','coach')),
  created_at timestamptz not null default now()
);

create or replace function is_coach() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'coach');
$$;

-- Auto-create a profile when a user is created with role/display_name in their metadata.
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'trainee')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------- Plan (seeded, coach-editable) ----------
-- coach_edited_fields lists columns the coach has changed; the seed import never overwrites those.

create table if not exists plan_settings (
  key text primary key,                -- 'meta' | 'goals' | 'events' | 'theme' | 'positions' | 'week' | 'app'
  value jsonb not null,
  coach_edited boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists workouts (
  id text primary key,
  name text not null,
  subtitle text not null default '',
  demand text not null default '',
  sort_order int not null default 0,
  coach_edited_fields text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists exercises (
  id text primary key,
  name text not null,
  diagram_key text not null default '',
  position text not null,
  position_why text not null default '',
  trains text not null default '',
  find_equipment text not null default '',
  setup jsonb not null default '[]',
  starting_position jsonb not null default '[]',
  how_to_rep jsonb not null default '[]',
  feel_do text not null default '',
  feel_dont text not null default '',
  common_mistakes jsonb not null default '[]',
  stop_set_when jsonb not null default '[]',
  easier_option text not null default '',
  progress_when text not null default '',
  video_search_query text not null default '',
  video_search_url text not null default '',
  video_url text not null default '',
  needs_photo boolean not null default false,
  photo_url text not null default '',
  ask_dad_before_loading boolean not null default false,
  mm_reference text not null default '',   -- coach-set Muscle & Motion name/link
  coach_edited_fields text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists workout_items (
  id text primary key,                 -- '<workout_id>:<order>'
  workout_id text not null references workouts(id) on delete cascade,
  "order" int not null,
  exercise_id text not null references exercises(id),
  sets int not null,
  rep_range text not null,
  rest text not null,
  effort_target text not null,
  warmup_sets numeric not null default 0,
  position text not null,
  coach_edited boolean not null default false,
  deleted boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (workout_id, "order")
);

create table if not exists muscles (
  id text primary key,
  name text not null,
  region text not null default '',
  origin text not null default '',
  insertion text not null default '',
  action text not null default '',
  line_of_pull text not null default '',
  two_joint boolean not null default false,
  note text not null default '',
  coach_edited_fields text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists exercise_muscles (
  exercise_id text not null references exercises(id) on delete cascade,
  muscle_id text not null references muscles(id) on delete cascade,
  role text not null check (role in ('prime','synergist','stabiliser')),
  updated_at timestamptz not null default now(),
  primary key (exercise_id, muscle_id, role)
);

create table if not exists muscle_assets (
  id uuid primary key default gen_random_uuid(),
  muscle_id text references muscles(id) on delete cascade,
  exercise_id text references exercises(id) on delete cascade,
  type text not null check (type in ('svg','model','vectors')),
  url text not null default '',
  ref text not null default '',
  source text not null default '',
  licence text not null default '',
  attribution text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists metric_definitions (
  key text primary key,
  label text not null,
  category text not null default '',
  input_type text not null check (input_type in ('number','hours','scale_1_5','scale_1_10')),
  unit text not null default '',
  min numeric not null default 0,
  max numeric not null default 0,
  step numeric not null default 1,
  active boolean not null default true,
  icon text not null default '',
  who_logs text not null default 'trainee',
  note text not null default '',
  sort_order int not null default 0,
  coach_edited_fields text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists activity_types (
  key text primary key,
  label text not null,
  distance_unit text,
  tracks jsonb not null default '[]',
  icon text not null default '',
  note text not null default '',
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

-- ---------- Logged data (written by the trainee) ----------
create table if not exists sessions (
  id uuid primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  workout_id text not null,
  date date not null,
  status text not null check (status in ('in_progress','complete')),
  started_at timestamptz not null,
  completed_at timestamptz,
  overall_note text not null default '',
  deleted boolean not null default false,
  updated_at timestamptz not null default now()
);
create index if not exists sessions_user_date on sessions(user_id, date desc);

create table if not exists set_logs (
  id uuid primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  session_id uuid not null references sessions(id) on delete cascade,
  exercise_id text not null,
  set_number int not null,
  is_warmup boolean not null default false,
  weight numeric,                       -- null = bodyweight / no weight
  reps_done numeric,                    -- reps, seconds, metres or minutes depending on the item's log type
  value_kind text not null default 'reps' check (value_kind in ('reps','seconds','metres','minutes')),
  side text,                            -- 'left' | 'right' | null for per-side items
  logged_at timestamptz not null,
  deleted boolean not null default false,
  updated_at timestamptz not null default now()
);
create index if not exists set_logs_session on set_logs(session_id);
create index if not exists set_logs_user_exercise on set_logs(user_id, exercise_id, logged_at);

create table if not exists exercise_logs (
  id uuid primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  session_id uuid not null references sessions(id) on delete cascade,
  exercise_id text not null,
  technique_colour text check (technique_colour in ('green','amber','red')),
  pain_flag boolean not null default false,
  note text not null default '',
  back_extension_weight_flag boolean not null default false,   -- weight entered on the gated exercise
  deleted boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (session_id, exercise_id)
);

create table if not exists metric_logs (
  id uuid primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  date date not null,
  metric_key text not null,
  value_num numeric,
  value_text text,
  note text not null default '',
  logged_at timestamptz not null,
  deleted boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (user_id, date, metric_key)
);

create table if not exists activity_entries (
  id uuid primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  date date not null,
  activity_type text not null,
  distance_value numeric,
  distance_unit text,
  duration_seconds int,
  note text not null default '',
  logged_at timestamptz not null,
  deleted boolean not null default false,
  updated_at timestamptz not null default now()
);
create index if not exists activity_entries_user_date on activity_entries(user_id, date desc);

create table if not exists food_entries (
  id uuid primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  date date not null,
  meal text,
  description text not null default '',
  calories numeric,
  time text,
  logged_at timestamptz not null,
  deleted boolean not null default false,
  updated_at timestamptz not null default now()
);
create index if not exists food_entries_user_date on food_entries(user_id, date desc);

create table if not exists milestone_progress (
  id uuid primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  milestone_key text not null,
  stage_index int not null,
  achieved_on date not null,
  note text not null default '',
  deleted boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (user_id, milestone_key, stage_index)
);

-- ---------- Row-Level Security ----------
alter table profiles enable row level security;
alter table plan_settings enable row level security;
alter table workouts enable row level security;
alter table exercises enable row level security;
alter table workout_items enable row level security;
alter table muscles enable row level security;
alter table exercise_muscles enable row level security;
alter table muscle_assets enable row level security;
alter table metric_definitions enable row level security;
alter table activity_types enable row level security;
alter table sessions enable row level security;
alter table set_logs enable row level security;
alter table exercise_logs enable row level security;
alter table metric_logs enable row level security;
alter table activity_entries enable row level security;
alter table food_entries enable row level security;
alter table milestone_progress enable row level security;

-- profiles: everyone signed in can see names/roles; only you can edit yours.
drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles for select to authenticated using (true);
drop policy if exists profiles_update on profiles;
create policy profiles_update on profiles for update to authenticated using (id = auth.uid());

-- plan tables: readable by both; writable by the coach only.
do $$
declare t text;
begin
  foreach t in array array['plan_settings','workouts','exercises','workout_items','muscles','exercise_muscles','muscle_assets','metric_definitions','activity_types']
  loop
    execute format('drop policy if exists %I_select on %I', t, t);
    execute format('create policy %I_select on %I for select to authenticated using (true)', t, t);
    execute format('drop policy if exists %I_coach_write on %I', t, t);
    execute format('create policy %I_coach_write on %I for all to authenticated using (is_coach()) with check (is_coach())', t, t);
  end loop;
end $$;

-- logged tables: the owner can read/write their own rows; the coach can read everything.
do $$
declare t text;
begin
  foreach t in array array['sessions','set_logs','exercise_logs','metric_logs','activity_entries','food_entries','milestone_progress']
  loop
    execute format('drop policy if exists %I_select on %I', t, t);
    execute format('create policy %I_select on %I for select to authenticated using (user_id = auth.uid() or is_coach())', t, t);
    execute format('drop policy if exists %I_insert on %I', t, t);
    execute format('create policy %I_insert on %I for insert to authenticated with check (user_id = auth.uid())', t, t);
    execute format('drop policy if exists %I_update on %I', t, t);
    execute format('create policy %I_update on %I for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t, t);
  end loop;
end $$;

-- ---------- Realtime ----------
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;
do $$
declare t text;
begin
  foreach t in array array['sessions','set_logs','exercise_logs','metric_logs','activity_entries','food_entries','milestone_progress','exercises','workouts','workout_items','plan_settings','metric_definitions','muscles']
  loop
    if not exists (
      select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table %I', t);
    end if;
  end loop;
end $$;

-- ---------- Storage ----------
-- One public-read bucket for machine photos, demo videos and the coach's inspiration images.
-- Paths are random uuids so they are not guessable; only the coach can upload or delete.
insert into storage.buckets (id, name, public, file_size_limit)
values ('media', 'media', true, 104857600)
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit;

drop policy if exists media_public_read on storage.objects;
create policy media_public_read on storage.objects for select using (bucket_id = 'media');
drop policy if exists media_coach_insert on storage.objects;
create policy media_coach_insert on storage.objects for insert to authenticated with check (bucket_id = 'media' and is_coach());
drop policy if exists media_coach_update on storage.objects;
create policy media_coach_update on storage.objects for update to authenticated using (bucket_id = 'media' and is_coach());
drop policy if exists media_coach_delete on storage.objects;
create policy media_coach_delete on storage.objects for delete to authenticated using (bucket_id = 'media' and is_coach());
