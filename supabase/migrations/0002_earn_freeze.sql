-- ============================================================================
-- Earn freeze tokens: 1 per 7 consecutive days, banked up to 3.
--
-- Called from the existing habit_logs streak trigger so earning is correct
-- no matter which client wrote the log. Dedupe key:
--   earned:<habit_id>:<streak_multiple>:<today>
-- so unchecking and rechecking the same day cannot double-award, but a later
-- rebuilt streak can earn again on a different date.
-- ============================================================================

create or replace function public.maybe_earn_freeze(p_habit_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_habit    public.habits;
  v_tokens   integer;
  v_key      text;
  v_inserted integer;
begin
  select h.* into v_habit
  from public.habits h
  where h.id = p_habit_id;

  if not found then
    return;
  end if;

  if v_habit.current_streak <= 0
     or (v_habit.current_streak % 7) <> 0 then
    return;
  end if;

  v_key := 'earned:'
        || p_habit_id::text
        || ':'
        || v_habit.current_streak::text
        || ':'
        || public.app_today()::text;

  select p.freeze_tokens into v_tokens
  from public.profiles p
  where p.id = v_habit.user_id
  for update;

  if coalesce(v_tokens, 0) >= 3 then
    return;
  end if;

  insert into public.freeze_ledger (
    user_id, habit_id, delta, reason, log_date, dedupe_key
  )
  values (
    v_habit.user_id,
    p_habit_id,
    1,
    'earned',
    public.app_today(),
    v_key
  )
  on conflict (user_id, dedupe_key) where dedupe_key is not null
  do nothing;

  get diagnostics v_inserted = row_count;
  if v_inserted = 0 then
    return;
  end if;

  update public.profiles p
  set freeze_tokens = p.freeze_tokens + 1
  where p.id = v_habit.user_id
    and p.freeze_tokens < 3;
end;
$$;

comment on function public.maybe_earn_freeze(uuid) is
  'Awards 1 freeze token when current_streak hits a 7-day multiple, capped at 3. Called by the habit_logs trigger.';

-- Allow reversing XP when a day is unchecked. The table is still not
-- updatable; delete + a compensating insert is how the ledger stays honest.
create policy "xp_events_delete_own" on public.xp_events
  for delete to authenticated using (auth.uid() = user_id);

grant delete on public.xp_events to authenticated;

create or replace function public.habit_logs_recalc_streak()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recalc_habit_streak(old.habit_id);
    perform public.maybe_earn_freeze(old.habit_id);
    return old;
  end if;

  if tg_op = 'UPDATE' and old.habit_id is distinct from new.habit_id then
    perform public.recalc_habit_streak(old.habit_id);
    perform public.maybe_earn_freeze(old.habit_id);
  end if;

  perform public.recalc_habit_streak(new.habit_id);
  perform public.maybe_earn_freeze(new.habit_id);
  return new;
end;
$$;
