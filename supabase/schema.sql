-- MyHealth database schema
-- Run this in your Supabase project: Dashboard → SQL Editor → New query → Paste → Run

-- ─────────────────────────────────────────────────────────────────────────────
-- Goals
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.goals (
  id                          text        primary key,
  user_id                     uuid        not null references auth.users(id) on delete cascade,
  name                        text        not null,
  description                 text        not null default '',
  unit                        text        not null,
  target_amount               numeric     not null,
  color                       text        not null,
  end_of_day_reminder_enabled boolean     not null default true,
  end_of_day_reminder_time    text        not null default '20:00',
  reminders                   jsonb       not null default '[]',
  is_active                   boolean     not null default true,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

-- Keep updated_at current automatically
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger goals_updated_at
  before update on public.goals
  for each row execute procedure public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- Progress entries
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.progress_entries (
  id          text        primary key,
  user_id     uuid        not null references auth.users(id) on delete cascade,
  goal_id     text        not null references public.goals(id) on delete cascade,
  date        text        not null,  -- "YYYY-MM-DD"
  amount      numeric     not null default 0,
  completed   boolean     not null default false,
  notes       text        not null default '',
  updated_at  timestamptz not null default now(),
  unique (goal_id, date)
);

create trigger progress_entries_updated_at
  before update on public.progress_entries
  for each row execute procedure public.set_updated_at();

-- Index for fast per-user, per-date queries
create index if not exists progress_entries_user_date
  on public.progress_entries (user_id, date desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- Row-level security — each user can only see and modify their own data
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.goals          enable row level security;
alter table public.progress_entries enable row level security;

create policy "goals: owner access"
  on public.goals for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "progress_entries: owner access"
  on public.progress_entries for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
