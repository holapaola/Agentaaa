-- Enable pgcrypto extension for encryption
create extension if not exists pgcrypto;

-- Client credentials vault (encrypted storage for API keys, webhooks, etc.)
create table if not exists public.client_credentials (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references public.clients(id) on delete cascade,
  platform      text not null,           -- 'OpenAI', 'Stripe', 'Custom API', etc.
  credential_type text not null,         -- 'api_key', 'webhook_secret', 'webhook_url', 'bearer_token'
  key_name      text not null,           -- human-readable name (e.g., "Production API Key")
  encrypted_value text not null,         -- pgp_sym_encrypt(value, secret_key)
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  
  unique(client_id, platform, key_name)
);

alter table public.client_credentials enable row level security;

-- Agency members can manage their own clients' credentials
create policy "Agency can manage credentials"
  on public.client_credentials
  for all
  using (
    client_id in (
      select id from public.clients
      where agency_id in (
        select agency_id from public.profiles where id = auth.uid()
      )
    )
  );

-- Auto-update updated_at timestamp
create or replace function update_client_credentials_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists client_credentials_updated_at on public.client_credentials;
create trigger client_credentials_updated_at
  before update on public.client_credentials
  for each row
  execute function update_client_credentials_updated_at();
