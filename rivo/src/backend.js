(() => {
  'use strict';
  const config = globalThis.RIVO_CONFIG || {};
  const storageKey = 'rivo.supabase.guest.v1';
  const configured = Boolean(config.supabaseUrl && config.supabaseAnonKey);
  const base = configured ? String(config.supabaseUrl).replace(/\/$/, '') : '';
  let session = null;
  try { session = JSON.parse(localStorage.getItem(storageKey) || 'null'); } catch {}

  class BackendError extends Error {
    constructor(message, status = 0, code = 'backend_error') { super(message); this.name = 'BackendError'; this.status = status; this.code = code; }
  }
  const saveSession = value => {
    session = value;
    try { localStorage.setItem(storageKey, JSON.stringify(value)); } catch {}
  };
  const clearSession = () => { session = null; try { localStorage.removeItem(storageKey); } catch {} };
  const assertConfigured = () => { if (!configured) throw new BackendError('Supabase n’est pas configuré pour cette prévisualisation.', 0, 'not_configured'); };
  async function parse(response) {
    const text = await response.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    if (!response.ok) throw new BackendError(data?.msg || data?.message || data?.error_description || `Supabase a répondu ${response.status}.`, response.status, data?.code || data?.error || 'request_failed');
    return data;
  }
  async function refresh() {
    if (!session?.refresh_token) return null;
    const response = await fetch(`${base}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST', headers: { apikey: config.supabaseAnonKey, 'content-type': 'application/json' },
      body: JSON.stringify({ refresh_token: session.refresh_token })
    });
    const data = await parse(response);
    saveSession({ ...data, expires_at: Date.now() + Number(data.expires_in || 3600) * 1000 });
    return session;
  }
  async function accessToken() {
    if (!session?.access_token) return '';
    if (session.expires_at && session.expires_at - Date.now() < 60_000) {
      try { await refresh(); } catch { clearSession(); return ''; }
    }
    return session?.access_token || '';
  }
  async function request(path, { method = 'GET', body, auth = true, prefer = '' } = {}) {
    assertConfigured();
    const token = auth ? await accessToken() : '';
    const headers = { apikey: config.supabaseAnonKey, Accept: 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined) headers['content-type'] = 'application/json';
    if (prefer) headers.Prefer = prefer;
    const response = await fetch(`${base}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    return parse(response);
  }
  async function signInAnonymously({ nickname, countryCode, characterId, timezone }) {
    const data = await request('/auth/v1/signup', {
      method: 'POST', auth: false,
      body: { data: { nickname, country_code: countryCode, character_id: characterId, timezone } }
    });
    if (!data?.access_token || !data?.user?.id) throw new BackendError('Supabase n’a pas créé la session invitée.', 502, 'guest_session_missing');
    saveSession({ ...data, expires_at: Date.now() + Number(data.expires_in || 3600) * 1000 });
    return { id: data.user.id, isAnonymous: data.user.is_anonymous !== false };
  }
  async function loadProfile() {
    if (!session?.user?.id) return null;
    const rows = await request(`/rest/v1/profiles?id=eq.${encodeURIComponent(session.user.id)}&select=id,nickname,country_code,character_id,timezone,current_streak,best_streak,lifetime_wins,lifetime_podiums,lifetime_games`);
    return rows?.[0] || null;
  }
  async function saveProfile({ nickname, countryCode, characterId, timezone }) {
    if (!session?.user?.id) throw new BackendError('La session invitée est absente.', 401, 'no_session');
    const result = await request(`/rest/v1/profiles?id=eq.${encodeURIComponent(session.user.id)}`, {
      method: 'PATCH', body: { nickname: String(nickname).trim().slice(0, 20), country_code: countryCode, character_id: characterId, timezone }, prefer: 'return=representation'
    });
    return result?.[0] || null;
  }
  async function call(name, args = {}) { return request(`/rest/v1/rpc/${encodeURIComponent(name)}`, { method: 'POST', body: args }); }
  async function invoke(name, body = {}) { return request(`/functions/v1/${encodeURIComponent(name)}`, { method: 'POST', body }); }
  async function listLeagues() { return call('my_leagues'); }
  async function listSeasonDays(seasonId) {
    return request(`/rest/v1/season_days?season_id=eq.${encodeURIComponent(seasonId)}&select=id,day_number,game_id,vote_id,starts_at,ends_at&order=day_number.asc`);
  }
  async function listSeasons(leagueId) {
    return request(`/rest/v1/seasons?league_id=eq.${encodeURIComponent(leagueId)}&select=id,number,starts_at,ends_at,timezone,status&order=number.desc&limit=1`);
  }
  async function listVotes(seasonId) {
    return request(`/rest/v1/votes?season_id=eq.${encodeURIComponent(seasonId)}&select=id,vote_number,target_day_number,opens_at,closes_at,candidate_game_ids,winner_game_id,resolved_at&order=vote_number.asc`);
  }
  async function myBallot(voteId) {
    return request(`/rest/v1/vote_ballots?vote_id=eq.${encodeURIComponent(voteId)}&user_id=eq.${encodeURIComponent(session.user.id)}&select=game_id`);
  }

  globalThis.RivoBackend = Object.freeze({
    configured, BackendError,
    get userId() { return session?.user?.id || null; },
    get hasSession() { return Boolean(session?.access_token); },
    signInAnonymously, loadProfile, saveProfile, call, invoke, listLeagues, listSeasons, listSeasonDays, listVotes, myBallot,
    createLeague: (name, timezone, launchTime) => call('create_league', { p_name: name, p_timezone: timezone, p_launch_time: launchTime }),
    joinLeague: inviteCode => call('join_league', { p_invite_code: inviteCode }),
    createSeason: (leagueId, firstLocalDay) => call('create_season', { p_league_id: leagueId, p_first_local_day: firstLocalDay }),
    openVote: voteId => call('open_vote', { p_vote_id: voteId }),
    castVote: (voteId, gameId) => call('cast_vote', { p_vote_id: voteId, p_game_id: gameId }),
    dailyLeaderboard: dayId => call('daily_leaderboard', { p_season_day_id: dayId }),
    seasonLeaderboard: seasonId => call('season_leaderboard', { p_season_id: seasonId }),
    gamePublicRank: gameId => call('game_public_rank', { p_game_id: gameId }),
    seasonRecap: seasonId => call('season_recap', { p_season_id: seasonId }),
    leagueChat: leagueId => call('league_chat', { p_league_id: leagueId }),
    ownedStickers: () => request('/rest/v1/user_stickers?select=sticker_id,sticker:stickers(id,character_id,display_key,asset_path,name_i18n,collection_key)&order=acquired_at.asc'),
    recentStreak: () => request(`/rest/v1/streak_events?user_id=eq.${encodeURIComponent(session.user.id)}&select=local_date,timezone,source&order=local_date.desc&limit=7`),
    recordDayOpen: () => call('record_day_open'),
    startAttempt: (dayId, kind, multiplier = false) => call('start_game_attempt', { p_season_day_id: dayId, p_kind: kind, p_multiplier: multiplier }),
    postMessage: (leagueId, body = null, stickerId = null) => call('post_league_message', { p_league_id: leagueId, p_body: body, p_sticker_id: stickerId }),
    listCharacters: () => request('/rest/v1/characters?select=id,sort_order,display_key,asset_path&active=eq.true&order=sort_order', { auth: false }),
    listGames: () => request('/rest/v1/game_catalog?select=id,name,description,name_i18n,description_i18n,illustration_path,playable,verifier_key,adapter_version&order=name', { auth: false }),
    signOut: clearSession
  });
})();
