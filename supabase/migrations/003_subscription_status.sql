-- Add subscription fields to profiles
alter table public.profiles
  add column if not exists subscription_status text not null default 'inactive'
    check (subscription_status in ('inactive', 'trialing', 'active', 'canceled')),
  add column if not exists subscription_plan   text
    check (subscription_plan in ('starter', 'agency', 'enterprise')),
  add column if not exists subscription_updated_at timestamptz;
