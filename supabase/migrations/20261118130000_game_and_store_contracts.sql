-- Metadata needed to add games and localized sticker collections without changing
-- the season schema. A playable game must name its deployed server verifier.
alter table public.game_catalog
  add column name_i18n jsonb not null default '{}'::jsonb,
  add column description_i18n jsonb not null default '{}'::jsonb,
  add column verifier_key text,
  add column adapter_version integer not null default 1 check (adapter_version > 0);
update public.game_catalog set verifier_key='submit-aiguillage' where id='aiguillage';
update public.game_catalog set
  name_i18n='{"fr":"Aiguillage","en":"Rail Switch","es":"Desvío","de":"Weiche","it":"Scambio","pt":"Desvio"}'::jsonb,
  description_i18n='{"fr":"Dirige chaque wagon vers le quai de même forme.","en":"Send each wagon to the platform with the matching shape.","es":"Envía cada vagón al andén con la misma forma.","de":"Leite jeden Waggon zum Gleis mit der passenden Form.","it":"Guida ogni vagone sul binario con la forma corrispondente.","pt":"Leve cada vagão à plataforma com a forma correspondente."}'::jsonb
where id='aiguillage';
alter table public.game_catalog add constraint playable_game_has_verifier
  check (not playable or verifier_key is not null);

-- Sticker catalog is ready for multiple themed collections and native store SKUs.
-- A non-null SKU does not itself grant ownership; a verified store callback must.
alter table public.stickers
  add column collection_key text not null default 'starter',
  add column name_i18n jsonb not null default '{}'::jsonb,
  add column description_i18n jsonb not null default '{}'::jsonb,
  add column sort_order integer not null default 0,
  add constraint sticker_collection_key_format check (collection_key ~ '^[a-z0-9-]{2,40}$');
update public.stickers s set name_i18n=jsonb_build_object(
  'fr',case s.character_id when 'grenouille' then 'Grenouille' when 'axolotl' then 'Axolotl' when 'fox' then 'Renard' when 'penguin' then 'Pingouin' when 'rabbit' then 'Lapin' when 'cat' then 'Chat' when 'octopus' then 'Poulpe' when 'hedgehog' then 'Hérisson' when 'bee' then 'Abeille' when 'dragon' then 'Dragon' else s.display_key end,
  'en',case s.character_id when 'grenouille' then 'Frog' when 'axolotl' then 'Axolotl' when 'fox' then 'Fox' when 'penguin' then 'Penguin' when 'rabbit' then 'Rabbit' when 'cat' then 'Cat' when 'octopus' then 'Octopus' when 'hedgehog' then 'Hedgehog' when 'bee' then 'Bee' when 'dragon' then 'Dragon' else s.display_key end,
  'es',case s.character_id when 'grenouille' then 'Rana' when 'axolotl' then 'Ajolote' when 'fox' then 'Zorro' when 'penguin' then 'Pingüino' when 'rabbit' then 'Conejo' when 'cat' then 'Gato' when 'octopus' then 'Pulpo' when 'hedgehog' then 'Erizo' when 'bee' then 'Abeja' when 'dragon' then 'Dragón' else s.display_key end,
  'de',case s.character_id when 'grenouille' then 'Frosch' when 'axolotl' then 'Axolotl' when 'fox' then 'Fuchs' when 'penguin' then 'Pinguin' when 'rabbit' then 'Kaninchen' when 'cat' then 'Katze' when 'octopus' then 'Krake' when 'hedgehog' then 'Igel' when 'bee' then 'Biene' when 'dragon' then 'Drache' else s.display_key end,
  'it',case s.character_id when 'grenouille' then 'Rana' when 'axolotl' then 'Axolotl' when 'fox' then 'Volpe' when 'penguin' then 'Pinguino' when 'rabbit' then 'Coniglio' when 'cat' then 'Gatto' when 'octopus' then 'Polpo' when 'hedgehog' then 'Riccio' when 'bee' then 'Ape' when 'dragon' then 'Drago' else s.display_key end,
  'pt',case s.character_id when 'grenouille' then 'Sapo' when 'axolotl' then 'Axolote' when 'fox' then 'Raposa' when 'penguin' then 'Pinguim' when 'rabbit' then 'Coelho' when 'cat' then 'Gato' when 'octopus' then 'Polvo' when 'hedgehog' then 'Ouriço' when 'bee' then 'Abelha' when 'dragon' then 'Dragão' else s.display_key end
);

-- Store receipts and ad callbacks can be retried safely without granting twice.
-- Raw provider payloads are intentionally not persisted here.
create table public.external_reward_events (
  provider text not null,
  provider_event_id text not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reward_type text not null check (reward_type in ('extra_attempt','double_points')),
  season_id uuid not null references public.seasons(id) on delete cascade,
  reward_claim_id uuid references public.reward_claims(id),
  verified_at timestamptz not null default now(),
  primary key(provider,provider_event_id)
);
create table public.store_transactions (
  store text not null check (store in ('apple','google')),
  transaction_id text not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  sticker_id text not null references public.stickers(id),
  verified_at timestamptz not null default now(),
  primary key(store,transaction_id)
);
alter table public.external_reward_events enable row level security;
alter table public.store_transactions enable row level security;
revoke all on public.external_reward_events,public.store_transactions from anon,authenticated;
grant select,insert,update on public.external_reward_events,public.store_transactions to service_role;
