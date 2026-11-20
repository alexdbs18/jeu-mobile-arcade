create or replace function public.start_game_attempt(
  p_season_day_id uuid,p_kind text,p_multiplier boolean default false
) returns table(attempt_id uuid,attempt_number smallint,attempt_limit smallint)
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid()); v_day public.season_days%rowtype; v_season uuid; v_league uuid;
  v_used integer; v_allowed integer := 2; v_number smallint; v_id uuid := extensions.gen_random_uuid();
  v_double_claim uuid; v_day4_claim uuid;
begin
  if v_user is null then raise exception 'Authentication required' using errcode='28000'; end if;
  select d.* into v_day from public.season_days d where d.id=p_season_day_id for update;
  if v_day.id is null or v_day.game_id is null then raise exception 'Daily challenge is not available'; end if;
  select s.id,s.league_id into v_season,v_league from public.seasons s where s.id=v_day.season_id and s.status in ('scheduled','active');
  if v_season is null or not public.is_league_member(v_league) then raise exception 'Active league membership required'; end if;
  if now()<v_day.starts_at or now()>=v_day.ends_at then raise exception 'Daily challenge is outside its 24-hour window'; end if;
  if p_kind='practice' then
    if exists(select 1 from public.game_attempts a where a.season_day_id=p_season_day_id and a.user_id=v_user and a.attempt_kind='practice') then raise exception 'Practice attempt already used'; end if;
    insert into public.game_attempts(id,season_day_id,user_id,attempt_kind)
      values(v_id,p_season_day_id,v_user,'practice');
    return query select v_id,null::smallint,0::smallint; return;
  elsif p_kind<>'official' then raise exception 'Invalid attempt kind'; end if;

  if exists(select 1 from public.profiles where id=v_user and day4_reward_available) then
    insert into public.reward_claims(user_id,season_id,reward_type,source)
      values(v_user,v_season,'day4_streak','streak') on conflict do nothing returning id into v_day4_claim;
    if v_day4_claim is not null then
      update public.profiles set day4_reward_available=false where id=v_user;
    end if;
  end if;
  select count(*) into v_used from public.game_attempts a
    where a.season_day_id=p_season_day_id and a.user_id=v_user and a.attempt_kind='official';
  if exists(select 1 from public.reward_claims r where r.user_id=v_user and r.season_id=v_season and r.reward_type='daily_extra_attempt' and r.season_day_id=p_season_day_id) then v_allowed:=v_allowed+1; end if;
  if exists(select 1 from public.reward_claims r where r.user_id=v_user and r.season_id=v_season and r.reward_type='extra_attempt') then v_allowed:=v_allowed+1; end if;
  if exists(select 1 from public.reward_claims r where r.user_id=v_user and r.season_id=v_season and r.reward_type='day4_streak') then v_allowed:=v_allowed+1; end if;
  if v_used>=v_allowed then raise exception 'No official attempts remain'; end if;
  v_number:=v_used+1;
  if p_multiplier then
    select id into v_double_claim from public.reward_claims r where r.user_id=v_user and r.season_id=v_season
      and r.reward_type='double_points' and r.source='rewarded_ad' and r.used_at is null for update;
    if v_double_claim is null then raise exception 'The double-points reward is unavailable'; end if;
  end if;
  insert into public.game_attempts(id,season_day_id,user_id,attempt_kind,attempt_number,multiplier_claim_id)
    values(v_id,p_season_day_id,v_user,'official',v_number,v_double_claim);
  if v_double_claim is not null then update public.reward_claims set used_at=now(),used_on_attempt_id=v_id where id=v_double_claim; end if;
  return query select v_id,v_number::smallint,v_allowed::smallint;
end $$;
revoke all on function public.start_game_attempt(uuid,text,boolean) from public,anon;
grant execute on function public.start_game_attempt(uuid,text,boolean) to authenticated;

create or replace function public.set_verified_attempt_result(
  p_attempt_id uuid,p_score_value numeric,p_duration_ms integer,p_raw_score jsonb
) returns void language plpgsql security definer set search_path = '' as $$
declare v_started_at timestamptz; v_duration_ms integer;
begin
  if (select auth.role())<>'service_role' then raise exception 'Verified game service required' using errcode='42501'; end if;
  if p_score_value<0 or p_score_value>100 or p_duration_ms<0 or p_duration_ms>86400000 then raise exception 'Invalid game result'; end if;
  select a.started_at into v_started_at from public.game_attempts a
    where a.id=p_attempt_id and a.submitted_at is null for update;
  if v_started_at is null then raise exception 'Attempt is missing or already submitted'; end if;
  v_duration_ms:=greatest(1,floor(extract(epoch from (now()-v_started_at))*1000)::integer);
  if v_duration_ms>180000 then raise exception 'Attempt duration is outside the allowed range'; end if;
  update public.game_attempts a set raw_score=p_raw_score,score_value=p_score_value,duration_ms=v_duration_ms,
    submitted_at=now(),verified=true where a.id=p_attempt_id
      and exists(select 1 from public.season_days d where d.id=a.season_day_id and now()<d.ends_at);
  if not found then raise exception 'Daily challenge has closed'; end if;
end $$;
revoke all on function public.set_verified_attempt_result(uuid,numeric,integer,jsonb) from public,anon,authenticated;
grant execute on function public.set_verified_attempt_result(uuid,numeric,integer,jsonb) to service_role;

