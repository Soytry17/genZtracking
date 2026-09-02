-- ============================================================================
-- Unique username on profiles, plus RPCs so the login form can resolve a
-- username to the linked auth email without a service-role key.
--
-- Paste this into the Supabase SQL editor after 0001 and 0002, or:
--   npx supabase db push
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Column + uniqueness
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists username text;

comment on column public.profiles.username is
  'Unique login handle. Case-insensitive uniqueness; format [A-Za-z0-9_]{3,20}.';

alter table public.profiles
  drop constraint if exists profiles_username_format;

alter table public.profiles
  add constraint profiles_username_format
  check (
    username is null
    or username ~ '^[A-Za-z0-9_]{3,20}$'
  );

create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username))
  where username is not null;

-- ---------------------------------------------------------------------------
-- 2. handle_new_user: copy username + display_name from signup metadata
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url, username)
  values (
    new.id,
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
      nullif(btrim(new.raw_user_meta_data ->> 'username'), ''),
      nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
      split_part(new.email, '@', 1)
    ),
    nullif(btrim(new.raw_user_meta_data ->> 'avatar_url'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'username'), '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. RPCs used by the login / signup forms (anon-callable)
-- ---------------------------------------------------------------------------

create or replace function public.email_for_username(p_username text)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_email text;
begin
  if p_username is null or btrim(p_username) = '' then
    return null;
  end if;

  select u.email
    into v_email
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.username is not null
    and lower(p.username) = lower(btrim(p_username))
  limit 1;

  return v_email;
end;
$$;

comment on function public.email_for_username(text) is
  'Resolves a unique username to the linked auth email so the client can call signInWithPassword. Returns null when no match.';

-- Argument name MUST stay `p_username`. PostgREST matches JSON keys to
-- parameter names; a mismatch yields PGRST202 (function not in schema cache).
create or replace function public.username_available(p_username text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (
    select 1
    from public.profiles p
    where p.username is not null
      and lower(p.username) = lower(btrim(p_username))
  );
$$;

comment on function public.username_available(text) is
  'True when no profile currently owns this username (case-insensitive).';

revoke all on function public.email_for_username(text) from public;
revoke all on function public.username_available(text) from public;
grant execute on function public.email_for_username(text) to anon, authenticated;
grant execute on function public.username_available(text) to anon, authenticated;

notify pgrst, 'reload schema';
