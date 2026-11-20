create or replace function public.my_leagues()
returns table(id uuid,name text,invite_code text,launch_time time,timezone text,member_count bigint)
language sql stable security definer set search_path = '' as $$
  select l.id,l.name,l.invite_code,l.launch_time,l.timezone,count(all_members.user_id)
  from public.league_members mine join public.leagues l on l.id=mine.league_id
  join public.league_members all_members on all_members.league_id=l.id
  where mine.user_id=(select auth.uid())
  group by l.id,l.name,l.invite_code,l.launch_time,l.timezone
  order by min(mine.joined_at),l.name
$$;
revoke all on function public.my_leagues() from public,anon;
grant execute on function public.my_leagues() to authenticated;

create or replace function public.league_chat(p_league_id uuid)
returns table(id uuid,user_id uuid,nickname text,country_code text,character_id text,
  body text,sticker_id text,sticker_asset text,created_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_league_member(p_league_id) then raise exception 'League membership required' using errcode='42501'; end if;
  return query select m.id,m.user_id,p.nickname,p.country_code,p.character_id,m.body,
    m.sticker_id,s.asset_path,m.created_at
  from public.messages m join public.profiles p on p.id=m.user_id
  left join public.stickers s on s.id=m.sticker_id
  where m.league_id=p_league_id
  order by m.created_at desc limit 100;
end $$;
revoke all on function public.league_chat(uuid) from public,anon;
grant execute on function public.league_chat(uuid) to authenticated;

create or replace function public.game_public_rank(p_game_id text)
returns table(game_id text,personal_best numeric,duration_ms integer,global_rank bigint,
  global_players bigint,global_percentile numeric,national_rank bigint,national_players bigint)
language plpgsql stable security definer set search_path = '' as $$
declare v_user uuid := (select auth.uid()); v_country text;
begin
  if v_user is null then raise exception 'Authentication required' using errcode='28000'; end if;
  if not exists(select 1 from public.game_catalog where id=p_game_id and playable) then raise exception 'Game is not available'; end if;
  select country_code into v_country from public.profiles where id=v_user;
  return query with best as (
    select distinct on (a.user_id) a.user_id,a.score_value,a.duration_ms,p.country_code
    from public.game_attempts a join public.season_days d on d.id=a.season_day_id
      join public.profiles p on p.id=a.user_id
    where d.game_id=p_game_id and a.attempt_kind='official' and a.verified
    order by a.user_id,a.score_value desc,a.duration_ms asc
  ), ranked as (
    select b.*,rank() over(order by score_value desc,duration_ms asc) place,
      count(*) over()::bigint total from best b
  ), national as (
    select b.user_id,rank() over(order by score_value desc,duration_ms asc) place,
      count(*) over()::bigint total from best b where b.country_code=v_country
  )
  select p_game_id,self.score_value,self.duration_ms,r.place,r.total,
      round(100.0*r.place/nullif(r.total,0),1),n.place,n.total
  from (select v_user user_id) current_user_row
  left join ranked r on r.user_id=current_user_row.user_id
  left join national n on n.user_id=current_user_row.user_id
  left join best self on self.user_id=current_user_row.user_id;
end $$;
revoke all on function public.game_public_rank(text) from public,anon;
grant execute on function public.game_public_rank(text) to authenticated;

create or replace function public.season_recap(p_season_id uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_user uuid := (select auth.uid()); v_league uuid; v_status text; v_place bigint; v_totals public.season_totals%rowtype;
  v_days jsonb; v_best_days jsonb; v_bonus_count integer; v_streak integer; v_leader_points integer; v_previous_points integer;
begin
  select league_id,status into v_league,v_status from public.seasons where id=p_season_id;
  if v_user is null or v_league is null or not public.is_league_member(v_league) then raise exception 'Season access denied' using errcode='42501'; end if;
  if v_status<>'completed' then raise exception 'Season recap is available after the season ends'; end if;
  select * into v_totals from public.season_totals where season_id=p_season_id and user_id=v_user;
  select place into v_place from (
    select t.user_id,row_number() over(order by t.points desc,t.wins desc,t.podiums desc,p.nickname) place
    from public.season_totals t join public.profiles p on p.id=t.user_id where t.season_id=p_season_id
  ) ranked where user_id=v_user;
  select coalesce(jsonb_agg(jsonb_build_object('day',d.day_number,'game',g.name,'rank',r.rank,
      'points',r.points,'multiplier',r.multiplier,'score',a.score_value,'durationMs',a.duration_ms)
      order by d.day_number),'[]'::jsonb)
    into v_days from public.daily_results r join public.season_days d on d.id=r.season_day_id
    join public.game_catalog g on g.id=d.game_id join public.game_attempts a on a.id=r.best_attempt_id
    where d.season_id=p_season_id and r.user_id=v_user;
  select count(*) into v_bonus_count from public.reward_claims where user_id=v_user and season_id=p_season_id and used_at is not null;
  select current_streak into v_streak from public.profiles where id=v_user;
  select max(points) into v_leader_points from public.season_totals where season_id=p_season_id;
  select points into v_previous_points from (
    select t.points,row_number() over(order by t.points desc,t.wins desc,t.podiums desc,p.nickname) place
    from public.season_totals t join public.profiles p on p.id=t.user_id where t.season_id=p_season_id
  ) ranked where place=v_place-1;
  select coalesce(jsonb_agg(item order by (item->>'points')::integer desc),'[]'::jsonb) into v_best_days from (
    select jsonb_build_object('day',d.day_number,'game',g.name,'rank',r.rank,'points',r.points,
      'score',a.score_value,'durationMs',a.duration_ms) item
    from public.daily_results r join public.season_days d on d.id=r.season_day_id
      join public.game_catalog g on g.id=d.game_id join public.game_attempts a on a.id=r.best_attempt_id
    where d.season_id=p_season_id and r.user_id=v_user order by r.points desc,r.rank asc limit 3
  ) top_days;
  return jsonb_build_object('rank',coalesce(v_place,0),'points',coalesce(v_totals.points,0),
    'wins',coalesce(v_totals.wins,0),'podiums',coalesce(v_totals.podiums,0),
    'gamesPlayed',coalesce(v_totals.games_played,0),'bonusesUsed',v_bonus_count,
    'currentStreak',coalesce(v_streak,0),'leaderPoints',coalesce(v_leader_points,0),
    'previousPoints',v_previous_points,'gapToLeader',greatest(coalesce(v_leader_points,0)-coalesce(v_totals.points,0),0),
    'gapToPrevious',case when v_previous_points is null then null else v_previous_points-v_totals.points end,
    'bestDays',v_best_days,'days',v_days);
end $$;
revoke all on function public.season_recap(uuid) from public,anon;
grant execute on function public.season_recap(uuid) to authenticated;

create or replace function public.daily_leaderboard(p_season_day_id uuid)
returns table(user_id uuid,nickname text,country_code text,character_id text,rank integer,points integer)
language sql stable security definer set search_path = '' as $$
  with context as (
    select d.id,d.season_id,s.league_id from public.season_days d
    join public.seasons s on s.id=d.season_id where d.id=p_season_day_id
  )
  select m.user_id,p.nickname,p.country_code,p.character_id,r.rank,r.points
  from context c join public.league_members m on m.league_id=c.league_id
  join public.profiles p on p.id=m.user_id
  left join public.daily_results r on r.season_day_id=c.id and r.user_id=m.user_id
  where m.joined_at<=(select s.starts_at from public.seasons s where s.id=c.season_id)
    and public.is_league_member(c.league_id)
  order by r.rank nulls last,p.nickname
$$;
revoke all on function public.daily_leaderboard(uuid) from public,anon;
grant execute on function public.daily_leaderboard(uuid) to authenticated;
