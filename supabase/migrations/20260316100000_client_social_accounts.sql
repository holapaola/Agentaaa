-- Client social media accounts table
-- Stores connected social accounts per client (OAuth tokens for future API use)

create table if not exists public.client_social_accounts (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references public.clients(id) on delete cascade,
  platform      text not null,           -- 'Instagram' | 'LinkedIn' | 'Twitter' | 'TikTok' | 'Facebook'
  account_handle text,                   -- @username or page name
  account_id    text,                    -- platform's internal user/page ID
  access_token  text,                    -- OAuth access token
  token_expires_at timestamptz,          -- when the token expires (null = non-expiring)
  connected_at  timestamptz default now(),
  unique(client_id, platform)
);

alter table public.client_social_accounts enable row level security;

-- Agency members can manage their own clients' accounts
create policy "Agency can manage social accounts"
  on public.client_social_accounts
  for all
  using (
    client_id in (
      select id from public.clients
      where agency_id in (
        select agency_id from public.profiles where id = auth.uid()
      )
    )
  );
