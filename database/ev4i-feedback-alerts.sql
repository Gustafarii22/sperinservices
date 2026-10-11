-- No existing feedback is backfilled. Alerts start with new INSERTs after activation.
create schema if not exists ev4i_feedback_private;
revoke all on schema ev4i_feedback_private from public, anon, authenticated;
create table if not exists ev4i_feedback_private.settings (
 singleton boolean primary key default true check(singleton), enabled boolean not null default false,
 endpoint text not null default 'https://sperinservices.co.uk/api/ev4i-feedback'
);
insert into ev4i_feedback_private.settings(singleton) values(true) on conflict do nothing;
create table if not exists ev4i_feedback_private.alerts (
 id uuid primary key default gen_random_uuid(), feedback_table text not null check(feedback_table in ('app_feedback','assistant_feedback')),
 feedback_id uuid not null, payload jsonb not null, access_token text not null,
 expires_at timestamptz not null default now()+interval '90 days',
 status text not null default 'queued' check(status in ('queued','sending','sent','failed')),
 attempts integer not null default 0, next_attempt_at timestamptz not null default now(),
 requested_at timestamptz, request_id bigint, claimed_at timestamptz, sent_at timestamptz,
 email_id uuid, last_error text, resolved_at timestamptz, resolution_note text,
 created_at timestamptz not null default now(), unique(feedback_table,feedback_id)
);
alter table ev4i_feedback_private.settings enable row level security;
alter table ev4i_feedback_private.alerts enable row level security;
revoke all on all tables in schema ev4i_feedback_private from public,anon,authenticated;
create index if not exists ev4i_feedback_pending_idx on ev4i_feedback_private.alerts(next_attempt_at) where status<>'sent';

create or replace function ev4i_feedback_private.dispatch(p_id uuid default null) returns integer
language plpgsql security definer set search_path='' as $$
declare cfg ev4i_feedback_private.settings; item record; secret text; request bigint; count_sent integer:=0;
begin
 select * into cfg from ev4i_feedback_private.settings where singleton;
 if not cfg.enabled then return 0; end if;
 select decrypted_secret into secret from vault.decrypted_secrets where name='ev4i_feedback_relay_secret';
 if secret is null then return 0; end if;
 for item in select id from ev4i_feedback_private.alerts
  where status<>'sent' and attempts<10 and created_at>now()-interval '23 hours'
   and next_attempt_at<=now() and (status<>'sending' or claimed_at<now()-interval '2 minutes')
   and (p_id is null or id=p_id) order by created_at limit 10 for update skip locked
 loop
  begin
   request:=net.http_post(url:=cfg.endpoint,headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||secret),body:=jsonb_build_object('action','notify','id',item.id),timeout_milliseconds:=30000);
   update ev4i_feedback_private.alerts set request_id=request,requested_at=now(),next_attempt_at=now()+interval '2 minutes' where id=item.id;
   count_sent:=count_sent+1;
  exception when others then
   update ev4i_feedback_private.alerts set last_error='Dispatch scheduling failed',next_attempt_at=now()+interval '2 minutes' where id=item.id;
  end;
 end loop;
 return count_sent;
end $$;
revoke all on function ev4i_feedback_private.dispatch(uuid) from public,anon,authenticated;

create or replace function ev4i_feedback_private.enqueue() returns trigger
language plpgsql security definer set search_path='' as $$
declare p jsonb; uid uuid; contact text; alert_id uuid;
begin
 if not (select enabled from ev4i_feedback_private.settings where singleton) then return new; end if;
 p:=to_jsonb(new); uid:=(p->>'owner_id')::uuid;
 select email into contact from auth.users where id=uid;
 -- Bounded snapshot, restricted to feedback fields; no customer/job record is copied.
 if tg_table_name='app_feedback' then
  p:=jsonb_build_object('category',left(p->>'category',50),'message',left(p->>'message',20000),'route',left(p->>'route',500),'app_version',left(p->>'app_version',100),'created_at',p->>'created_at','reporter_email',contact);
 else
  p:=jsonb_build_object('helpful',p->'helpful','question',left(p->>'question',10000),'answer_summary',left(p->>'answer_summary',15000),'issue',left(p->>'issue',2000),'route',coalesce(p->>'route','/assistant'),'app_version',p->>'app_version','created_at',p->>'created_at','reporter_email',contact);
 end if;
 insert into ev4i_feedback_private.alerts(feedback_table,feedback_id,payload,access_token)
 values(tg_table_name,new.id,p,encode(extensions.gen_random_bytes(32),'hex')) on conflict do nothing returning id into alert_id;
 if alert_id is not null then perform ev4i_feedback_private.dispatch(alert_id); end if;
 return new;
