// Registry contract for server-authoritative game result validators.
// Each game validator returns only a server-calculated raw score and duration.
export type RawGameSubmission = { events: unknown[]; seed?: string };
export type VerifiedGameResult = { scoreValue: number; durationMs: number; rawScore: Record<string, unknown> };
export type GameVerifier = (submission: RawGameSubmission, attempt: Record<string, any>) => VerifiedGameResult;

const verifiers = new Map<string, GameVerifier>();
export function registerGameVerifier(gameId: string, verify: GameVerifier) {
  if (!/^[a-z0-9-]{2,40}$/.test(gameId) || verifiers.has(gameId)) throw new Error(`Invalid or duplicate game verifier: ${gameId}`);
  verifiers.set(gameId, verify);
}
export function getGameVerifier(gameId: string) { return verifiers.get(gameId) || null; }
