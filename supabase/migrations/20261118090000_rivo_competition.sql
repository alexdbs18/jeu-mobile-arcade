-- Rivo: source of truth for guest identity, seasons and competitive state.
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null default 'Joueur' check (char_length(nickname) between 1 and 20),
  country_code char(2) not null default 'FR' check (country_code ~ '^[A-Z]{2}$'),
  character_id text not null default 'grenouille',
  timezone text not null default 'Europe/Paris',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  current_streak integer not null default 0 check (current_streak >= 0),
  best_streak integer not null default 0 check (best_streak >= 0),
  day4_reward_available boolean not null default false,
  day4_reward_granted_at timestamptz,
  lifetime_wins integer not null default 0 check (lifetime_wins >= 0),
  lifetime_podiums integer not null default 0 check (lifetime_podiums >= 0),
  lifetime_games integer not null default 0 check (lifetime_games >= 0)
);

create table public.characters (
  id text primary key,
  sort_order smallint not null unique,
  display_key text not null,
  asset_path text not null,
  active boolean not null default true
);
insert into public.characters(id, sort_order, display_key, asset_path) values
  ('grenouille',1,'character.frog','/rivo/src/assets/characters/frog.webp'),
  ('axolotl',2,'character.axolotl','/rivo/src/assets/characters/axolotl.png'),
  ('renard',3,'character.fox','/rivo/src/assets/characters/fox.png'),
  ('pingouin',4,'character.penguin','/rivo/src/assets/characters/penguin.png'),
  ('lapin',5,'character.rabbit','/rivo/src/assets/characters/rabbit.png'),
  ('chat',6,'character.cat','/rivo/src/assets/characters/cat.png'),
  ('pieuvre',7,'character.octopus','/rivo/src/assets/characters/octopus.png'),
  ('herisson',8,'character.hedgehog','/rivo/src/assets/characters/hedgehog.png'),
  ('abeille',9,'character.bee','/rivo/src/assets/characters/bee.png'),
  ('dragon',10,'character.dragon','/rivo/src/assets/characters/dragon.png');
alter table public.profiles add constraint profiles_character_fk
  foreign key(character_id) references public.characters(id);

create table public.game_catalog (
  id text primary key check (id ~ '^[a-z0-9-]{2,40}$'),
  name text not null,
  description text not null default '',
  illustration_path text not null default '',
  playable boolean not null default false,
  created_at timestamptz not null default now()
);
-- Do not count concepts or mock games toward a season's ten distinct challenges.
insert into public.game_catalog(id,name,description,illustration_path,playable)
values ('aiguillage','Aiguillage','Dirige chaque wagon vers le quai de même forme.','/rivo/src/assets/wagon.webp',true);

