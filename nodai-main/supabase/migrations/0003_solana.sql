-- NodAI Phase 3 — Solana rewards
-- Run this once in the Supabase SQL Editor, after 0002_inference.sql.
--
-- Phase 3 splits the NOD economy in two:
--   * profiles.nod_balance  — the off-chain credit consumed by inference
--   * the NOD SPL token     — real devnet tokens paid out as rewards
--
-- A reward row is written as 'pending' the moment a run completes, then
-- settled on-chain (and stamped with a signature) when the user claims it.

-- ---------------------------------------------------------------------------
-- One reward and one fee per job, ever
--
-- The claim endpoint and the inference endpoint can both race on the same job,
-- so uniqueness is enforced by the database rather than by application checks.
-- ---------------------------------------------------------------------------
create unique index if not exists transactions_one_entry_per_job_type
  on public.transactions (job_id, type)
  where job_id is not null and type in ('reward', 'fee');

-- Pending-reward lookups drive both the dashboard badge and the claim call.
create index if not exists transactions_pending_rewards_idx
  on public.transactions (user_id, type, status)
  where type = 'reward' and status = 'pending';

create index if not exists transactions_signature_idx
  on public.transactions (signature)
  where signature is not null;

-- ---------------------------------------------------------------------------
-- Records a completed run's reward and the platform fee in one statement.
--
-- Returns the reward row id so the caller can settle it on-chain. Conflicts
-- are swallowed: replaying a job must never mint a second reward.
-- ---------------------------------------------------------------------------
create or replace function public.record_run_rewards(
  p_user_id uuid,
  p_job_id uuid,
  p_reward numeric,
  p_fee numeric
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  reward_id uuid;
begin
  if p_reward <= 0 or p_fee < 0 then
    raise exception 'INVALID_AMOUNT';
  end if;

  insert into public.transactions (user_id, type, amount, status, job_id)
  values (p_user_id, 'reward', p_reward, 'pending', p_job_id)
  on conflict do nothing
  returning id into reward_id;

  if p_fee > 0 then
    insert into public.transactions (user_id, type, amount, status, job_id)
    values (p_user_id, 'fee', p_fee, 'confirmed', p_job_id)
    on conflict do nothing;
  end if;

  return reward_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Marks a batch of pending rewards as settled by a single on-chain transfer.
-- ---------------------------------------------------------------------------
create or replace function public.settle_rewards(
  p_user_id uuid,
  p_ids uuid[],
  p_signature text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  settled integer;
begin
  update public.transactions
     set status = 'confirmed',
         signature = p_signature
   where user_id = p_user_id
     and id = any (p_ids)
     and type = 'reward'
     and status = 'pending';

  get diagnostics settled = row_count;
  return settled;
end;
$$;

-- ---------------------------------------------------------------------------
-- Testing faucet: tops the off-chain credit back up on devnet.
--
-- Refuses to run more than once an hour so a loop cannot farm balance.
-- ---------------------------------------------------------------------------
create or replace function public.grant_test_nod(p_user_id uuid, p_amount numeric)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  new_balance numeric;
  last_grant timestamptz;
begin
  if p_amount <= 0 then
    raise exception 'INVALID_AMOUNT';
  end if;

  select max(created_at) into last_grant
    from public.transactions
   where user_id = p_user_id and type = 'grant';

  if last_grant is not null and last_grant > now() - interval '1 hour' then
    raise exception 'FAUCET_COOLDOWN';
  end if;

  update public.profiles
     set nod_balance = nod_balance + p_amount
   where id = p_user_id
  returning nod_balance into new_balance;

  if new_balance is null then
    raise exception 'PROFILE_NOT_FOUND';
  end if;

  insert into public.transactions (user_id, type, amount, status)
  values (p_user_id, 'grant', p_amount, 'confirmed');

  return new_balance;
end;
$$;

-- Only the service role touches the ledger; clients go through the API.
revoke all on function public.record_run_rewards(uuid, uuid, numeric, numeric)
  from public, anon, authenticated;
revoke all on function public.settle_rewards(uuid, uuid[], text)
  from public, anon, authenticated;
revoke all on function public.grant_test_nod(uuid, numeric)
  from public, anon, authenticated;

grant execute on function public.record_run_rewards(uuid, uuid, numeric, numeric) to service_role;
grant execute on function public.settle_rewards(uuid, uuid[], text) to service_role;
grant execute on function public.grant_test_nod(uuid, numeric) to service_role;
