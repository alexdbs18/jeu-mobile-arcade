import { adminRequest, adminRpc, callerId, credentials, json, options } from '../_shared/http.ts';

const expectedByKind: Record<string, string[]> = {
  practice: ['circle', 'square', 'triangle'],
  official: ['triangle', 'circle', 'square']
};
const choices = new Set(['circle', 'triangle', 'square']);

Deno.serve(async request => {
  const preflight = options(request);
  if (preflight) return preflight;
  if (request.method !== 'POST') return json({ message: 'Method not allowed.' }, 405);
  try {
    const { url, anon, service } = credentials();
    const userId = await callerId(request, url, anon);
    const body = await request.json();
    const attemptId = String(body?.attemptId || '');
    if (!/^[0-9a-f-]{36}$/i.test(attemptId)) return json({ message: 'Invalid attempt.' }, 400);
    const events = body?.events;
    if (!Array.isArray(events) || events.length !== 3) return json({ message: 'Aiguillage requires exactly three answers.' }, 400);

    const rows = await adminRequest(url, service,
      `/rest/v1/game_attempts?id=eq.${encodeURIComponent(attemptId)}&select=id,user_id,attempt_kind,started_at,submitted_at,season_day:season_days!inner(id,game_id,starts_at,ends_at)&limit=1`);
    const attempt = rows?.[0];
    if (!attempt || attempt.user_id !== userId || attempt.submitted_at) return json({ message: 'Attempt not found or already submitted.' }, 403);
    if (attempt.season_day?.game_id !== 'aiguillage') return json({ message: 'This game is not available for this attempt.' }, 409);
    const now = Date.now();
    if (now < Date.parse(attempt.season_day.starts_at) || now >= Date.parse(attempt.season_day.ends_at)) return json({ message: 'The daily challenge has closed.' }, 409);
    const expected = expectedByKind[attempt.attempt_kind];
    if (!expected) return json({ message: 'Invalid attempt kind.' }, 409);

    let score = 0;
    let durationMs = 0;
    const verifiedEvents = events.map((event: Record<string, unknown>, index: number) => {
      const choice = String(event?.choice || '');
      const duration = Number(event?.ms);
      if (!choices.has(choice) || !Number.isSafeInteger(duration) || duration < 80 || duration > 60_000) {
        throw new Error('One or more answer events are invalid.');
      }
      const correct = choice === expected[index];
      if (correct) score++;
      durationMs += duration;
      return { expected: expected[index], choice, durationMs: duration, correct };
    });
    if (durationMs > 180_000) return json({ message: 'The game duration is outside its allowed range.' }, 400);
    await adminRpc(url, service, 'set_verified_attempt_result', {
      p_attempt_id: attemptId,
      p_score_value: score,
      p_duration_ms: durationMs,
      p_raw_score: { game_id: 'aiguillage', events: verifiedEvents }
    });
    const saved = await adminRequest(url, service,
      `/rest/v1/game_attempts?id=eq.${encodeURIComponent(attemptId)}&select=score_value,duration_ms&limit=1`);
    if (!saved?.[0]) throw new Error('The verified score could not be read back.');
    return json({ accepted: true, score: saved[0].score_value, durationMs: saved[0].duration_ms, correctAnswers: score });
  } catch (error) {
    return json({ message: error instanceof Error ? error.message : 'The result could not be verified.' }, 400);
  }
});