create table public.leagues (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 40),
  owner_id uuid not null references public.profiles(id),
  invite_code text not null unique default upper(substr(encode(extensions.gen_random_bytes(6),'hex'),1,8)),
  launch_time time not null default '18:00',
  timezone text not null default 'Europe/Paris',
  created_at timestamptz not null default now()
);
create table public.league_members (
  league_id uuid not null references public.leagues(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key(league_id,user_id)
);

create table public.seasons (
  id uuid primary key default extensions.gen_random_uuid(),
  league_id uuid not null references public.leagues(id) on delete cascade,
  number integer not null check (number > 0),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  timezone text not null,
  status text not null default 'scheduled' check (status in ('scheduled','active','completed')),
  created_at timestamptz not null default now(),
  unique(league_id,number),
  check (ends_at = starts_at + interval '240 hours')
);
create unique index seasons_one_open_per_league on public.seasons(league_id)
  where status in ('scheduled','active');
create table public.season_days (
  id uuid primary key default extensions.gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  day_number smallint not null check (day_number between 1 and 10),
  game_id text references public.game_catalog(id),
  vote_id uuid,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  unique(season_id,day_number),
  unique(season_id,game_id),
  check (ends_at = starts_at + interval '24 hours'),
  check ((game_id is not null) <> (vote_id is not null))
);
create table public.votes (
  id uuid primary key default extensions.gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  vote_number smallint not null check (vote_number in (1,2)),
  target_day_number smallint not null check (target_day_number between 1 and 10),
  opens_at timestamptz not null,
  closes_at timestamptz not null,
  candidate_game_ids text[],
  winner_game_id text references public.game_catalog(id),
  tie_break_seed bigint,
  resolved_at timestamptz,
  unique(season_id,vote_number),
  check (candidate_game_ids is null or cardinality(candidate_game_ids) = 3),
  check (candidate_game_ids is null or (candidate_game_ids[1] <> candidate_game_ids[2] and candidate_game_ids[2] <> candidate_game_ids[3] and candidate_game_ids[1] <> candidate_game_ids[3])),
  check (closes_at > opens_at)
);
alter table public.season_days add constraint season_days_vote_fk
  foreign key(vote_id) references public.votes(id) on delete cascade;
create table public.vote_ballots (
  vote_id uuid not null references public.votes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  game_id text not null references public.game_catalog(id),
  created_at timestamptz not null default now(),
  primary key(vote_id,user_id)
);

create table public.game_attempts (
  id uuid primary key default extensions.gen_random_uuid(),
  season_day_id uuid not null references public.season_days(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  attempt_kind text not null check (attempt_kind in ('practice','official')),
  attempt_number smallint,
  raw_score jsonb,
  score_value numeric,
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  verified boolean not null default false,
  reward_claim_id uuid,
  unique(season_day_id,user_id,attempt_number),
  check ((attempt_kind='practice' and attempt_number is null) or
         (attempt_kind='official' and attempt_number between 1 and 4))
);
create table public.reward_claims (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  season_id uuid not null references public.seasons(id) on delete cascade,
  reward_type text not null check (reward_type in ('extra_attempt','double_points','day4_streak','sticker')),
  source text not null check (source in ('rewarded_ad','streak','purchase','system')),
  provider_transaction_id text,
  created_at timestamptz not null default now(),
  unique(user_id,season_id,reward_type),
  unique(provider_transaction_id)
);
alter table public.game_attempts add constraint game_attempt_reward_fk
  foreign key(reward_claim_id) references public.reward_claims(id);
create table public.daily_results (
  season_day_id uuid not null references public.season_days(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  best_attempt_id uuid not null references public.game_attempts(id),
  rank integer not null check (rank > 0),
  points integer not null check (points between 0 and 200),
  multiplier smallint not null default 1 check (multiplier in (1,2)),
  computed_at timestamptz not null default now(),
  primary key(season_day_id,user_id)
);
create table public.season_totals (
  season_id uuid not null references public.seasons(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  points integer not null default 0 check (points >= 0),
  wins integer not null default 0 check (wins >= 0),
  podiums integer not null default 0 check (podiums >= 0),
  games_played integer not null default 0 check (games_played >= 0),
  updated_at timestamptz not null default now(),
  primary key(season_id,user_id)
);
create table public.streak_events (
  user_id uuid not null references public.profiles(id) on delete cascade,
  local_date date not null,
  timezone text not null,
  source text not null check (source in ('app_open','day4_reward')),
  created_at timestamptz not null default now(),
  primary key(user_id,local_date)
);
create table public.stickers (
  id text primary key,
  character_id text references public.characters(id),
  display_key text not null,
  asset_path text not null,
  price_sku text,
  active boolean not null default true
);
insert into public.stickers(id,character_id,display_key,asset_path)
select id,id,'sticker.'||id,asset_path from public.characters;
create table public.user_stickers (
  user_id uuid not null references public.profiles(id) on delete cascade,
  sticker_id text not null references public.stickers(id),
  acquired_at timestamptz not null default now(),
  source text not null check (source in ('starter','reward','purchase')),
  primary key(user_id,sticker_id)
);
create table public.messages (
  id uuid primary key default extensions.gen_random_uuid(),
  league_id uuid not null references public.leagues(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text check (body is null or char_length(body) between 1 and 240),
  sticker_id text references public.stickers(id),
  created_at timestamptz not null default now(),
  check ((body is not null) <> (sticker_id is not null))
);

create or replace function public.grant_starter_stickers()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.user_stickers(user_id,sticker_id,source)
  select new.id,s.id,'starter' from public.stickers s where s.character_id=new.character_id
  on conflict(user_id,sticker_id) do nothing;
  return new;
end $$;
create trigger on_profile_created_grant_sticker after insert on public.profiles
  for each row execute procedure public.grant_starter_stickers();
create trigger on_profile_character_change_grant_sticker after update of character_id on public.profiles
  for each row when (old.character_id is distinct from new.character_id)
  execute procedure public.grant_starter_stickers();

create or replace function public.handle_new_guest()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id,nickname,country_code,character_id,timezone)
  values(new.id,
    coalesce(nullif(left(new.raw_user_meta_data->>'nickname',20),''),'Joueur'),
    upper(coalesce(nullif(new.raw_user_meta_data->>'country_code',''),'FR')),
    coalesce(nullif(new.raw_user_meta_data->>'character_id',''),'grenouille'),
    case when exists(select 1 from pg_timezone_names z where z.name=new.raw_user_meta_data->>'timezone')
      then new.raw_user_meta_data->>'timezone' else 'Europe/Paris' end)
  on conflict(id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.handle_new_guest();

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at=now(); return new; end $$;
create trigger profiles_touch_updated_at before update on public.profiles
  for each row execute procedure public.touch_updated_at();
create or replace function public.validate_profile_timezone()
returns trigger language plpgsql set search_path = '' as $$
begin
  if not exists(select 1 from pg_catalog.pg_timezone_names z where z.name=new.timezone) then
    raise exception 'Invalid IANA timezone';
  end if;
  return new;
end $$;
create trigger profiles_validate_timezone before insert or update of timezone on public.profiles
  for each row execute procedure public.validate_profile_timezone();

-- Profiles can only be read/changed by their owner. Public leaderboards get a
-- deliberately limited projection through the league RPCs added in later migrations.
alter table public.profiles enable row level security;
alter table public.characters enable row level security;
alter table public.game_catalog enable row level security;
alter table public.leagues enable row level security;
alter table public.league_members enable row level security;
alter table public.seasons enable row level security;
alter table public.season_days enable row level security;
alter table public.votes enable row level security;
alter table public.vote_ballots enable row level security;
alter table public.game_attempts enable row level security;
alter table public.reward_claims enable row level security;
alter table public.daily_results enable row level security;
alter table public.season_totals enable row level security;
alter table public.streak_events enable row level security;
alter table public.stickers enable row level security;
alter table public.user_stickers enable row level security;
alter table public.messages enable row level security;

create or replace function public.is_league_member(target_league uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.league_members m
    where m.league_id=target_league and m.user_id=(select auth.uid()))
$$;
revoke all on function public.is_league_member(uuid) from public, anon;
grant execute on function public.is_league_member(uuid) to authenticated;

create policy "profiles_select_self" on public.profiles for select to authenticated using ((select auth.uid())=id);
create policy "profiles_update_self" on public.profiles for update to authenticated using ((select auth.uid())=id) with check ((select auth.uid())=id);
create policy "characters_public_read" on public.characters for select to anon, authenticated using (active);
create policy "games_public_read" on public.game_catalog for select to anon, authenticated using (true);
create policy "leagues_members_read" on public.leagues for select to authenticated using (
  public.is_league_member(id)
);
create policy "members_members_read" on public.league_members for select to authenticated using (
  public.is_league_member(league_id)
);
create policy "seasons_members_read" on public.seasons for select to authenticated using (
  public.is_league_member(league_id)
);
create policy "days_members_read" on public.season_days for select to authenticated using (
  exists(select 1 from public.seasons s join public.league_members m on m.league_id=s.league_id
    where s.id=season_days.season_id and public.is_league_member(s.league_id))
);
create policy "votes_members_read" on public.votes for select to authenticated using (
  exists(select 1 from public.seasons s join public.league_members m on m.league_id=s.league_id
    where s.id=votes.season_id and public.is_league_member(s.league_id))
);
create policy "ballots_self_read" on public.vote_ballots for select to authenticated using (user_id=(select auth.uid()));
create policy "attempts_self_read" on public.game_attempts for select to authenticated using (user_id=(select auth.uid()));
create policy "rewards_self_read" on public.reward_claims for select to authenticated using (user_id=(select auth.uid()));
create policy "results_members_read" on public.daily_results for select to authenticated using (
  exists(select 1 from public.season_days d join public.seasons s on s.id=d.season_id
    join public.league_members m on m.league_id=s.league_id where d.id=daily_results.season_day_id and m.user_id=(select auth.uid()))
);
create policy "totals_members_read" on public.season_totals for select to authenticated using (
  exists(select 1 from public.seasons s join public.league_members m on m.league_id=s.league_id
    where s.id=season_totals.season_id and m.user_id=(select auth.uid()))
);
create policy "streaks_self_read" on public.streak_events for select to authenticated using (user_id=(select auth.uid()));
create policy "stickers_public_read" on public.stickers for select to anon, authenticated using (active);
create policy "inventory_self_read" on public.user_stickers for select to authenticated using (user_id=(select auth.uid()));
create policy "messages_members_read" on public.messages for select to authenticated using (
  public.is_league_member(league_id)
);

-- All competitive writes are performed by trusted database functions or Edge
-- Functions using the service role after validating the caller's JWT and provider
-- receipts. The browser receives no direct write policy for those tables.
revoke insert, update, delete on public.game_attempts, public.reward_claims,
  public.daily_results, public.season_totals, public.season_days, public.votes,
  public.vote_ballots, public.streak_events, public.messages, public.user_stickers
  from anon, authenticated;
revoke insert, update, delete on public.leagues, public.league_members, public.seasons
  from anon, authenticated;
grant select on public.characters, public.game_catalog, public.stickers to anon, authenticated;
grant select on public.profiles to authenticated;
revoke update on public.profiles from anon, authenticated;
grant update(nickname,country_code,character_id,timezone) on public.profiles to authenticated;
grant select on public.leagues, public.league_members, public.seasons,
  public.season_days, public.votes, public.vote_ballots, public.game_attempts,
  public.reward_claims, public.daily_results, public.season_totals,
  public.streak_events, public.user_stickers, public.messages to authenticated;
