create table if not exists public.contact_messages (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 2 and 80),
  email text not null check (char_length(email) <= 254),
  message text not null check (char_length(message) between 15 and 2000),
  ip_hash text not null
);

create index if not exists contact_messages_created_at_idx
  on public.contact_messages (created_at desc);

alter table public.contact_messages enable row level security;
revoke all on table public.contact_messages from anon, authenticated;

create table if not exists public.contact_rate_limits (
  ip_hash text primary key,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 1 check (request_count > 0)
);

alter table public.contact_rate_limits enable row level security;
revoke all on table public.contact_rate_limits from anon, authenticated;

create or replace function public.check_contact_rate_limit(p_ip_hash text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_window timestamptz;
  current_count integer;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_ip_hash, 0));
  delete from public.contact_rate_limits
    where window_started_at < now() - interval '1 day';

  select window_started_at, request_count
    into current_window, current_count
    from public.contact_rate_limits
    where ip_hash = p_ip_hash
    for update;

  if not found then
    insert into public.contact_rate_limits (ip_hash) values (p_ip_hash);
    return true;
  end if;

  if current_window < now() - interval '15 minutes' then
    update public.contact_rate_limits
      set window_started_at = now(), request_count = 1
      where ip_hash = p_ip_hash;
    return true;
  end if;

  update public.contact_rate_limits
    set request_count = request_count + 1
    where ip_hash = p_ip_hash;

  return current_count < 5;
end;
$$;

revoke all on function public.check_contact_rate_limit(text) from public, anon, authenticated;
grant execute on function public.check_contact_rate_limit(text) to service_role;
