-- Agency AAA Platform – Initial Schema
-- Run this in your Supabase SQL editor

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ── Users (extends Supabase auth.users) ──────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Social Accounts ──────────────────────────────────────────────────────────
create table if not exists public.social_accounts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  platform     text not null check (platform in ('twitter','instagram','linkedin','facebook')),
  username     text not null,
  access_token text,
  connected    boolean default true,
  created_at   timestamptz default now() not null,
  unique (user_id, platform)
);

alter table public.social_accounts enable row level security;

create policy "Users manage own social accounts"
  on public.social_accounts for all
  using (auth.uid() = user_id);

-- ── Scheduled Posts ──────────────────────────────────────────────────────────
create table if not exists public.scheduled_posts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  platform     text not null check (platform in ('twitter','instagram','linkedin','facebook')),
  content      text not null,
  media_urls   text[],
  scheduled_at timestamptz not null,
  published_at timestamptz,
  status       text not null default 'draft'
               check (status in ('draft','scheduled','published','failed')),
  created_at   timestamptz default now() not null
);

alter table public.scheduled_posts enable row level security;

create policy "Users manage own posts"
  on public.scheduled_posts for all
  using (auth.uid() = user_id);

create index on public.scheduled_posts (user_id, scheduled_at);

-- ── Action Items ─────────────────────────────────────────────────────────────
create table if not exists public.action_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  description text,
  priority    text not null default 'medium'
              check (priority in ('low','medium','high')),
  completed   boolean default false,
  due_date    date,
  created_at  timestamptz default now() not null
);

alter table public.action_items enable row level security;

create policy "Users manage own action items"
  on public.action_items for all
  using (auth.uid() = user_id);

-- ── AI Insights ──────────────────────────────────────────────────────────────
create table if not exists public.ai_insights (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  type       text not null check (type in ('content_idea','caption','hashtags','strategy')),
  prompt     text not null,
  result     text not null,
  created_at timestamptz default now() not null
);

alter table public.ai_insights enable row level security;

create policy "Users manage own AI insights"
  on public.ai_insights for all
  using (auth.uid() = user_id);
