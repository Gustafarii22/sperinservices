CREATE OR REPLACE FUNCTION public.approve_quote(p_lead uuid,p_to text,p_subject text,p_body text,p_sms text,p_mobile text,p_confirmed boolean,p_key text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE l public.leads; o uuid;
BEGIN
 IF NOT public.is_owner() OR NOT p_confirmed THEN RAISE EXCEPTION 'Owner approval required'; END IF;
 p_mobile:=nullif(p_mobile,'');
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