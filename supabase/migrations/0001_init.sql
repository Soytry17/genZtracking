-- ============================================================================
-- genZtracking — initial schema
--
-- Contents
--   1. Extensions + shared helpers
--   2. Enums and composite types
--   3. Tables
--   4. Indexes
--   5. updated_at triggers
--   6. Streak recalculation (recalc_habit_streak + habit_logs trigger)
--   7. spend_freeze RPC
--   8. handle_new_user trigger
--   9. Row level security policies
--  10. Seed data (badges, habit_presets)
--
-- Every user-owned table is gated by `auth.uid() = user_id`. Reference tables
-- (badges, habit_presets) are world-readable and have no writer policy, so they
-- can only be changed by a migration or the service role.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- 1. Shared helpers
-- ---------------------------------------------------------------------------

-- The whole app resolves "today" in one fixed timezone so a late-night check-in
-- can never land on the wrong calendar day. This MUST stay in sync with
-- APP_TIME_ZONE in lib/habits/dates.ts.
create or replace function public.app_time_zone()
returns text
language sql
immutable
set search_path = ''
as $$
  select 'Asia/Phnom_Penh'::text;
$$;

create or replace function public.app_today()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone public.app_time_zone())::date;
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Enums and composite types
-- ---------------------------------------------------------------------------

create type public.habit_status as enum ('active', 'paused', 'completed', 'archived');

create type public.habit_log_status as enum ('done', 'skipped', 'frozen');

create type public.xp_event_kind as enum (
  'day_completed',
  'streak_bonus',
  'badge_unlocked',
  'habit_created',
  'habit_completed',
  'adjustment'
);

create type public.freeze_reason as enum ('earned', 'spent', 'expired', 'adjustment');

create type public.badge_kind as enum (
  'streak',
  'first_habit',
  'habit_completed',
  'comeback',
  'level'
);

-- Return shape of the spend_freeze RPC.
create type public.spend_freeze_result as (
  habit_id uuid,
  log_date date,
  freeze_tokens_remaining integer,
  current_streak integer,
  longest_streak integer
);

-- ---------------------------------------------------------------------------
-- 3. Tables
-- ---------------------------------------------------------------------------

-- Mirrors auth.users. Created automatically by handle_new_user().
create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  display_name  text,
  avatar_url    text,
  xp            integer not null default 0 check (xp >= 0),
  level         integer not null default 1 check (level >= 1),
  freeze_tokens integer not null default 0
                check (freeze_tokens >= 0 and freeze_tokens <= 3),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.profiles is 'Per-user profile mirroring auth.users, plus gamification totals.';
comment on column public.profiles.freeze_tokens is 'Banked streak freezes, capped at 3 by check constraint.';

create table public.habits (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles (id) on delete cascade,
  title          text not null check (char_length(btrim(title)) between 1 and 120),
  description    text check (char_length(description) <= 2000),
  -- Total commitment length. Optional: the client may set the date range directly.
  duration_days  integer check (duration_days is null or duration_days between 1 and 3650),
  start_date     date not null,
  end_date       date not null,
  color          text not null default 'violet',
  icon           text not null default 'sparkles',
  status         public.habit_status not null default 'active',
  -- Denormalized, written only by recalc_habit_streak().
  current_streak integer not null default 0 check (current_streak >= 0),
  longest_streak integer not null default 0 check (longest_streak >= 0),
  completed_at   timestamptz,
  archived_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint habits_date_range_valid check (end_date >= start_date)
);

comment on table public.habits is 'One habit per row. The day grid is derived from start_date..end_date at read time; no row per day.';

