# genZtracking

A multi-user habit tracker. Create a habit with a title, description and a date
range (or just a duration in days), and it generates a dedicated panel: a
checkbox grid covering every day in the range, an optional note per day, a live
progress bar, and a streak counter protected by earned freeze tokens. XP and
levels on top.

## Stack

| Piece      | Choice                                                     |
| ---------- | ---------------------------------------------------------- |
| Framework  | Next.js 15 App Router, React 19, TypeScript                |
| Styling    | Tailwind CSS v4 (CSS-first, no `tailwind.config.ts`)       |
| Backend    | Supabase — Postgres, Auth, Row Level Security              |
| Auth       | `@supabase/ssr` cookie sessions (username / email + password) |
| Animation  | GSAP for choreography, anime.js v4 for micro-interactions  |

## Getting started

```bash
npm install
cp .env.local.example .env.local   # then fill it in
npm run dev
```

A `.env.local` with placeholder values is already checked in so the project
compiles out of the box. Auth and every database call will fail until you point
it at a real project.

### 1. Create a Supabase project

Grab the project URL and anon key from **Project Settings → API** and put them
in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_APP_TIME_ZONE=Asia/Phnom_Penh
```

On **Vercel** (Project → Settings → Environment Variables), set the production
origin so confirmation emails never point at localhost. Then **redeploy**
(`NEXT_PUBLIC_*` is inlined at build time):

```
NEXT_PUBLIC_SITE_URL=https://gen-ztracking-peach.vercel.app
```

### 2. Apply the migrations

Paste these into the SQL editor **in order**, or use the CLI:

1. `supabase/migrations/0001_init.sql`
2. `supabase/migrations/0002_earn_freeze.sql`
3. `supabase/migrations/0003_username.sql` — unique `profiles.username` plus
   RPCs used by username login (`username_available(p_username)`,
   `email_for_username(p_username)`)
4. `supabase/migrations/0004_username_rpc.sql` — re-asserts those RPC names
   and reloads the PostgREST schema cache

```bash
npx supabase init          # only if supabase/config.toml does not exist yet
npx supabase link --project-ref <project-ref>
npx supabase db push
```

`0001_init.sql` is idempotent for seed data only — it creates types and tables
unconditionally, so run it once against a fresh project. `0003_username.sql`
is safe to re-run (`if not exists` / `create or replace`). `0004_username_rpc.sql`
is also safe to re-run.

### 3. Configure auth

Sign-in is **email (or username) + password**. There is no Google button.

In **Authentication → Providers → Email**:

- Enable the Email provider
- **Turn Confirm email off** so a new account can sign in immediately after
  signup. If you leave it on, signup shows a “check your inbox” screen and
  `/auth/callback` still handles the confirmation link.

The Google provider can stay enabled in the dashboard; the app never calls it.

In **Authentication → URL Configuration** (required if Confirm email is on):

1. Open the [Supabase dashboard](https://supabase.com/dashboard) → your project
2. **Authentication** → **URL Configuration**
3. **Site URL:** `https://gen-ztracking-peach.vercel.app`  
   Confirmation emails use this when the app does not send `emailRedirectTo`.
   Leave it on localhost and every “Confirm email” click goes to
   `http://localhost:3000`.
4. **Redirect URLs** — add both (Save):
   - `https://gen-ztracking-peach.vercel.app/auth/callback`
   - `http://localhost:3000/auth/callback`

Emails already sent still contain the old Site URL. Updating this only
affects **new** confirmation emails.

### 4. Timezone

"Today" is resolved in one fixed timezone — `Asia/Phnom_Penh` — so a late-night
check-in cannot land on the wrong calendar day. It is defined in **two** places
and they must agree:

- `NEXT_PUBLIC_APP_TIME_ZONE` → `APP_TIME_ZONE` in `lib/habits/dates.ts`
- `public.app_time_zone()` in `supabase/migrations/0001_init.sql`

## Scripts

```bash
npm run dev     # dev server (Turbopack)
npm run build   # production build
npm run lint    # eslint
npx tsc --noEmit
```

## Project layout

