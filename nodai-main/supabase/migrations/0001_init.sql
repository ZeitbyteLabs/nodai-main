-- NodAI MVP schema — Phase 1
-- Run this once in the Supabase SQL Editor.

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique not null,
  username text unique,
  wallet_address text unique,
  nod_balance numeric(20, 9) not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- models
-- ---------------------------------------------------------------------------
create table if not exists public.models (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  license text,
  s3_path text,
  vllm_model_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- inference_jobs
-- ---------------------------------------------------------------------------
create table if not exists public.inference_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  model_id uuid references public.models (id) on delete set null,
  prompt text not null,
  response text,
  tokens_used integer,
  latency_ms integer,
  status text not null default 'queued' check (status in ('queued', 'assigned', 'running', 'completed', 'failed')),
  node_id uuid,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists inference_jobs_user_id_created_at_idx
  on public.inference_jobs (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- transactions
-- ---------------------------------------------------------------------------
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('consumption', 'reward', 'fee', 'grant')),
  amount numeric(20, 9) not null,
  signature text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'failed')),
  job_id uuid references public.inference_jobs (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_id_created_at_idx
  on public.transactions (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- nodes
-- ---------------------------------------------------------------------------
create table if not exists public.nodes (
  id uuid primary key default gen_random_uuid(),
  auth_token text unique not null,
  label text,
  status text not null default 'pending' check (status in ('pending', 'online', 'offline')),
  last_heartbeat timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Auto-create a profile whenever an auth user is created
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, username)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.models enable row level security;
alter table public.inference_jobs enable row level security;
alter table public.transactions enable row level security;
alter table public.nodes enable row level security;

-- profiles: a user reads and updates only their own row
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- models: readable by anyone, writable only by the service role
drop policy if exists "models_select_all" on public.models;
create policy "models_select_all" on public.models
  for select using (true);

-- inference_jobs: a user reads and creates only their own jobs
drop policy if exists "inference_jobs_select_own" on public.inference_jobs;
create policy "inference_jobs_select_own" on public.inference_jobs
  for select using (auth.uid() = user_id);

drop policy if exists "inference_jobs_insert_own" on public.inference_jobs;
create policy "inference_jobs_insert_own" on public.inference_jobs
  for insert with check (auth.uid() = user_id);

-- transactions: a user reads only their own; writes happen via the service role
drop policy if exists "transactions_select_own" on public.transactions;
create policy "transactions_select_own" on public.transactions
  for select using (auth.uid() = user_id);

-- nodes: no anon/authenticated access at all (service role bypasses RLS)

-- ---------------------------------------------------------------------------
-- Seed the single MVP model
-- ---------------------------------------------------------------------------
insert into public.models (name, description, license, vllm_model_name)
select
  'Qwen3.8-27B',
  'Compact dense model with native vision-language understanding and a 262,144 token context window.',
  'Apache-2.0',
  'Qwen/Qwen3.8-27B'
where not exists (select 1 from public.models where name = 'Qwen3.8-27B');