end $$;
revoke all on function ev4i_feedback_private.enqueue() from public,anon,authenticated;
drop trigger if exists ev4i_feedback_notify on public.app_feedback;
create trigger ev4i_feedback_notify after insert on public.app_feedback for each row execute function ev4i_feedback_private.enqueue();
drop trigger if exists ev4i_feedback_notify on public.assistant_feedback;
create trigger ev4i_feedback_notify after insert on public.assistant_feedback for each row execute function ev4i_feedback_private.enqueue();

-- Explicit capability authentication: only the server-held random relay secret can claim or finish email work.
create or replace function public.ev4i_feedback_relay(p_secret text,p_id uuid,p_action text,p_result jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare expected text; row ev4i_feedback_private.alerts;
begin
 select decrypted_secret into expected from vault.decrypted_secrets where name='ev4i_feedback_relay_secret';
 if expected is null or p_secret is null or length(p_secret)<>64 or p_secret<>expected then raise exception 'Unauthorized' using errcode='42501'; end if;
 if p_action='claim' then
  select * into row from ev4i_feedback_private.alerts where id=p_id for update;
  if not found or row.status='sent' or row.attempts>=10 or row.created_at<now()-interval '23 hours' or (row.status='sending' and row.claimed_at>now()-interval '2 minutes') then return null; end if;
  update ev4i_feedback_private.alerts set status='sending',claimed_at=now(),attempts=attempts+1,next_attempt_at=now()+interval '2 minutes' where id=p_id;
  return jsonb_build_object('id',row.id,'feedback_table',row.feedback_table,'payload',row.payload,'access_token',row.access_token);
 elsif p_action='sent' then
  update ev4i_feedback_private.alerts set status='sent',sent_at=now(),email_id=(p_result->>'email_id')::uuid,last_error=null where id=p_id and status='sending';
 elsif p_action='failed' then
  update ev4i_feedback_private.alerts set status='failed',last_error=left(p_result->>'error',300),next_attempt_at=now()+interval '5 minutes' where id=p_id and status='sending';
 else raise exception 'Invalid action'; end if;
 return jsonb_build_object('ok',true);
end $$;
revoke all on function public.ev4i_feedback_relay(text,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.ev4i_feedback_relay(text,uuid,text,jsonb) to anon;

-- Each private email link authorizes this single feedback item, never arbitrary table access.
create or replace function public.ev4i_feedback_owner_action(p_id uuid,p_token text,p_action text default 'view',p_note text default '') returns jsonb
language plpgsql security definer set search_path='' as $$
declare row ev4i_feedback_private.alerts;
begin
 if p_token is null or p_token !~ '^[0-9a-f]{64}$' then return null; end if;
 select * into row from ev4i_feedback_private.alerts where id=p_id and access_token=p_token and expires_at>now() for update;
 if not found then return null; end if;
 if p_action='resolve' then
  update ev4i_feedback_private.alerts set resolved_at=coalesce(resolved_at,now()),resolution_note=coalesce(resolution_note,left(p_note,2000)) where id=p_id returning * into row;
 elsif p_action<>'view' then raise exception 'Invalid action'; end if;
 return jsonb_build_object('id',row.id,'feedback_table',row.feedback_table,'payload',row.payload,'resolved_at',row.resolved_at,'resolution_note',row.resolution_note);
end $$;
revoke all on function public.ev4i_feedback_owner_action(uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.ev4i_feedback_owner_action(uuid,text,text,text) to anon;

-- Delete a copied snapshot when its source is deleted (including account deletion cascades).
create or replace function ev4i_feedback_private.remove_snapshot() returns trigger language plpgsql security definer set search_path='' as $$
begin delete from ev4i_feedback_private.alerts where feedback_table=tg_table_name and feedback_id=old.id; return old; end $$;
revoke all on function ev4i_feedback_private.remove_snapshot() from public,anon,authenticated;
drop trigger if exists ev4i_feedback_remove on public.app_feedback;
create trigger ev4i_feedback_remove after delete on public.app_feedback for each row execute function ev4i_feedback_private.remove_snapshot();
drop trigger if exists ev4i_feedback_remove on public.assistant_feedback;
create trigger ev4i_feedback_remove after delete on public.assistant_feedback for each row execute function ev4i_feedback_private.remove_snapshot();
