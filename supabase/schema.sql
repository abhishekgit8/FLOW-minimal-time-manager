-- =============================================
-- FLOW — Supabase Database Schema (v2)
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =============================================
-- 1. TASKS TABLE (enhanced)
-- =============================================
create table if not exists tasks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text default '',
  priority text check (priority in ('high', 'medium', 'low')) default 'medium',
  category text default 'Work',
  time_estimate integer default 25,
  time_spent integer default 0,
  done boolean default false,
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- Add columns if table already exists (safe migration)
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name='tasks' and column_name='description') then
    alter table tasks add column description text default '';
  end if;
  if not exists (select 1 from information_schema.columns where table_name='tasks' and column_name='category') then
    alter table tasks add column category text default 'Work';
  end if;
  if not exists (select 1 from information_schema.columns where table_name='tasks' and column_name='time_estimate') then
    alter table tasks add column time_estimate integer default 25;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='tasks' and column_name='time_spent') then
    alter table tasks add column time_spent integer default 0;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='tasks' and column_name='completed_at') then
    alter table tasks add column completed_at timestamptz;
  end if;
end $$;

-- RLS: Users can only see/modify their own tasks
alter table tasks enable row level security;

create policy "Users can view own tasks" on tasks for select using (auth.uid() = user_id);
create policy "Users can insert own tasks" on tasks for insert with check (auth.uid() = user_id);
create policy "Users can update own tasks" on tasks for update using (auth.uid() = user_id);
create policy "Users can delete own tasks" on tasks for delete using (auth.uid() = user_id);

-- =============================================
-- 2. POMODORO SESSIONS TABLE
-- =============================================
create table if not exists pomodoro_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  duration integer not null default 25,
  mode text check (mode in ('pomodoro', 'short', 'long')) default 'pomodoro',
  completed_at timestamptz default now()
);

alter table pomodoro_sessions enable row level security;

create policy "Users can view own sessions" on pomodoro_sessions for select using (auth.uid() = user_id);
create policy "Users can insert own sessions" on pomodoro_sessions for insert with check (auth.uid() = user_id);
create policy "Users can delete own sessions" on pomodoro_sessions for delete using (auth.uid() = user_id);

-- =============================================
-- 3. INDEXES
-- =============================================
create index if not exists idx_tasks_user_id on tasks(user_id);
create index if not exists idx_tasks_done on tasks(user_id, done);
create index if not exists idx_tasks_category on tasks(user_id, category);
create index if not exists idx_sessions_user_id on pomodoro_sessions(user_id);
create index if not exists idx_sessions_completed on pomodoro_sessions(user_id, completed_at);
