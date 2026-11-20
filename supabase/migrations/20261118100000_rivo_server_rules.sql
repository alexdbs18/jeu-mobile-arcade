alter table public.leagues add constraint leagues_launch_time_check
  check (launch_time in ('09:00','14:00','18:00'));
alter table public.reward_claims drop constraint reward_claims_user_id_season_id_reward_type_key;
alter table public.reward_claims drop constraint reward_claims_reward_type_check;
alter table public.reward_claims add constraint reward_claims_reward_type_check
  check (reward_type in ('extra_attempt','daily_extra_attempt','double_points','day4_streak','sticker'));
alter table public.reward_claims add column season_day_id uuid references public.season_days(id) on delete cascade;
alter table public.reward_claims add column used_at timestamptz;
alter table public.reward_claims add column used_on_attempt_id uuid;
create unique index reward_claims_season_once on public.reward_claims(user_id,season_id,reward_type)
  where reward_type in ('extra_attempt','double_points','day4_streak');
create unique index reward_claims_day4_once_per_user on public.reward_claims(user_id,reward_type)
  where reward_type='day4_streak';
create unique index reward_claims_day_once on public.reward_claims(user_id,season_day_id,reward_type)
  where season_day_id is not null;
create unique index game_attempts_one_practice_per_day on public.game_attempts(season_day_id,user_id)
  where attempt_kind='practice';
alter table public.game_attempts add column multiplier_claim_id uuid references public.reward_claims(id);
alter table public.reward_claims add constraint reward_claims_used_attempt_fk
  foreign key(used_on_attempt_id) references public.game_attempts(id);

create or replace function public.create_league(p_name text, p_timezone text, p_launch_time time)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_user uuid := (select auth.uid()); v_id uuid;
begin
  if v_user is null then raise exception 'Authentication required' using errcode='28000'; end if;
  if not exists(select 1 from public.profiles where id=v_user) then raise exception 'Profile is required'; end if;
  if char_length(trim(p_name)) not between 1 and 40 then raise exception 'League name must contain 1 to 40 characters'; end if;
  if p_launch_time not in ('09:00','14:00','18:00') then raise exception 'Launch time must be 09:00, 14:00 or 18:00'; end if;
  if not exists(select 1 from pg_catalog.pg_timezone_names z where z.name=p_timezone) then raise exception 'Invalid IANA timezone'; end if;
  insert into public.leagues(name,owner_id,timezone,launch_time)
    values(trim(p_name),v_user,p_timezone,p_launch_time) returning id into v_id;
  insert into public.league_members(league_id,user_id) values(v_id,v_user);
  return v_id;
end $$;
revoke all on function public.create_league(text,text,time) from public, anon;
grant execute on function public.create_league(text,text,time) to authenticated;

create or replace function public.join_league(p_invite_code text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_user uuid := (select auth.uid()); v_id uuid;
begin
  if v_user is null then raise exception 'Authentication required' using errcode='28000'; end if;
  select id into v_id from public.leagues where invite_code=upper(trim(p_invite_code));
  if v_id is null then raise exception 'Invitation code not found'; end if;
  insert into public.league_members(league_id,user_id) values(v_id,v_user) on conflict do nothing;
  return v_id;
end $$;
revoke all on function public.join_league(text) from public, anon;
grant execute on function public.join_league(text) to authenticated;

create or replace function public.create_season(p_league_id uuid, p_first_local_day date)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid()); v_league public.leagues%rowtype; v_season uuid;
  v_start timestamptz; v_games text[]; v_candidates text[]; v_open1 smallint; v_open2 smallint;
  v_vote1 uuid := extensions.gen_random_uuid(); v_vote2 uuid := extensions.gen_random_uuid();
  v_target1 smallint; v_target2 smallint; v_game_idx integer := 1; v_day smallint;
