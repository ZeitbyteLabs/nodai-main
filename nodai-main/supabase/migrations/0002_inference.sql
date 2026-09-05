-- NodAI Phase 2 — inference cost tracking
-- Run this once in the Supabase SQL Editor, after 0001_init.sql.

-- ---------------------------------------------------------------------------
-- Atomic NOD ledger helpers
--
-- The balance lives on profiles.nod_balance. Both helpers run as the table
-- owner so the API can move balance without granting write access to clients.
-- ---------------------------------------------------------------------------

-- Deducts p_amount only if the balance covers it. Raises when it does not, so
-- a concurrent double-spend can never drive the balance negative.
create or replace function public.debit_nod(p_user_id uuid, p_amount numeric)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  new_balance numeric;
begin
  if p_amount <= 0 then
    raise exception 'INVALID_AMOUNT';
  end if;

  update public.profiles
     set nod_balance = nod_balance - p_amount
   where id = p_user_id
     and nod_balance >= p_amount
  returning nod_balance into new_balance;

  if new_balance is null then
    raise exception 'INSUFFICIENT_NOD_BALANCE';
  end if;

  return new_balance;
end;
$$;

create or replace function public.credit_nod(p_user_id uuid, p_amount numeric)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  new_balance numeric;
begin
  if p_amount <= 0 then
    raise exception 'INVALID_AMOUNT';
  end if;

  update public.profiles
     set nod_balance = nod_balance + p_amount
   where id = p_user_id
  returning nod_balance into new_balance;

  if new_balance is null then
    raise exception 'PROFILE_NOT_FOUND';
  end if;

  return new_balance;
end;
$$;

-- Only the service role calls these; clients must go through /api/inference.
-- Postgres grants EXECUTE to PUBLIC on new functions, so revoke that first and
-- then hand execute back to service_role explicitly.
revoke all on function public.debit_nod(uuid, numeric) from public, anon, authenticated;
revoke all on function public.credit_nod(uuid, numeric) from public, anon, authenticated;

grant execute on function public.debit_nod(uuid, numeric) to service_role;
grant execute on function public.credit_nod(uuid, numeric) to service_role;

-- ---------------------------------------------------------------------------
-- Starter grant
--
-- Phase 2 charges 0.01 NOD per run against an off-chain balance. New accounts
-- receive 1.000 NOD so a first-time user can actually run inference. Phase 3
-- replaces this with a devnet mint.
-- ---------------------------------------------------------------------------
alter table public.profiles alter column nod_balance set default 1.0;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, username, nod_balance)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    1.0
  )
  on conflict (id) do nothing;

  insert into public.transactions (user_id, type, amount, status)
  values (new.id, 'grant', 1.0, 'confirmed');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill accounts created before the grant existed.
with granted as (
  update public.profiles
     set nod_balance = 1.0
   where nod_balance = 0
     and not exists (
       select 1 from public.transactions t
        where t.user_id = profiles.id and t.type = 'grant'
     )
  returning id
)
insert into public.transactions (user_id, type, amount, status)
select id, 'grant', 1.0, 'confirmed' from granted;

-- ---------------------------------------------------------------------------
-- Record where the model artifacts live in S3
-- ---------------------------------------------------------------------------
update public.models
   set s3_path = coalesce(s3_path, 's3://nodai-models/Qwen3.8-27B/')
 where vllm_model_name = 'Qwen/Qwen3.8-27B';