```
app/
  layout.tsx              root layout, dark theme, fonts
  globals.css             all design tokens live here (Tailwind v4)
  page.tsx                landing page (GSAP hero)
  (auth)/login/           username or email + password
  (auth)/signup/          username, email, password
  auth/callback/route.ts  email confirmation / recovery links (optional)
  auth/signout/route.ts   POST to end the session
  (app)/                  authenticated shell: nav, XP bar, freeze tokens, mobile tab bar
    today/ habits/ habits/new/ habits/[id]/ archive/ profile/
components/
  ui/                     Button, Card, Pill, Field primitives
  nav/                    header nav + mobile tab bar
  auth/                   LoginForm, SignupForm
  landing/                GSAP hero
  habit/                  panel, day grid, create form, today rows
  gamify/                 XP bar, freeze tokens, badges, level-up overlay
lib/
  supabase/               browser, server and middleware clients
  habits/dates.ts         ISO date helpers, range expansion, day grid
  habits/constants.ts     freeze rules, palettes, limits, route map
  habits/actions.ts       server actions for habits, logs, freezes, archive
  habits/queries.ts       cached reads
  gamify/rules.ts         XP, levels, badge qualification
  anim/                   GSAP context hook + anime.js helpers
  auth.ts                 requireUser / requireSession / getProfile
  env.ts                  environment variable access
  utils.ts                cn()
types/database.ts         hand-written mirror of the migration
supabase/migrations/      0001_init.sql, 0002_earn_freeze.sql, 0003_username.sql
middleware.ts             refreshes the session, gates protected routes
```

## Data model

| Table            | Purpose                                                                |
| ---------------- | ---------------------------------------------------------------------- |
| `profiles`       | Mirrors `auth.users`. Holds `username`, `xp`, `level`, `freeze_tokens`. |
| `habits`         | One per habit, plus denormalized `current_streak` / `longest_streak`.  |
| `habit_logs`     | One row per **marked** day. Unique on `(habit_id, log_date)`.          |
| `xp_events`      | Append-only XP ledger, so totals are auditable and reversible.         |
| `freeze_ledger`  | Append-only `delta` rows for earned and spent freezes.                 |
| `badges`         | Seeded reference data.                                                 |
| `user_badges`    | Unique on `(user_id, badge_id)`.                                       |
| `habit_presets`  | Seeded template library.                                               |

The day grid is **derived** from `start_date..end_date` and left joined against
`habit_logs` at read time. No row is created per day, so a 365-day habit costs
zero rows until days are actually checked off. Use
`buildHabitDays()` from `lib/habits/dates.ts` for that join.

Every user-owned table has RLS with `auth.uid() = user_id`. `badges` and
`habit_presets` are world-readable and have no writer policy.

## Streaks and freezes

`recalc_habit_streak(habit_id)` recomputes both streak columns from
`habit_logs`, and an `after insert or update or delete` trigger on `habit_logs`
calls it. A day counts when a log exists with status `done` or `frozen`;
`skipped` breaks the streak. The current streak is anchored on today (clamped to
`end_date`), and falls back to yesterday when today is not logged yet, so an
unfinished today never reads as a broken streak.

`spend_freeze(habit_id, log_date)` writes the `frozen` log row, decrements
`profiles.freeze_tokens` and appends to `freeze_ledger` in one atomic call. It
raises when the bank is empty, the day is already logged, the day is outside the
habit range or in the future, or the day is older than the 2-day retro window.

Freeze tokens are earned by `maybe_earn_freeze()` (migration `0002_earn_freeze.sql`)
whenever `current_streak` hits a multiple of 7, banked up to 3. The ledger
dedupe key is `earned:<habit_id>:<streak_length>:<today>` so a replay cannot
double-award.

## Conventions

- **Dates** are ISO `YYYY-MM-DD` strings end to end, never `Date` objects.
  All arithmetic in `lib/habits/dates.ts` happens in UTC; the only timezone
  lookup is `todayISO()`.
- **Colors and icons** are stored as keys (`violet`, `book`), never hex or
  component names. See `HABIT_COLORS` / `HABIT_ICONS` in
  `lib/habits/constants.ts` and the `--color-habit-*` tokens in `globals.css`.
- **Design tokens** are semantic (`bg-surface`, `text-ink-muted`, `text-brand`)
  and flip automatically between dark and light, so components should not need
  `dark:` variants. `<html>` is `class="dark"` by default; swap it for `light`.
- **`types/database.ts` is hand-written.** There is no live project to generate
  from. If you add a migration, update it in the same commit.
- `lib/supabase/server.ts`'s `createClient()` is **async** and must be created
  per request. Never hoist it to module scope.
- Routes come from the `ROUTES` map in `lib/habits/constants.ts`.