begin
  if v_user is null then raise exception 'Authentication required' using errcode='28000'; end if;
  select * into v_league from public.leagues where id=p_league_id for update;
  if v_league.id is null or v_league.owner_id<>v_user then raise exception 'Only the league owner can start a season'; end if;
  if not exists(select 1 from pg_catalog.pg_timezone_names z where z.name=v_league.timezone) then raise exception 'Invalid league timezone'; end if;
  if exists(select 1 from public.seasons where league_id=p_league_id and status in ('scheduled','active')) then raise exception 'A season is already open'; end if;
  select array_agg(id order by extensions.gen_random_uuid()) into v_games
    from (select id from public.game_catalog where playable order by extensions.gen_random_uuid() limit 12) g;
  if coalesce(cardinality(v_games),0)<12 then
    raise exception 'A complete season with two votes requires at least 12 distinct playable mini-games; only % are configured',coalesce(cardinality(v_games),0);
  end if;
  v_start := (p_first_local_day::timestamp + v_league.launch_time) at time zone v_league.timezone;
  if v_start < now() then raise exception 'The first daily challenge must start in the future'; end if;
  select first_day.day_number,second_day.day_number into v_open1,v_open2
    from generate_series(4,8) as first_day(day_number)
    cross join generate_series(4,8) as second_day(day_number)
    where second_day.day_number-first_day.day_number>=3
    order by extensions.gen_random_uuid() limit 1;
  v_target1:=v_open1+1; v_target2:=v_open2+1;
  select array_agg(candidate order by shuffle) into v_candidates from (
    select id as candidate,extensions.gen_random_uuid() as shuffle
    from unnest(v_games[9:12]) as available(id)
    order by shuffle limit 3
  ) selected;
  insert into public.seasons(league_id,number,starts_at,ends_at,timezone,status)
    values(p_league_id,(select coalesce(max(number),0)+1 from public.seasons where league_id=p_league_id),
      v_start,v_start+interval '240 hours',v_league.timezone,'scheduled') returning id into v_season;
  insert into public.votes(id,season_id,vote_number,target_day_number,opens_at,closes_at,candidate_game_ids)
    values
      (v_vote1,v_season,1,v_target1,v_start+(v_open1-1)*interval '24 hours',v_start+v_open1*interval '24 hours',v_candidates),
      (v_vote2,v_season,2,v_target2,v_start+(v_open2-1)*interval '24 hours',v_start+v_open2*interval '24 hours',null);
  for v_day in 1..10 loop
    if v_day=v_target1 then
      insert into public.season_days(season_id,day_number,vote_id,starts_at,ends_at)
        values(v_season,v_day,v_vote1,v_start+(v_day-1)*interval '24 hours',v_start+v_day*interval '24 hours');
    elsif v_day=v_target2 then
      insert into public.season_days(season_id,day_number,vote_id,starts_at,ends_at)
        values(v_season,v_day,v_vote2,v_start+(v_day-1)*interval '24 hours',v_start+v_day*interval '24 hours');
    else
      insert into public.season_days(season_id,day_number,game_id,starts_at,ends_at)
        values(v_season,v_day,v_games[v_game_idx],v_start+(v_day-1)*interval '24 hours',v_start+v_day*interval '24 hours');
      v_game_idx:=v_game_idx+1;
    end if;
  end loop;
  insert into public.season_totals(season_id,user_id)
    select v_season,user_id from public.league_members where league_id=p_league_id and joined_at<=v_start
    on conflict(season_id,user_id) do nothing;
  return v_season;
end $$;
revoke all on function public.create_season(uuid,date) from public, anon;
grant execute on function public.create_season(uuid,date) to authenticated;

create or replace function public.open_vote(p_vote_id uuid)
returns table(vote_id uuid, closes_at timestamptz, candidates jsonb)
language plpgsql security definer set search_path = '' as $$
declare v_vote public.votes%rowtype; v_season uuid; v_candidates text[];
begin
  select v.* into v_vote from public.votes v where v.id=p_vote_id for update;
  if v_vote.id is null or not public.is_league_member((select s.league_id from public.seasons s where s.id=v_vote.season_id)) then raise exception 'Vote not found'; end if;
  if now()<v_vote.opens_at or now()>=v_vote.closes_at then raise exception 'Vote is not open'; end if;
  if v_vote.candidate_game_ids is null then
    select array_agg(id order by extensions.gen_random_uuid()) into v_candidates from (
      select g.id from public.game_catalog g where g.playable
        and not exists(select 1 from public.season_days d where d.season_id=v_vote.season_id and d.game_id=g.id)
      order by extensions.gen_random_uuid() limit 3) eligible;
    if coalesce(cardinality(v_candidates),0)<>3 then raise exception 'Fewer than three distinct unplayed games are available for this vote'; end if;
    update public.votes set candidate_game_ids=v_candidates where id=p_vote_id returning * into v_vote;
  end if;
  return query select v_vote.id,v_vote.closes_at,
    (select jsonb_agg(jsonb_build_object('id',g.id,'name',g.name,'description',g.description,'illustration_path',g.illustration_path) order by array_position(v_vote.candidate_game_ids,g.id))
      from public.game_catalog g where g.id=any(v_vote.candidate_game_ids));
end $$;
revoke all on function public.open_vote(uuid) from public, anon;
grant execute on function public.open_vote(uuid) to authenticated;

