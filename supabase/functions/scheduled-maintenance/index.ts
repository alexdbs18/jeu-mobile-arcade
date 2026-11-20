import { adminRequest, adminRpc, credentials, json, options } from '../_shared/http.ts';

function equalSecret(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return difference === 0;
}

Deno.serve(async request => {
  const preflight = options(request);
  if (preflight) return preflight;
  if (request.method !== 'POST') return json({ message: 'Method not allowed.' }, 405);
  const expected = Deno.env.get('RIVO_MAINTENANCE_SECRET');
  const supplied = request.headers.get('x-rivo-maintenance-secret');
  if (!expected || !supplied || !equalSecret(supplied, expected)) {
    return json({ message: 'Invalid scheduler credential.' }, 401);
  }
  try {
    const { url, service } = credentials();
    const now = new Date().toISOString();
    const votes = await adminRequest(url, service,
      `/rest/v1/votes?closes_at=lt.${encodeURIComponent(now)}&winner_game_id=is.null&select=id`);
    for (const vote of votes || []) await adminRpc(url, service, 'resolve_vote', { p_vote_id: vote.id });
    const days = await adminRequest(url, service,
      `/rest/v1/season_days?game_id=not.is.null&ends_at=lt.${encodeURIComponent(now)}&select=id`);
    for (const day of days || []) await adminRpc(url, service, 'finalize_daily_challenge', { p_season_day_id: day.id });
    const seasons = await adminRequest(url, service,
      '/rest/v1/seasons?status=in.(scheduled,active)&select=id,starts_at,ends_at,status');
    for (const season of seasons || []) {
      const status = Date.parse(season.ends_at) <= Date.now() ? 'completed' :
        Date.parse(season.starts_at) <= Date.now() && season.status === 'scheduled' ? 'active' : null;
      if (status) await adminRequest(url, service, `/rest/v1/seasons?id=eq.${encodeURIComponent(season.id)}`, {
        method: 'PATCH', headers: { prefer: 'return=minimal' }, body: JSON.stringify({ status })
      });
    }
    return json({ finalizedDays: days?.length || 0, resolvedVotes: votes?.length || 0 });
  } catch (error) {
    return json({ message: error instanceof Error ? error.message : 'Scheduled maintenance failed.' }, 500);
  }
});