create or replace function public.finalize_daily_challenge(p_season_day_id uuid)
returns integer language plpgsql security definer set search_path = '' as $$
declare v_day public.season_days%rowtype; v_count integer;
begin
  if (select auth.role())<>'service_role' then raise exception 'Server role required' using errcode='42501'; end if;
  select * into v_day from public.season_days where id=p_season_day_id for update;
  if v_day.id is null or now()<v_day.ends_at then raise exception 'Daily challenge is not ready to finalize'; end if;
  with best as (
    select distinct on (a.user_id) a.user_id,a.id as attempt_id,a.score_value,a.duration_ms,a.multiplier_claim_id
    from public.game_attempts a where a.season_day_id=p_season_day_id and a.attempt_kind='official' and a.verified
    order by a.user_id,a.score_value desc,a.duration_ms asc,a.submitted_at asc
  ), ranked as (
    select b.*,rank() over(order by score_value desc,duration_ms asc) as place,
      count(*) over()::integer as total,count(*) over(partition by score_value,duration_ms)::integer as tied
    from best b
  ), scored as (
    select r.*,case when total=1 then 100 else round(avg(round(10+90.0*(total-positions.position)/(total-1))))::integer end base_points
    from ranked r cross join lateral generate_series(r.place,r.place+r.tied-1) as positions(position)
    group by r.user_id,r.attempt_id,r.score_value,r.duration_ms,r.multiplier_claim_id,r.place,r.total,r.tied
  ), final_scores as (
    select user_id,attempt_id,place,
      (base_points*case when multiplier_claim_id is null then 1 else 2 end)::integer points,
      case when multiplier_claim_id is null then 1 else 2 end::smallint multiplier
    from scored
  )
  insert into public.daily_results(season_day_id,user_id,best_attempt_id,rank,points,multiplier)
  select p_season_day_id,user_id,attempt_id,place::integer,points,multiplier from final_scores
  on conflict(season_day_id,user_id) do update set best_attempt_id=excluded.best_attempt_id,
    rank=excluded.rank,points=excluded.points,multiplier=excluded.multiplier,computed_at=now();

  insert into public.season_totals(season_id,user_id,points,wins,podiums,games_played)
  select v_day.season_id,m.user_id,coalesce(sum(r.points),0)::integer,
    count(r.user_id) filter(where r.rank=1)::integer,count(r.user_id) filter(where r.rank<=3)::integer,count(r.user_id)::integer
  from public.seasons s join public.league_members m on m.league_id=s.league_id and m.joined_at<=s.starts_at
  left join public.season_days d on d.season_id=s.id
  left join public.daily_results r on r.season_day_id=d.id and r.user_id=m.user_id
  where s.id=v_day.season_id group by m.user_id
  on conflict(season_id,user_id) do update set points=excluded.points,wins=excluded.wins,
    podiums=excluded.podiums,games_played=excluded.games_played,updated_at=now();
  update public.profiles p set
    lifetime_wins=x.wins,lifetime_podiums=x.podiums,lifetime_games=x.games
  from (select user_id,count(*) filter(where rank=1)::integer wins,
      count(*) filter(where rank<=3)::integer podiums,count(*)::integer games
    from public.daily_results group by user_id) x where p.id=x.user_id;
  select count(*) into v_count from public.daily_results where season_day_id=p_season_day_id;
  return v_count;
end $$;
revoke all on function public.finalize_daily_challenge(uuid) from public,anon,authenticated;
grant execute on function public.finalize_daily_challenge(uuid) to service_role;

drop function public.record_day_open();
create or replace function public.record_day_open()
returns table(current_streak integer,best_streak integer,recorded_date date,day4_reward boolean)
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid()); v_zone text; v_today date; v_last date;
  v_current integer; v_best integer; v_inserted date; v_claimed boolean := false; v_updated integer;
begin
  if v_user is null then raise exception 'Authentication required' using errcode='28000'; end if;
  select timezone into v_zone from public.profiles where id=v_user;
  if v_zone is null then raise exception 'Profile not found'; end if;
  v_today:=(now() at time zone v_zone)::date;
  insert into public.streak_events(user_id,local_date,timezone,source) values(v_user,v_today,v_zone,'app_open')
    on conflict(user_id,local_date) do nothing returning local_date into v_inserted;
  select p.current_streak,p.best_streak into v_current,v_best from public.profiles p where p.id=v_user for update;
  if v_inserted is not null then
    select max(local_date) into v_last from public.streak_events where user_id=v_user and local_date<v_today;
    v_current:=case when v_last=v_today-1 then v_current+1 else 1 end;
    v_best:=greatest(v_best,v_current);
    update public.profiles set current_streak=v_current,best_streak=v_best where id=v_user;
  end if;
  if v_inserted is not null and v_current=4 then
    update public.profiles set day4_reward_available=true,day4_reward_granted_at=now()
      where id=v_user and day4_reward_granted_at is null and day4_reward_available=false;
    get diagnostics v_updated = row_count;
    v_claimed:=v_updated=1;
  end if;
  return query select v_current,v_best,v_today,v_claimed;
end $$;
revoke all on function public.record_day_open() from public,anon;
grant execute on function public.record_day_open() to authenticated;