create or replace function public.cast_vote(p_vote_id uuid,p_game_id text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_user uuid := (select auth.uid()); v_vote public.votes%rowtype;
begin
  if v_user is null then raise exception 'Authentication required' using errcode='28000'; end if;
  select * into v_vote from public.votes where id=p_vote_id for update;
  if v_vote.id is null or not public.is_league_member((select s.league_id from public.seasons s where s.id=v_vote.season_id)) then raise exception 'Vote not found'; end if;
  if now()<v_vote.opens_at or now()>=v_vote.closes_at then raise exception 'Vote is closed'; end if;
  if v_vote.candidate_game_ids is null or not p_game_id=any(v_vote.candidate_game_ids) then raise exception 'Choose one of the three proposed games'; end if;
  insert into public.vote_ballots(vote_id,user_id,game_id) values(p_vote_id,v_user,p_game_id)
    on conflict(vote_id,user_id) do update set game_id=excluded.game_id,created_at=now();
end $$;
revoke all on function public.cast_vote(uuid,text) from public, anon;
grant execute on function public.cast_vote(uuid,text) to authenticated;

create or replace function public.resolve_vote(p_vote_id uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare v_vote public.votes%rowtype; v_winner text; v_max integer; v_tied text[]; v_seed bigint;
begin
  if (select auth.role())<>'service_role' then raise exception 'Server role required' using errcode='42501'; end if;
  select * into v_vote from public.votes where id=p_vote_id for update;
  if v_vote.id is null then raise exception 'Vote not found'; end if;
  if now()<v_vote.closes_at then raise exception 'Vote has not closed'; end if;
  if v_vote.winner_game_id is not null then return v_vote.winner_game_id; end if;
  if v_vote.candidate_game_ids is null then raise exception 'Vote candidates have not been opened'; end if;
  select max(n) into v_max from (select count(b.user_id)::integer n from unnest(v_vote.candidate_game_ids) g(id)
    left join public.vote_ballots b on b.vote_id=v_vote.id and b.game_id=g.id group by g.id) tallies;
  select array_agg(g.id order by g.id) into v_tied from unnest(v_vote.candidate_game_ids) g(id)
    left join public.vote_ballots b on b.vote_id=v_vote.id and b.game_id=g.id group by g.id having count(b.user_id)=coalesce(v_max,0);
  v_seed:=('x'||substr(encode(extensions.gen_random_bytes(8),'hex'),1,16))::bit(64)::bigint;
  v_winner:=v_tied[mod(abs(v_seed::numeric),cardinality(v_tied))::integer+1];
  update public.votes set winner_game_id=v_winner,tie_break_seed=v_seed,resolved_at=now() where id=v_vote.id;
  update public.season_days set game_id=v_winner,vote_id=null
    where season_id=v_vote.season_id and day_number=v_vote.target_day_number and vote_id=v_vote.id;
  return v_winner;
end $$;
revoke all on function public.resolve_vote(uuid) from public, anon, authenticated;
grant execute on function public.resolve_vote(uuid) to service_role;

create or replace function public.record_day_open()
returns table(current_streak integer,best_streak integer,recorded_date date)
language plpgsql security definer set search_path = '' as $$
declare v_user uuid := (select auth.uid()); v_zone text; v_today date; v_last date; v_current integer; v_best integer; v_inserted date;
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
  return query select v_current,v_best,v_today;
end $$;
revoke all on function public.record_day_open() from public, anon;
grant execute on function public.record_day_open() to authenticated;

create or replace function public.post_league_message(p_league_id uuid,p_body text default null,p_sticker_id text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_user uuid := (select auth.uid()); v_message uuid;
begin
  if v_user is null or not public.is_league_member(p_league_id) then raise exception 'League membership required' using errcode='42501'; end if;
  if (p_body is null)=(p_sticker_id is null) then raise exception 'Send one text message or one sticker'; end if;
  if p_body is not null and char_length(trim(p_body)) not between 1 and 240 then raise exception 'Message must contain 1 to 240 characters'; end if;
  if p_sticker_id is not null and not exists(select 1 from public.user_stickers where user_id=v_user and sticker_id=p_sticker_id) then raise exception 'Sticker is not in this collection'; end if;
  insert into public.messages(league_id,user_id,body,sticker_id)
    values(p_league_id,v_user,nullif(trim(p_body),''),p_sticker_id) returning id into v_message;
  return v_message;
end $$;
revoke all on function public.post_league_message(uuid,text,text) from public, anon;
grant execute on function public.post_league_message(uuid,text,text) to authenticated;

create or replace function public.daily_leaderboard(p_season_day_id uuid)
returns table(user_id uuid,nickname text,country_code text,character_id text,rank integer,points integer)
language sql stable security definer set search_path = '' as $$
  select r.user_id,p.nickname,p.country_code,p.character_id,r.rank,r.points
  from public.daily_results r join public.profiles p on p.id=r.user_id
  join public.season_days d on d.id=r.season_day_id join public.seasons s on s.id=d.season_id
  where r.season_day_id=p_season_day_id and public.is_league_member(s.league_id)
  order by r.rank,p.nickname
$$;
create or replace function public.season_leaderboard(p_season_id uuid)
returns table(user_id uuid,nickname text,country_code text,character_id text,rank bigint,points integer,wins integer,podiums integer,games_played integer)
language sql stable security definer set search_path = '' as $$
  select t.user_id,p.nickname,p.country_code,p.character_id,
    row_number() over(order by t.points desc,t.wins desc,t.podiums desc,p.nickname) rank,
    t.points,t.wins,t.podiums,t.games_played
  from public.season_totals t join public.profiles p on p.id=t.user_id
  join public.seasons s on s.id=t.season_id
  where t.season_id=p_season_id and public.is_league_member(s.league_id)
  order by t.points desc,t.wins desc,t.podiums desc,p.nickname
$$;
revoke all on function public.daily_leaderboard(uuid),public.season_leaderboard(uuid) from public, anon;
grant execute on function public.daily_leaderboard(uuid),public.season_leaderboard(uuid) to authenticated;

grant usage on schema public to anon,authenticated;
grant usage on schema public to service_role;