-- One row per marked day. Days with no row are simply "not logged yet".
create table public.habit_logs (
  id         uuid primary key default gen_random_uuid(),
  habit_id   uuid not null references public.habits (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  log_date   date not null,
  status     public.habit_log_status not null default 'done',
  note       text check (char_length(note) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint habit_logs_habit_date_key unique (habit_id, log_date)
);

comment on table public.habit_logs is 'One row per marked day. user_id is filled in automatically from the parent habit.';

-- Append-only XP ledger, so totals stay auditable and an unchecked day can be reversed.
create table public.xp_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  habit_id    uuid references public.habits (id) on delete set null,
  kind        public.xp_event_kind not null,
  amount      integer not null,
  log_date    date,
  -- Stable key for idempotent awards, e.g. 'day:<habit_id>:2026-03-04'.
  dedupe_key  text,
  meta        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

comment on column public.xp_events.dedupe_key is 'Optional idempotency key, unique per user. Use it so replays cannot double-award XP.';

-- Append-only freeze ledger. profiles.freeze_tokens is the running balance.
create table public.freeze_ledger (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  habit_id   uuid references public.habits (id) on delete set null,
  delta      integer not null check (delta <> 0),
  reason     public.freeze_reason not null,
  log_date   date,
  dedupe_key text,
  meta       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on column public.freeze_ledger.delta is 'Positive when earned, negative when spent.';

-- Static reference data.
create table public.badges (
  id          text primary key,
  name        text not null,
  description text not null,
  icon        text not null,
  kind        public.badge_kind not null,
  threshold   integer,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create table public.user_badges (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references public.profiles (id) on delete cascade,
  badge_id  text not null references public.badges (id) on delete cascade,
  habit_id  uuid references public.habits (id) on delete set null,
  earned_at timestamptz not null default now(),
  constraint user_badges_user_badge_key unique (user_id, badge_id)
);

-- Static reference data powering the "start from a template" library.
create table public.habit_presets (
  id                       text primary key,
  title                    text not null,
  description              text,
  category                 text not null,
  icon                     text not null,
  color                    text not null,
  suggested_duration_days  integer check (
                             suggested_duration_days is null
                             or suggested_duration_days between 1 and 3650
                           ),
  sort_order               integer not null default 0,
  created_at               timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 4. Indexes
-- ---------------------------------------------------------------------------

create index habits_user_status_idx on public.habits (user_id, status);
create index habits_user_created_idx on public.habits (user_id, created_at desc);
create index habits_user_range_idx on public.habits (user_id, start_date, end_date);

create index habit_logs_habit_date_idx on public.habit_logs (habit_id, log_date desc);
create index habit_logs_user_date_idx on public.habit_logs (user_id, log_date desc);

create index xp_events_user_created_idx on public.xp_events (user_id, created_at desc);
create unique index xp_events_user_dedupe_key
  on public.xp_events (user_id, dedupe_key)
  where dedupe_key is not null;

create index freeze_ledger_user_created_idx on public.freeze_ledger (user_id, created_at desc);
create unique index freeze_ledger_user_dedupe_key
  on public.freeze_ledger (user_id, dedupe_key)
  where dedupe_key is not null;

create index user_badges_user_idx on public.user_badges (user_id, earned_at desc);

-- ---------------------------------------------------------------------------
-- 5. updated_at triggers
-- ---------------------------------------------------------------------------

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger habits_set_updated_at
  before update on public.habits
  for each row execute function public.set_updated_at();

create trigger habit_logs_set_updated_at
  before update on public.habit_logs
  for each row execute function public.set_updated_at();

-- habit_logs.user_id always follows the parent habit, so clients may omit it.
create or replace function public.habit_logs_sync_user_id()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid;
begin
  select h.user_id into v_owner
  from public.habits h
  where h.id = new.habit_id;

  if v_owner is null then
    raise exception 'habit % does not exist', new.habit_id
      using errcode = 'foreign_key_violation';
  end if;

  new.user_id := v_owner;
  return new;
end;
$$;

create trigger habit_logs_sync_user_id
  before insert or update of habit_id on public.habit_logs
  for each row execute function public.habit_logs_sync_user_id();

-- ---------------------------------------------------------------------------
-- 6. Streak recalculation
-- ---------------------------------------------------------------------------

-- Recomputes habits.current_streak and habits.longest_streak from habit_logs.
--
-- A day counts toward a streak when a log exists with status 'done' or 'frozen'.
-- 'skipped' explicitly breaks it.
--
-- current_streak walks backwards from the most recent loggable day (today,
-- clamped to end_date). If that day is not logged yet the walk starts from the
-- day before, so an unfinished today never reads as a broken streak.
--
-- longest_streak is the longest island of consecutive qualifying days anywhere
-- in the habit's history, and never decreases below the current streak.
create or replace function public.recalc_habit_streak(p_habit_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_start   date;
  v_end     date;
  v_anchor  date;
  v_current integer := 0;
  v_longest integer := 0;
begin
  select h.start_date, h.end_date
    into v_start, v_end
  from public.habits h
  where h.id = p_habit_id;

  if not found then
    return;
  end if;

  v_anchor := least(public.app_today(), v_end);

  if not exists (
    select 1
    from public.habit_logs l
    where l.habit_id = p_habit_id
      and l.log_date = v_anchor
      and l.status in ('done', 'frozen')
  ) then
    v_anchor := v_anchor - 1;
  end if;

  if v_anchor >= v_start then
    -- Rows in the leading consecutive run satisfy log_date = anchor - (rn - 1).
    -- Once a gap appears the offset only grows, so no later island can match.
    select count(*)
      into v_current
    from (
      select l.log_date,
             row_number() over (order by l.log_date desc) as rn
      from public.habit_logs l
      where l.habit_id = p_habit_id
        and l.status in ('done', 'frozen')
        and l.log_date <= v_anchor
    ) ranked
    where ranked.log_date = v_anchor - (ranked.rn - 1)::integer;
  end if;

  -- Classic gaps-and-islands: consecutive dates share (log_date - row_number).
  select coalesce(max(island.len), 0)
    into v_longest
  from (
    select count(*) as len
    from (
      select l.log_date,
             l.log_date - (row_number() over (order by l.log_date))::integer as grp
      from public.habit_logs l
      where l.habit_id = p_habit_id
        and l.status in ('done', 'frozen')
    ) grouped
    group by grouped.grp
  ) island;

  update public.habits h
  set current_streak = v_current,
      longest_streak = greatest(v_longest, v_current, 0)
  where h.id = p_habit_id
    and (h.current_streak <> v_current
         or h.longest_streak <> greatest(v_longest, v_current, 0));
end;
$$;

comment on function public.recalc_habit_streak(uuid) is
  'Recomputes current_streak/longest_streak for one habit. Called by the habit_logs trigger; safe to call manually.';

create or replace function public.habit_logs_recalc_streak()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recalc_habit_streak(old.habit_id);
    return old;
  end if;

  if tg_op = 'UPDATE' and old.habit_id is distinct from new.habit_id then
    perform public.recalc_habit_streak(old.habit_id);
  end if;

  perform public.recalc_habit_streak(new.habit_id);
  return new;
end;
$$;

create trigger habit_logs_recalc_streak
  after insert or update or delete on public.habit_logs
  for each row execute function public.habit_logs_recalc_streak();

-- ---------------------------------------------------------------------------
-- 7. spend_freeze RPC
-- ---------------------------------------------------------------------------

-- How far back a freeze may be applied. Keep in sync with
-- FREEZE_RETRO_WINDOW_DAYS in lib/habits/constants.ts.
create or replace function public.freeze_retro_window_days()
returns integer
language sql
immutable
set search_path = ''
as $$
  select 2;
$$;

-- Spends one banked freeze on a single day of a habit.
--
-- Atomic by virtue of being one function call: the habit_logs row, the balance
-- decrement and the ledger entry either all land or none do. The habit_logs
-- trigger then recalculates the streak before this returns.
--
-- Raises on: no session, habit not owned by the caller, day outside the habit's
-- date range, day in the future, day older than the retro window, day already
-- logged, or an empty token bank.
create or replace function public.spend_freeze(
  p_habit_id uuid,
  p_log_date date
)
returns public.spend_freeze_result
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id  uuid := auth.uid();
  v_habit    public.habits;
  v_today    date := public.app_today();
  v_tokens   integer;
  v_result   public.spend_freeze_result;
begin
  if v_user_id is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  select h.* into v_habit
  from public.habits h
  where h.id = p_habit_id
    and h.user_id = v_user_id;

  if not found then
    raise exception 'habit not found' using errcode = 'no_data_found';
  end if;

  if p_log_date < v_habit.start_date or p_log_date > v_habit.end_date then
    raise exception 'day % is outside the habit date range (% .. %)',
      p_log_date, v_habit.start_date, v_habit.end_date
      using errcode = 'check_violation';
  end if;

  if p_log_date > v_today then
    raise exception 'cannot freeze a future day' using errcode = 'check_violation';
  end if;

  if p_log_date < v_today - public.freeze_retro_window_days() then
    raise exception 'freezes can only be applied within % days', public.freeze_retro_window_days()
      using errcode = 'check_violation';
  end if;

  if exists (
    select 1
    from public.habit_logs l
    where l.habit_id = p_habit_id
      and l.log_date = p_log_date
  ) then
    raise exception 'day % is already logged', p_log_date using errcode = 'unique_violation';
  end if;

  -- Lock the profile row so two concurrent spends cannot both see the last token.
  select p.freeze_tokens into v_tokens
  from public.profiles p
  where p.id = v_user_id
  for update;

  if coalesce(v_tokens, 0) < 1 then
    raise exception 'no freeze tokens available' using errcode = 'check_violation';
  end if;

  insert into public.habit_logs (habit_id, user_id, log_date, status)
  values (p_habit_id, v_user_id, p_log_date, 'frozen');

  update public.profiles p
  set freeze_tokens = p.freeze_tokens - 1
  where p.id = v_user_id
  returning p.freeze_tokens into v_tokens;

  insert into public.freeze_ledger (user_id, habit_id, delta, reason, log_date, dedupe_key)
  values (
    v_user_id,
    p_habit_id,
    -1,
    'spent',
    p_log_date,
    'spent:' || p_habit_id::text || ':' || p_log_date::text
  );

  select p_habit_id, p_log_date, v_tokens, h.current_streak, h.longest_streak
    into v_result
  from public.habits h
  where h.id = p_habit_id;

  return v_result;
end;
$$;

comment on function public.spend_freeze(uuid, date) is
  'Spends one banked freeze on a habit day. Atomic: writes habit_logs, decrements profiles.freeze_tokens, appends to freeze_ledger.';

revoke all on function public.spend_freeze(uuid, date) from public;
grant execute on function public.spend_freeze(uuid, date) to authenticated;

grant execute on function public.app_today() to anon, authenticated;
grant execute on function public.app_time_zone() to anon, authenticated;
grant execute on function public.freeze_retro_window_days() to anon, authenticated;
grant execute on function public.recalc_habit_streak(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 8. handle_new_user trigger
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
      split_part(new.email, '@', 1)
    ),
    nullif(btrim(new.raw_user_meta_data ->> 'avatar_url'), '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 9. Row level security
-- ---------------------------------------------------------------------------

alter table public.profiles       enable row level security;
alter table public.habits         enable row level security;
alter table public.habit_logs     enable row level security;
alter table public.xp_events      enable row level security;
alter table public.freeze_ledger  enable row level security;
alter table public.badges         enable row level security;
alter table public.user_badges    enable row level security;
alter table public.habit_presets  enable row level security;

-- profiles: own row only. No delete policy; deleting auth.users cascades.
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (auth.uid() = id);

create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- habits
create policy "habits_select_own" on public.habits
  for select to authenticated using (auth.uid() = user_id);

create policy "habits_insert_own" on public.habits
  for insert to authenticated with check (auth.uid() = user_id);

create policy "habits_update_own" on public.habits
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "habits_delete_own" on public.habits
  for delete to authenticated using (auth.uid() = user_id);

-- habit_logs
create policy "habit_logs_select_own" on public.habit_logs
  for select to authenticated using (auth.uid() = user_id);

create policy "habit_logs_insert_own" on public.habit_logs
  for insert to authenticated
  with check (
    exists (
      select 1
      from public.habits h
      where h.id = habit_id
        and h.user_id = auth.uid()
    )
  );

create policy "habit_logs_update_own" on public.habit_logs
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "habit_logs_delete_own" on public.habit_logs
  for delete to authenticated using (auth.uid() = user_id);

-- xp_events: append-only from the client's point of view.
create policy "xp_events_select_own" on public.xp_events
  for select to authenticated using (auth.uid() = user_id);

create policy "xp_events_insert_own" on public.xp_events
  for insert to authenticated with check (auth.uid() = user_id);

-- freeze_ledger: append-only from the client's point of view.
create policy "freeze_ledger_select_own" on public.freeze_ledger
  for select to authenticated using (auth.uid() = user_id);

create policy "freeze_ledger_insert_own" on public.freeze_ledger
  for insert to authenticated with check (auth.uid() = user_id);

-- user_badges
create policy "user_badges_select_own" on public.user_badges
  for select to authenticated using (auth.uid() = user_id);

create policy "user_badges_insert_own" on public.user_badges
  for insert to authenticated with check (auth.uid() = user_id);

-- Reference tables: readable by everyone, writable only via migrations.
create policy "badges_select_all" on public.badges
  for select to anon, authenticated using (true);

create policy "habit_presets_select_all" on public.habit_presets
  for select to anon, authenticated using (true);

-- Table grants. RLS above is what actually scopes rows; these only decide which
-- statements a role may attempt at all.
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.habits to authenticated;
grant select, insert, update, delete on public.habit_logs to authenticated;
grant select, insert on public.xp_events to authenticated;
grant select, insert on public.freeze_ledger to authenticated;
grant select, insert on public.user_badges to authenticated;
grant select on public.badges to anon, authenticated;
grant select on public.habit_presets to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 10. Seed data
-- ---------------------------------------------------------------------------

insert into public.badges (id, name, description, icon, kind, threshold, sort_order) values
  ('first_habit',    'First Step',      'Created your very first habit.',                        'seedling',  'first_habit',      null, 10),
  ('streak_7',       'Week One',        'Held a 7 day streak. The hardest week is behind you.',  'flame',     'streak',              7, 20),
  ('streak_21',      'Habit Forming',   '21 days straight. It is starting to feel normal.',      'sprout',    'streak',             21, 30),
  ('streak_66',      'Automatic',       '66 days straight, the average point of automaticity.',  'brain',     'streak',             66, 40),
  ('streak_100',     'Centurion',       '100 days straight. Genuinely rare.',                    'trophy',    'streak',            100, 50),
  ('perfect_finish', 'Perfect Finish',  'Completed a habit with every single day marked done.',  'medal',     'habit_completed',   100, 60),
  ('comeback',       'Comeback Kid',    '7 clean days after spending a freeze.',                 'snowflake', 'comeback',            7, 70)
on conflict (id) do update set
  name        = excluded.name,
  description = excluded.description,
  icon        = excluded.icon,
  kind        = excluded.kind,
  threshold   = excluded.threshold,
  sort_order  = excluded.sort_order;

insert into public.habit_presets
  (id, title, description, category, icon, color, suggested_duration_days, sort_order) values
  ('read-20-pages',   'Read 20 pages',       'Twenty pages a day is roughly a book a month.',        'mind',         'book',      'violet',   30,  10),
  ('meditate-10',     'Meditate 10 minutes', 'Sit, breathe, come back when you drift.',              'mind',         'lotus',     'cyan',      21,  20),
  ('journal-nightly', 'Journal before bed',  'Three lines about the day is enough.',                 'mind',         'notebook',  'fuchsia',   30,  30),
  ('workout-45',      'Workout 45 minutes',  'Anything that raises your heart rate counts.',         'fitness',     'dumbbell',  'rose',      66,  40),
  ('walk-10k',        'Walk 10,000 steps',   'The easiest cardio you will ever do.',                 'fitness',     'footprints','emerald',   30,  50),
  ('stretch-10',      'Stretch 10 minutes',  'Mobility work so nothing seizes up later.',            'fitness',     'stretch',   'lime',      21,  60),
  ('water-2l',        'Drink 2L of water',   'Fill the bottle in the morning, finish it by night.',  'health',      'droplet',   'blue',      30,  70),
  ('sleep-by-11',     'Lights out by 11pm',  'The habit that quietly fixes every other habit.',      'health',      'moon',      'violet',    30,  80),
  ('no-phone-am',     'No phone first hour', 'Protect the first hour of your day.',                  'health',      'phone-off', 'amber',     21,  90),
  ('code-1h',         'Code for 1 hour',     'Ship something small every day.',                      'learning',    'code',      'cyan',      66, 100),
  ('language-lesson', 'One language lesson', 'A single lesson a day beats weekend cramming.',        'learning',    'languages', 'emerald',  100, 110),
  ('deep-work-90',    'Deep work block',     'Ninety uninterrupted minutes on the thing that matters.', 'productivity', 'target', 'amber',   30, 120),
  ('tidy-10',         'Tidy for 10 minutes', 'Reset one surface. Future you is grateful.',           'productivity', 'broom',     'blue',      30, 130),
  ('draw-daily',      'Draw something',      'One sketch a day, however rough.',                     'creativity',  'pencil',    'rose',      66, 140),
  ('practice-30',     'Practice 30 minutes', 'Instrument, voice, craft — whatever you are building.', 'creativity', 'music',     'fuchsia',   66, 150)
on conflict (id) do update set
  title                   = excluded.title,
  description             = excluded.description,
  category                = excluded.category,
  icon                    = excluded.icon,
  color                   = excluded.color,
  suggested_duration_days = excluded.suggested_duration_days,
  sort_order              = excluded.sort_order;
