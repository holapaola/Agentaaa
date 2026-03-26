ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS slot_locked_until TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS clients_agency_active_slots_idx
  ON public.clients (agency_id, deleted_at, slot_locked_until);
