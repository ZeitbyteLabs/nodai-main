-- NodAI Phase 4 — GPU node registration, heartbeat, and job queue
-- Run once in the Supabase SQL Editor, after 0003_solana.sql.

-- ---------------------------------------------------------------------------
-- Job execution params (nodes need these to call vLLM)
-- ---------------------------------------------------------------------------
alter table public.inference_jobs
  add column if not exists temperature numeric(4, 2) not null default 0.7,
  add column if not exists max_tokens integer not null default 512;

alter table public.inference_jobs
  drop constraint if exists inference_jobs_node_id_fkey;

alter table public.inference_jobs
  add constraint inference_jobs_node_id_fkey
  foreign key (node_id) references public.nodes (id) on delete set null;

create index if not exists inference_jobs_queue_idx
  on public.inference_jobs (status, created_at)
  where status = 'queued';

create index if not exists nodes_status_heartbeat_idx
  on public.nodes (status, last_heartbeat desc);

-- ---------------------------------------------------------------------------
-- Marks nodes offline when they have not heartbeated within p_seconds.
-- ---------------------------------------------------------------------------
create or replace function public.mark_stale_nodes_offline(p_seconds integer default 60)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  updated integer;
begin
  update public.nodes
     set status = 'offline'
   where status = 'online'
     and (
       last_heartbeat is null
       or last_heartbeat < now() - make_interval(secs => p_seconds)
     );

  get diagnostics updated = row_count;
  return updated;
end;
$$;

-- ---------------------------------------------------------------------------
-- Pull model: atomically assigns the oldest queued job to an online node.
-- ---------------------------------------------------------------------------
create or replace function public.claim_next_job(p_node_id uuid)
returns table (
  job_id uuid,
  user_id uuid,
  model_id uuid,
  prompt text,
  temperature numeric,
  max_tokens integer,
  vllm_model_name text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed uuid;
begin
  perform public.mark_stale_nodes_offline(60);

  if not exists (
    select 1 from public.nodes n
     where n.id = p_node_id and n.status in ('pending', 'online')
  ) then
    return;
  end if;

  select j.id into claimed
    from public.inference_jobs j
   where j.status = 'queued'
   order by j.created_at asc
   limit 1
   for update skip locked;

  if claimed is null then
    return;
  end if;

  update public.inference_jobs
     set status = 'running',
         node_id = p_node_id
   where id = claimed;

  return query
  select
    j.id,
    j.user_id,
    j.model_id,
    j.prompt,
    j.temperature,
    j.max_tokens,
    m.vllm_model_name
  from public.inference_jobs j
  left join public.models m on m.id = j.model_id
  where j.id = claimed;
end;
$$;

-- ---------------------------------------------------------------------------
-- Node submits a finished job back to the platform.
-- ---------------------------------------------------------------------------
create or replace function public.complete_node_job(
  p_node_id uuid,
  p_job_id uuid,
  p_response text,
  p_tokens_used integer,
  p_latency_ms integer,
  p_status text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  job_user uuid;
begin
  if p_status not in ('completed', 'failed') then
    raise exception 'INVALID_STATUS';
  end if;

  update public.inference_jobs
     set response = nullif(p_response, ''),
         tokens_used = p_tokens_used,
         latency_ms = p_latency_ms,
         status = p_status,
         completed_at = now()
   where id = p_job_id
     and node_id = p_node_id
     and status = 'running'
  returning user_id into job_user;

  if job_user is null then
    raise exception 'JOB_NOT_FOUND';
  end if;

  return job_user;
end;
$$;

revoke all on function public.mark_stale_nodes_offline(integer)
  from public, anon, authenticated;
revoke all on function public.claim_next_job(uuid)
  from public, anon, authenticated;
revoke all on function public.complete_node_job(uuid, uuid, text, integer, integer, text)
  from public, anon, authenticated;

grant execute on function public.mark_stale_nodes_offline(integer) to service_role;
grant execute on function public.claim_next_job(uuid) to service_role;
grant execute on function public.complete_node_job(uuid, uuid, text, integer, integer, text) to service_role;
