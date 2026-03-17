-- Subscriptions table: tracks each user's Stripe subscription
create table if not exists public.subscriptions (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id      text,
  stripe_subscription_id  text unique,
  plan                    text not null default 'starter', -- starter | agency | enterprise
  status                  text not null default 'trialing', -- trialing | active | past_due | canceled
  created_at              timestamptz default now(),
  updated_at              timestamptz default now()
);

-- One subscription per user
create unique index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);

-- RLS: users can only read their own subscription
alter table public.subscriptions enable row level security;

create policy "Users can view own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute procedure public.handle_updated_at();
