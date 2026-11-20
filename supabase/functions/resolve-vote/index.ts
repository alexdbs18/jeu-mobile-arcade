import { adminRequest, adminRpc, callerId, credentials, json, options } from '../_shared/http.ts';

Deno.serve(async request => {
  const preflight = options(request);
  if (preflight) return preflight;
  if (request.method !== 'POST') return json({ message: 'Method not allowed.' }, 405);
  try {
    const { url, anon, service } = credentials();
    const userId = await callerId(request, url, anon);
    const { voteId } = await request.json();
    if (!/^[0-9a-f-]{36}$/i.test(String(voteId || ''))) return json({ message: 'Invalid vote.' }, 400);
    const rows = await adminRequest(url, service,
      `/rest/v1/votes?id=eq.${encodeURIComponent(voteId)}&select=id,closes_at,winner_game_id,season:seasons!inner(league_id)&limit=1`);
    const vote = rows?.[0];
    if (!vote) return json({ message: 'Vote not found.' }, 404);
    const leagueId = vote.season?.league_id;
    const membership = await adminRequest(url, service,
      `/rest/v1/league_members?league_id=eq.${encodeURIComponent(leagueId)}&user_id=eq.${encodeURIComponent(userId)}&select=user_id&limit=1`);
    if (!membership?.length) return json({ message: 'League membership required.' }, 403);
    if (Date.now() < Date.parse(vote.closes_at)) return json({ message: 'Vote is still open.' }, 409);
    const winner = vote.winner_game_id || await adminRpc(url, service, 'resolve_vote', { p_vote_id: voteId });
    return json({ resolved: true, winner });
  } catch (error) {
    return json({ message: error instanceof Error ? error.message : 'The vote could not be resolved.' }, 400);
  }
});
