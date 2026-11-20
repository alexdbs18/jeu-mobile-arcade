import { adminRequest, adminRpc, callerId, credentials, json, options } from '../_shared/http.ts';

Deno.serve(async request => {
  const preflight = options(request);
  if (preflight) return preflight;
  if (request.method !== 'POST') return json({ message: 'Method not allowed.' }, 405);
  try {
    const { url, anon, service } = credentials();
    const userId = await callerId(request, url, anon);
    const memberships = await adminRequest(url, service,
      `/rest/v1/league_members?user_id=eq.${encodeURIComponent(userId)}&select=league_id`);
    const leagueIds = [...new Set((memberships || []).map((row: { league_id: string }) => row.league_id))];
    if (!leagueIds.length) return json({ finalizedDays: 0, resolvedVotes: 0 });
    const filter = `in.(${leagueIds.join(',')})`;
    const seasons = await adminRequest(url, service,
      `/rest/v1/seasons?league_id=${filter}&select=id,starts_at,ends_at,status`);
    const seasonIds = seasons.map((season: { id: string }) => season.id);
    if (!seasonIds.length) return json({ finalizedDays: 0, resolvedVotes: 0 });
    const seasonFilter = `in.(${seasonIds.join(',')})`;
    const now = new Date().toISOString();
    const votes = await adminRequest(url, service,
      `/rest/v1/votes?season_id=${seasonFilter}&closes_at=lt.${encodeURIComponent(now)}&winner_game_id=is.null&select=id`);
    for (const vote of votes || []) await adminRpc(url, service, 'resolve_vote', { p_vote_id: vote.id });
    const days = await adminRequest(url, service,
      `/rest/v1/season_days?season_id=${seasonFilter}&ends_at=lt.${encodeURIComponent(now)}&select=id`);
    for (const day of days || []) await adminRpc(url, service, 'finalize_daily_challenge', { p_season_day_id: day.id });
    for (const season of seasons) {
      if (Date.parse(season.ends_at) <= Date.now() && season.status !== 'completed') {
        await adminRequest(url, service, `/rest/v1/seasons?id=eq.${encodeURIComponent(season.id)}`, {
          method: 'PATCH', headers: { prefer: 'return=minimal' }, body: JSON.stringify({ status: 'completed' })
        });
      } else if (Date.parse(season.starts_at || season.ends_at) <= Date.now() && season.status === 'scheduled') {
        await adminRequest(url, service, `/rest/v1/seasons?id=eq.${encodeURIComponent(season.id)}`, {
          method: 'PATCH', headers: { prefer: 'return=minimal' }, body: JSON.stringify({ status: 'active' })
        });
      }
    }
    return json({ finalizedDays: days?.length || 0, resolvedVotes: votes?.length || 0 });
  } catch (error) {
    return json({ message: error instanceof Error ? error.message : 'Maintenance failed.' }, 400);
  }
});
