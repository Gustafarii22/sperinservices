-- Owner check: only the confirmed owner account may access anything.
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = auth.uid()
      AND lower(u.email) = 'info@sperinservices.co.uk'
      AND u.email_confirmed_at IS NOT NULL
  );
$$;
REVOKE ALL ON FUNCTION public.is_owner() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_owner() TO authenticated, service_role;

CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'paste' CHECK (source IN ('webhook','forward','paste','sample')),
  source_message_id text UNIQUE,
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('received','needs_info','ready_for_review','approved_sent','customer_replied','won','declined','archived')),
  job_title text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'general',
  customer_name text,
  customer_email text,
  customer_phone text,
  postcode text,
  scope text NOT NULL DEFAULT '',
  raw_excerpt text,
  is_sample boolean NOT NULL DEFAULT false,
  suitability text NOT NULL DEFAULT 'review',
  travel_note text,
  estimate jsonb NOT NULL DEFAULT '{}'::jsonb,
  reply_subject text NOT NULL DEFAULT '',
  reply_body text NOT NULL DEFAULT '',
  retain_until timestamptz NOT NULL DEFAULT (now() + interval '365 days')
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner all leads" ON public.leads FOR ALL TO authenticated USING (public.is_owner()) WITH CHECK (public.is_owner());
CREATE INDEX leads_created_idx ON public.leads (created_at DESC);

CREATE TABLE public.outbound_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  idempotency_key text NOT NULL UNIQUE,
  to_email text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  price_summary text,
  status text NOT NULL DEFAULT 'sending' CHECK (status IN ('sending','sent','failed')),
  provider_id text,
  error text,
  approved_by uuid NOT NULL,
  sent_at timestamptz
);
-- At most one non-failed outbound reply per lead content version is enforced by idempotency key.
GRANT SELECT, INSERT, UPDATE ON public.outbound_messages TO authenticated;
GRANT ALL ON public.outbound_messages TO service_role;
ALTER TABLE public.outbound_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner read outbound" ON public.outbound_messages FOR SELECT TO authenticated USING (public.is_owner());
CREATE POLICY "owner insert outbound" ON public.outbound_messages FOR INSERT TO authenticated WITH CHECK (public.is_owner() AND approved_by = auth.uid());
CREATE POLICY "owner update outbound" ON public.outbound_messages FOR UPDATE TO authenticated USING (public.is_owner()) WITH CHECK (public.is_owner());

CREATE TABLE public.webhook_events (
  id text PRIMARY KEY,
  received_at timestamptz NOT NULL DEFAULT now(),
  event_type text NOT NULL,
  outcome text NOT NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL
);
GRANT SELECT ON public.webhook_events TO authenticated;
GRANT ALL ON public.webhook_events TO service_role;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner read webhook events" ON public.webhook_events FOR SELECT TO authenticated USING (public.is_owner());

CREATE TABLE public.audit_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  at timestamptz NOT NULL DEFAULT now(),
  actor text NOT NULL,
  action text NOT NULL,
  lead_id uuid,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb
);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner read audit" ON public.audit_logs FOR SELECT TO authenticated USING (public.is_owner());
CREATE POLICY "owner insert audit" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (public.is_owner());

CREATE TABLE public.app_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  rates jsonb NOT NULL DEFAULT '{}'::jsonb,
  retention_days int NOT NULL DEFAULT 365,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner all settings" ON public.app_settings FOR ALL TO authenticated USING (public.is_owner()) WITH CHECK (public.is_owner());
INSERT INTO public.app_settings (id) VALUES (1);

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER leads_touch BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Retention purge (owner-triggered from app): deletes leads past retain_until.
CREATE OR REPLACE FUNCTION public.purge_expired_leads() RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n int;
BEGIN
  IF NOT public.is_owner() THEN RAISE EXCEPTION 'forbidden'; END IF;
  DELETE FROM public.leads WHERE retain_until < now();
  GET DIAGNOSTICS n = ROW_COUNT;
  INSERT INTO public.audit_logs(actor, action, detail) VALUES ('owner','retention_purge', jsonb_build_object('deleted', n));
  RETURN n;
END; $$;
REVOKE ALL ON FUNCTION public.purge_expired_leads() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.purge_expired_leads() TO authenticated;