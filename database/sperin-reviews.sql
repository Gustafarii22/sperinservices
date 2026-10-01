-- Isolated Sperin tables. No EV Installer tables or auth settings are modified.
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
revoke all on public.sperin_reviews, public.sperin_review_private, public.sperin_review_limits from anon, authenticated;
grant select(id,name,area,service,rating,text,status,reply,created_at,moderated_at) on public.sperin_reviews to anon, authenticated;
grant update(status,reply) on public.sperin_reviews to authenticated;
grant select on public.sperin_review_private to authenticated;
grant all on public.sperin_reviews,public.sperin_review_private,public.sperin_review_limits to service_role;
create policy sperin_public_approved on public.sperin_reviews for select to anon, authenticated using(status='approved');
create policy sperin_owner_read on public.sperin_reviews for select to authenticated using((select auth.uid())='7319fcef-63e7-4761-9174-179ecabba17e'::uuid);
create policy sperin_owner_update on public.sperin_reviews for update to authenticated using((select auth.uid())='7319fcef-63e7-4761-9174-179ecabba17e'::uuid) with check((select auth.uid())='7319fcef-63e7-4761-9174-179ecabba17e'::uuid);
create policy sperin_owner_private on public.sperin_review_private for select to authenticated using((select auth.uid())='7319fcef-63e7-4761-9174-179ecabba17e'::uuid);
create index sperin_reviews_status_created on public.sperin_reviews(status,created_at desc);
create function public.sperin_stamp_moderation() returns trigger language plpgsql security invoker set search_path='' as $$ begin new.moderated_at=now(); return new; end; $$;
revoke all on function public.sperin_stamp_moderation() from public,anon,authenticated;
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
revoke all on function public.sperin_accept_review(jsonb,text) from public,anon,authenticated;
grant execute on function public.sperin_accept_review(jsonb,text) to service_role;
