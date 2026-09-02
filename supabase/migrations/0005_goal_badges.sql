-- ============================================================================
-- Personal goal badges: one user-owned badge per habit, awarded when the
-- habit is completed (or archived at 100% progress).
--
-- Seeded `badges` / `user_badges` stay untouched. Paste this into the
-- Supabase SQL editor after 0004, or:
--   npx supabase db push
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Table
-- ---------------------------------------------------------------------------

create table if not exists public.goal_badges (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  -- Nullable so an earned badge survives deleting the habit.
  habit_id     uuid references public.habits (id) on delete set null,
  title        text not null,
  description  text,
  icon         text not null default '🏆',
  awarded_at   timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint goal_badges_title_len check (
    char_length(btrim(title)) between 1 and 80
  ),
  constraint goal_badges_description_len check (
    description is null or char_length(description) <= 280
  ),
  constraint goal_badges_icon_len check (
    char_length(icon) between 1 and 32
  )
);

comment on table public.goal_badges is
  'User-designed badges attached to a habit. awarded_at is set when the goal is met.';

comment on column public.goal_badges.awarded_at is
  'Null while locked. Set when the habit is completed (or archived at 100%).';

comment on column public.goal_badges.icon is
  'Emoji (or a habit icon key). Rendered as text when it is not a known icon key.';

-- One goal badge per habit. Multiple NULLs are allowed after a habit is deleted.
create unique index if not exists goal_badges_habit_key
  on public.goal_badges (habit_id)
  where habit_id is not null;

create index if not exists goal_badges_user_awarded_idx
  on public.goal_badges (user_id, awarded_at desc nulls last);

-- ---------------------------------------------------------------------------
-- 2. updated_at
-- ---------------------------------------------------------------------------

drop trigger if exists goal_badges_set_updated_at on public.goal_badges;
create trigger goal_badges_set_updated_at
  before update on public.goal_badges
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 3. Row level security
-- ---------------------------------------------------------------------------

alter table public.goal_badges enable row level security;

drop policy if exists "goal_badges_select_own" on public.goal_badges;
create policy "goal_badges_select_own" on public.goal_badges
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "goal_badges_insert_own" on public.goal_badges;
create policy "goal_badges_insert_own" on public.goal_badges
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "goal_badges_update_own" on public.goal_badges;
create policy "goal_badges_update_own" on public.goal_badges
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "goal_badges_delete_own" on public.goal_badges;
create policy "goal_badges_delete_own" on public.goal_badges
  for delete to authenticated using (auth.uid() = user_id);

grant select, insert, update, delete on public.goal_badges to authenticated;

notify pgrst, 'reload schema';
