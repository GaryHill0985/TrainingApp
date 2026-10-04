# Lucas's Training

A calm, mobile-first, installable (PWA) strength-training app with two roles:

- **Lucas (trainee)** runs and logs his 5-day push/pull plan at the gym, fully offline, and it syncs later.
- **Dad (coach)** sees sessions, set-by-set detail, technique colours, pain flags and progress remotely.

The plan content (workouts, exercises, cues, safety rules, muscles, goals, theme) lives in
[`lucas_plan_seed.json`](./lucas_plan_seed.json). It is the single source of truth: the app renders it and never invents content.

Guiding mantra: **Technique first. Control second. Weight third.**

## Stack

- React + Vite + TypeScript, Tailwind CSS v4, `vite-plugin-pwa` (installable, works offline)
- Supabase (Postgres + Auth + Realtime + Row-Level Security + Storage)
- Dexie (IndexedDB) local-first store with an outbox that syncs when online
- Recharts for the coach's charts

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill it in (see "Environment variables").
3. Apply the database schema and seed the plan (see "Database").
4. `npm run dev` and open the printed URL on your phone (same Wi-Fi) or use the deployed URL.

## Environment variables

| Variable | Where it is used | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | app | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | app | public anon key (safe in the browser; RLS protects data) |
| `SUPABASE_SERVICE_ROLE_KEY` | scripts only | never shipped to the browser |
| `SUPABASE_DB_PASSWORD` | scripts only | used to apply migrations |
| `TRAINEE_EMAIL` / `TRAINEE_PASSWORD` | scripts + one-time pairing | Lucas's real account behind the PIN |
| `COACH_EMAIL` / `COACH_PASSWORD` | scripts + one-time pairing | Dad's real account behind the PIN |

`.env` is git-ignored. Only `.env.example` is committed.

## Database

All three steps read `.env`. Run them once after creating the Supabase project, and again whenever
`lucas_plan_seed.json` or `supabase/migrations/` changes.

```bash
npm run db:setup
```

That runs, in order:

| Command | What it does |
|---|---|
| `npm run db:migrate` | Applies `supabase/migrations/*.sql` once each (tracked in `schema_migrations`). Needs `SUPABASE_DB_PASSWORD`. |
| `npm run db:seed` | Idempotent import of `lucas_plan_seed.json`. Re-running updates, never duplicates. Coach-edited fields (anything listed in a row's `coach_edited_fields`, plus non-empty `video_url` / `photo_url`) are never overwritten. Needs `SUPABASE_SERVICE_ROLE_KEY`. |
| `npm run db:users` | Creates or refreshes the two accounts (Lucas = trainee, Dad = coach) from the `TRAINEE_*` / `COACH_*` variables. |

Schema summary: plan tables (`plan_settings`, `workouts`, `workout_items`, `exercises`, `muscles`, `exercise_muscles`,
`muscle_assets`, `metric_definitions`, `activity_types`) are readable by both roles and writable by the coach.
Logged tables (`sessions`, `set_logs`, `exercise_logs`, `metric_logs`, `activity_entries`, `food_entries`,
`milestone_progress`) are writable by their owner and readable by the coach, all enforced with Row-Level Security.
Realtime is enabled on the logged tables and the plan tables. Media (machine photos, demo videos, inspiration
images) goes in the public-read `media` storage bucket under random paths; only the coach can upload.

## Running locally

```bash
npm run dev
```

## Deploying

_Milestone 1/2: Vercel or Netlify, build command `npm run build`, output `dist`._

## Sign-in model

Each phone is paired once by the coach using the real email + password of that role's account.
After that, the app only asks for a 4-digit PIN (a local lock on the device). "Switch user" clears the pairing.

## Assumptions and decisions

- Weights are in kg.
- "Today's workout" is the next workout in the plan sequence after the last one Lucas completed
  (so a missed day never skips a workout). He can always pick a different one.
- Fractional warm-up sets in the seed (2.5, 1.5) mean "2–3" and "1–2".
- Items whose rep range is not plain reps are logged by what they are: per-side reps (Pallof press),
  seconds per side (side plank), weight and metres per side (suitcase carry), minutes (easy cardio).
- The progression hint only runs on items with a numeric rep range and a "Leave N" effort target.
  RIR is not logged per set (keeps logging to three taps); the hint uses reps plus technique colour.
- The coach's "estimated working strength" uses the Epley estimate (weight × (1 + reps/30)), labelled as an estimate, never shown to Lucas.
- The seed's "Easy" position is rendered as a sixth chip.
- No bundled muscle diagrams (Addendum A.4). Muscle text cards plus a Muscle & Motion signpost.
- Push notifications are not built in v1.
- Food "meal" is a fixed list (Breakfast, Lunch, Dinner, Snack) plus free text. No targets, limits or warnings anywhere.
- Progress photos are not built.

## Licences and attribution

Anatomy text data is authored from standard references as a starter dataset (coach-verifiable).
No assets from commercial apps are used. See the in-app About screen for attributions of any open assets.
