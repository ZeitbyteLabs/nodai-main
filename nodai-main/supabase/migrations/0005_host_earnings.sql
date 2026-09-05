-- NodAI — host earnings and API keys
-- Run once in the Supabase SQL Editor, after 0004_nodes.sql.
--
-- Nodes belong to an account. Completing a job pays the HOST, not the
-- person who ran the prompt. Hosts identify themselves with an API key
-- created on the dashboard.

-- ---------------------------------------------------------------------------
-- API keys (hashed; the full key is shown once in the app)
-- ---------------------------------------------------------------------------
create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null default 'GPU host',
  key_hash text unique not null,
  key_prefix text not null,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists api_keys_user_id_idx
  on public.api_keys (user_id, created_at desc);

alter table public.api_keys enable row level security;

drop policy if exists "api_keys_select_own" on public.api_keys;
create policy "api_keys_select_own" on public.api_keys
  for select using (auth.uid() = user_id);

-- Writes go through the service role so the hash never leaves the server.

-- ---------------------------------------------------------------------------
-- Nodes belong to a host account and report the model they serve
-- ---------------------------------------------------------------------------
alter table public.nodes
  add column if not exists owner_id uuid references public.profiles (id) on delete set null;

alter table public.nodes
  add column if not exists api_key_id uuid references public.api_keys (id) on delete set null;

alter table public.nodes
  add column if not exists served_model text;

create index if not exists nodes_owner_id_idx
  on public.nodes (owner_id)
  where owner_id is not null;

drop policy if exists "nodes_select_own" on public.nodes;
create policy "nodes_select_own" on public.nodes
  for select using (auth.uid() = owner_id);
