ALTER TABLE public.outbound_messages ADD COLUMN IF NOT EXISTS sms_body text;
CREATE TABLE public.outbound_channels (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), outbound_id uuid NOT NULL REFERENCES public.outbound_messages(id) ON DELETE CASCADE,
 channel text NOT NULL CHECK(channel IN ('gmail','sms')), recipient text, body text NOT NULL,
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','sending','sent','delivered','failed','unknown','skipped')),
 provider_id text, error text, attempt_token uuid, attempts integer NOT NULL DEFAULT 0, updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(outbound_id,channel)
);
GRANT SELECT ON public.outbound_channels TO authenticated;
GRANT ALL ON public.outbound_channels TO service_role;
ALTER TABLE public.outbound_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner reads channel history" ON public.outbound_channels FOR SELECT TO authenticated USING (public.is_owner());
CREATE OR REPLACE FUNCTION public.approve_quote(p_lead uuid,p_to text,p_subject text,p_body text,p_sms text,p_mobile text,p_confirmed boolean,p_key text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE l public.leads; o uuid;
BEGIN
 IF NOT public.is_owner() OR NOT p_confirmed THEN RAISE EXCEPTION 'Owner approval required'; END IF;
 SELECT * INTO l FROM public.leads WHERE id=p_lead FOR UPDATE;
 IF l.id IS NULL OR l.is_sample OR l.status IN ('approved_sent','won','declined','archived') THEN RAISE EXCEPTION 'Lead is sample, closed or unavailable'; END IF;
 IF EXISTS(SELECT 1 FROM public.outbound_messages WHERE lead_id=p_lead) THEN RAISE EXCEPTION 'Existing send found: use channel retry from Sent history'; END IF;
 IF lower(trim(p_to))<>lower(coalesce(l.customer_email,'')) OR p_subject<>l.reply_subject OR p_body<>l.reply_body OR length(trim(p_body))<20 OR length(p_body)>10000 OR length(p_subject)>300 OR length(trim(p_subject))=0 OR length(p_sms)>480 THEN RAISE EXCEPTION 'Save and review the current draft first'; END IF;
 IF p_mobile IS NOT NULL AND p_mobile !~ '^\+447[1-5789][0-9]{8}$' THEN RAISE EXCEPTION 'Not a UK mobile'; END IF;
 INSERT INTO public.outbound_messages(lead_id,idempotency_key,to_email,subject,body,sms_body,price_summary,status,approved_by,email_channel,email_delivery_status,sms_status,sms_to)
 VALUES(p_lead,p_key,trim(p_to),p_subject,p_body,p_sms,l.estimate->>'summary','sending',auth.uid(),'gmail','pending',CASE WHEN p_mobile IS NULL THEN 'skipped' ELSE 'pending' END,p_mobile) RETURNING id INTO o;
 INSERT INTO public.outbound_channels(outbound_id,channel,recipient,body,status) VALUES(o,'gmail',trim(p_to),p_body,'pending'),(o,'sms',p_mobile,p_sms,CASE WHEN p_mobile IS NULL THEN 'skipped' ELSE 'pending' END);
 INSERT INTO public.audit_logs(actor,action,lead_id,detail) VALUES('owner','quote_approved',p_lead,jsonb_build_object('outbound_id',o));
 RETURN o;
END $$;
REVOKE ALL ON FUNCTION public.approve_quote(uuid,text,text,text,text,text,boolean,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.approve_quote(uuid,text,text,text,text,text,boolean,text) TO authenticated;
CREATE OR REPLACE FUNCTION public.apply_sms_delivery(p_channel uuid,p_attempt uuid,p_sid text,p_status text,p_error text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c public.outbound_channels; target text;
BEGIN
 SELECT * INTO c FROM public.outbound_channels WHERE id=p_channel AND channel='sms' AND attempt_token=p_attempt FOR UPDATE;
 IF c.id IS NULL OR (c.provider_id IS NOT NULL AND c.provider_id<>p_sid) THEN RETURN false; END IF;
 target:=CASE WHEN p_status IN ('delivered','read') THEN 'delivered' WHEN p_status IN ('failed','undelivered','canceled') THEN 'failed' WHEN p_status='sent' THEN 'sent' ELSE 'sending' END;
 IF c.status='delivered' OR (c.status='failed' AND target<>'delivered') OR (c.status='sent' AND target='sending') THEN RETURN true; END IF;
 UPDATE public.outbound_channels SET status=target,provider_id=p_sid,error=p_error,updated_at=now() WHERE id=c.id;
 UPDATE public.outbound_messages SET sms_status=target,sms_provider_id=p_sid,sms_error=p_error,sms_updated_at=now() WHERE id=c.outbound_id;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.apply_sms_delivery(uuid,uuid,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.apply_sms_delivery(uuid,uuid,text,text,text) TO service_role;