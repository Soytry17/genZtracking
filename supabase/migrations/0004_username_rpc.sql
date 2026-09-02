-- ============================================================================
-- Re-assert username RPCs with argument name `p_username` and reload the
-- PostgREST schema cache.
--
-- Safe after 0003 (drop + create). Needed when 0003 already ran but signup
-- still reports:
--   Could not find the function public.username_available(p_username)
-- ============================================================================

drop function if exists public.email_for_username(text);
drop function if exists public.username_available(text);

create function public.email_for_username(p_username text)
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

create function public.username_available(p_username text)
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
  'True when no profile currently owns this username (case-insensitive). Argument name is p_username.';

revoke all on function public.email_for_username(text) from public;
revoke all on function public.username_available(text) from public;
grant execute on function public.email_for_username(text) to anon, authenticated;
grant execute on function public.username_available(text) to anon, authenticated;

notify pgrst, 'reload schema';
