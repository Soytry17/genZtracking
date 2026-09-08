-- ============================================================================
-- Daily priority tasks: one row per task until completed. Incomplete rows
-- roll over to the next day in the same priority column (no clone-per-day).
--
-- Paste this into the Supabase SQL editor after 0005, or:
--   npx supabase db push
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------------------

do $$ begin
  create type public.task_priority as enum ('urgent', 'high', 'medium', 'low');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.task_importance as enum ('important', 'not_important');
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- 2. Table
-- ---------------------------------------------------------------------------

create table if not exists public.daily_tasks (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  title         text not null check (char_length(btrim(title)) between 1 and 120),
  description   text,
  priority      public.task_priority not null default 'medium',
  importance    public.task_importance not null default 'not_important',
  completed_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint daily_tasks_description_len check (
    description is null or char_length(description) <= 2000
  )
);

comment on table public.daily_tasks is
  'User daily tasks. Incomplete rows (completed_at is null) stay on the board until ticked; they are not cloned each day.';

comment on column public.daily_tasks.priority is
  'Board column: urgent | high | medium | low. Drag-and-drop updates this field only.';

comment on column public.daily_tasks.importance is
  'Card badge: important | not_important. Independent of priority; not changed by drag-and-drop.';

comment on column public.daily_tasks.completed_at is
  'Null while open. Set when the user ticks the task. "Done today" is this timestamp on app_today().';

-- Open tasks: list by user, then column, then created order.
create index if not exists daily_tasks_user_open_idx
  on public.daily_tasks (user_id, priority, created_at)
  where completed_at is null;

-- Completed today: range scan on completed_at for the Phnom Penh calendar day.
create index if not exists daily_tasks_user_completed_idx
  on public.daily_tasks (user_id, completed_at desc)
  where completed_at is not null;

-- ---------------------------------------------------------------------------
-- 3. updated_at
-- ---------------------------------------------------------------------------

drop trigger if exists daily_tasks_set_updated_at on public.daily_tasks;
create trigger daily_tasks_set_updated_at
  before update on public.daily_tasks
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. Row level security
-- ---------------------------------------------------------------------------

alter table public.daily_tasks enable row level security;

drop policy if exists "daily_tasks_select_own" on public.daily_tasks;
create policy "daily_tasks_select_own" on public.daily_tasks
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "daily_tasks_insert_own" on public.daily_tasks;
create policy "daily_tasks_insert_own" on public.daily_tasks
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "daily_tasks_update_own" on public.daily_tasks;
create policy "daily_tasks_update_own" on public.daily_tasks
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "daily_tasks_delete_own" on public.daily_tasks;
create policy "daily_tasks_delete_own" on public.daily_tasks
  for delete to authenticated using (auth.uid() = user_id);

grant select, insert, update, delete on public.daily_tasks to authenticated;

notify pgrst, 'reload schema';
