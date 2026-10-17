create table if not exists public.lw_analytics_admins(user_id uuid primary key references auth.users(id) on delete cascade,created_at timestamptz not null default now());
create table if not exists public.lw_visit_events(id uuid primary key,session_id uuid not null,path text not null,referrer_host text not null default '',device text not null check(device in ('mobile','desktop')),kind text not null check(kind in ('pageview','error')),error_code text check(error_code in ('runtime_error','unhandled_rejection')),created_at timestamptz not null default now());
create index if not exists lw_visit_created on public.lw_visit_events(created_at desc);
create index if not exists lw_visit_session on public.lw_visit_events(session_id,created_at desc);
alter table public.lw_analytics_admins enable row level security;
alter table public.lw_visit_events enable row level security;
revoke all on public.lw_analytics_admins,public.lw_visit_events from anon,authenticated;
grant all on public.lw_analytics_admins,public.lw_visit_events to service_role;
create or replace function public.lw_record_visit(p_id uuid,p_session uuid,p_path text,p_referrer text,p_device text,p_kind text default 'pageview',p_error text default null) returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if p_path is null or length(p_path)>180 or p_path !~ '^/lunaya-wellness/[A-Za-z0-9/_.-]*$' or p_path like '%admin.html%' or p_device not in ('mobile','desktop') or p_kind not in ('pageview','error') then return; end if;
 if p_kind='error' and (p_error is null or p_error not in ('runtime_error','unhandled_rejection')) then return; end if;
 if (select count(*) from public.lw_visit_events where session_id=p_session and created_at>now()-interval '1 day')>=200 then return; end if;
 insert into public.lw_visit_events(id,session_id,path,referrer_host,device,kind,error_code) values(p_id,p_session,p_path,case when coalesce(p_referrer,'') ~ '^[a-zA-Z0-9.-]{1,253}$' then lower(p_referrer) else '' end,p_device,p_kind,case when p_kind='error' then p_error else null end) on conflict(id) do nothing;
end $$;
revoke all on function public.lw_record_visit(uuid,uuid,text,text,text,text,text) from public;
grant execute on function public.lw_record_visit(uuid,uuid,text,text,text,text,text) to anon,authenticated;
create or replace function public.lw_analytics_report(p_days integer default 7) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare result jsonb; start_at timestamptz; today_at timestamptz;
begin
 if not exists(select 1 from public.lw_analytics_admins where user_id=auth.uid()) then raise exception 'Administrator access required' using errcode='42501'; end if;
 if p_days not in (7,30,90) then raise exception 'Invalid report period'; end if;
 today_at:=date_trunc('day',now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul';start_at:=today_at-(p_days-1)*interval '1 day';
 select jsonb_build_object('generatedAt',now(),'days',p_days,'totals',jsonb_build_object('views',count(*) filter(where kind='pageview'),'sessions',count(distinct session_id) filter(where kind='pageview'),'errors',count(*) filter(where kind='error'),'todayViews',count(*) filter(where kind='pageview' and created_at>=today_at)),'daily',(select coalesce(jsonb_agg(x order by x."day"),'[]'::jsonb) from(select to_char(d,'YYYY-MM-DD') as "day",(select count(*) from public.lw_visit_events e where e.kind='pageview' and (e.created_at at time zone 'Asia/Seoul')::date=d::date) views from generate_series((start_at at time zone 'Asia/Seoul')::date,(today_at at time zone 'Asia/Seoul')::date,interval '1 day') d)x),'pages',(select coalesce(jsonb_agg(x),'[]'::jsonb) from(select path,count(*) views from public.lw_visit_events where created_at>=start_at and kind='pageview' group by path order by views desc limit 20)x),'referrers',(select coalesce(jsonb_agg(x),'[]'::jsonb) from(select coalesce(nullif(referrer_host,''),'직접 방문 / 미확인') source,count(*) views from public.lw_visit_events where created_at>=start_at and kind='pageview' group by referrer_host order by views desc limit 10)x),'devices',(select coalesce(jsonb_agg(x),'[]'::jsonb) from(select device,count(*) views from public.lw_visit_events where created_at>=start_at and kind='pageview' group by device)x),'recent',(select coalesce(jsonb_agg(x),'[]'::jsonb) from(select created_at,path,referrer_host,device,kind,error_code from public.lw_visit_events where created_at>=start_at order by created_at desc limit 100)x),'crawlRuns',(select coalesce(jsonb_agg(x),'[]'::jsonb) from(select created_at,payload from public.lw_crawl_runs order by created_at desc limit 5)x)) into result from public.lw_visit_events where created_at>=start_at;
 return result;
end $$;
revoke all on function public.lw_analytics_report(integer) from public,anon;
grant execute on function public.lw_analytics_report(integer) to authenticated;
create or replace function public.lw_prune_visits() returns void language sql security definer set search_path=public,pg_temp as $$delete from public.lw_visit_events where created_at<now()-interval '90 days';$$;
revoke all on function public.lw_prune_visits() from public,anon,authenticated;
grant execute on function public.lw_prune_visits() to service_role;
