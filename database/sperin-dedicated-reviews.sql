-- Neon PostgreSQL: dedicated Sperin project only. Server-only access.
-- No public Data API policies: table owner is the private server connection.
create table public.sperin_reviews (
 id uuid primary key default gen_random_uuid(),
 request_id uuid not null unique,
 name text not null check (length(trim(name)) between 2 and 100),
 area text not null default '' check (length(area)<=100),
 service text not null check (length(trim(service)) between 2 and 100),
 rating integer not null check (rating between 1 and 5),
 text text not null check (trim(text) <> ''),
 consent boolean not null check (consent),
 status text not null default 'pending' check (status in ('pending','approved','rejected')),
 reply text not null default '' check (length(reply)<=2000),
 created_at timestamptz not null default now(),
 moderated_at timestamptz
);
create table public.sperin_review_private (
 review_id uuid primary key references public.sperin_reviews(id) on delete cascade,
 job_reference text not null default '' check (length(job_reference)<=100)
);
create table public.sperin_review_limits (
 fingerprint text primary key,
 window_start timestamptz not null default now(),
 attempts integer not null default 1
);
alter table public.sperin_reviews enable row level security;
alter table public.sperin_review_private enable row level security;
alter table public.sperin_review_limits enable row level security;
revoke all on public.sperin_reviews, public.sperin_review_private, public.sperin_review_limits from public;
create index sperin_reviews_status_created on public.sperin_reviews(status,created_at desc);
create function public.sperin_stamp_moderation() returns trigger language plpgsql security invoker set search_path='' as $$ begin new.moderated_at=now(); return new; end; $$;
revoke all on function public.sperin_stamp_moderation() from public;
create trigger sperin_moderation_stamp before update on public.sperin_reviews for each row execute function public.sperin_stamp_moderation();
-- Service-only atomic submission: request retry protection and durable rate limiting.
create function public.sperin_accept_review(payload jsonb, fingerprint text) returns uuid language plpgsql security invoker set search_path='' as $$
declare review_id uuid; count_attempts integer;
begin
 select id into review_id from public.sperin_reviews where request_id=(payload->>'request_id')::uuid;
 if found then return review_id; end if;
 insert into public.sperin_review_limits as limits(fingerprint) values(fingerprint)
 on conflict on constraint sperin_review_limits_pkey do update set attempts=case when limits.window_start < now()-interval '1 hour' then 1 else limits.attempts+1 end, window_start=case when limits.window_start < now()-interval '1 hour' then now() else limits.window_start end returning attempts into count_attempts;
 if count_attempts>5 then raise exception 'Too many submissions. Please try again later.'; end if;
 insert into public.sperin_reviews(request_id,name,area,service,rating,text,consent)
 values((payload->>'request_id')::uuid,payload->>'name',coalesce(payload->>'area',''),payload->>'service',(payload->>'rating')::integer,payload->>'text',(payload->>'consent')::boolean)
 on conflict(request_id) do nothing returning id into review_id;
 if review_id is null then select id into review_id from public.sperin_reviews where request_id=(payload->>'request_id')::uuid; return review_id; end if;
 insert into public.sperin_review_private(review_id,job_reference) values(review_id,coalesce(payload->>'job_reference',''));
 delete from public.sperin_review_limits where window_start < now()-interval '2 days';
 return review_id;
end; $$;
revoke all on function public.sperin_accept_review(jsonb,text) from public;
-- Notification delivery is durable and independent of customer submission success.
create table public.sperin_review_notifications (
 review_id uuid primary key references public.sperin_reviews(id),
 created_at timestamptz not null default now(),
 claimed_until timestamptz,
 attempts integer not null default 0,
 sent_at timestamptz,
 provider_id text
);
create table public.sperin_auth_limits (
 fingerprint text primary key,
 window_start timestamptz not null default now(),
 attempts integer not null default 1
);
alter table public.sperin_review_notifications enable row level security;
alter table public.sperin_auth_limits enable row level security;
revoke all on public.sperin_review_notifications,public.sperin_auth_limits from public;
create function public.sperin_queue_notification() returns trigger language plpgsql security invoker set search_path='' as $$
begin insert into public.sperin_review_notifications(review_id) values(new.id); return new; end; $$;
create trigger sperin_queue_notification after insert on public.sperin_reviews for each row execute function public.sperin_queue_notification();
create function public.sperin_claim_notification(review_id uuid) returns boolean language plpgsql security invoker set search_path='' as $$
declare claimed uuid; begin
 update public.sperin_review_notifications n set claimed_until=now()+interval '2 minutes',attempts=attempts+1
 where n.review_id=$1 and sent_at is null and (claimed_until is null or claimed_until<now()) returning n.review_id into claimed;
 return claimed is not null; end; $$;
create function public.sperin_finish_notification(review_id uuid,provider_id text) returns void language sql security invoker set search_path='' as $$
 update public.sperin_review_notifications n set sent_at=now(),provider_id=$2,claimed_until=null where n.review_id=$1;
$$;
create function public.sperin_release_notification(review_id uuid) returns void language sql security invoker set search_path='' as $$
 update public.sperin_review_notifications n set claimed_until=now()+interval '5 minutes' where n.review_id=$1 and sent_at is null;
$$;
create function public.sperin_auth_attempt(fingerprint text,max_attempts integer) returns boolean language plpgsql security invoker set search_path='' as $$
declare counted integer; begin
 insert into public.sperin_auth_limits as l(fingerprint) values($1)
 on conflict on constraint sperin_auth_limits_pkey do update set
 attempts=case when l.window_start<now()-interval '15 minutes' then 1 else l.attempts+1 end,
 window_start=case when l.window_start<now()-interval '15 minutes' then now() else l.window_start end returning attempts into counted;
 delete from public.sperin_auth_limits where window_start<now()-interval '1 day';
 return counted <= max_attempts; end; $$;
revoke all on function public.sperin_queue_notification(),public.sperin_claim_notification(uuid),public.sperin_finish_notification(uuid,text),public.sperin_release_notification(uuid),public.sperin_auth_attempt(text,integer) from public;
revoke all on public.sperin_reviews,public.sperin_review_private,public.sperin_review_limits,public.sperin_review_notifications,public.sperin_auth_limits from public;
