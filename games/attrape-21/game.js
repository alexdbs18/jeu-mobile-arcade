/** The complete ruleset. Times are in milliseconds; positions are normalized. */
export const CONFIG = Object.freeze({
  roundMs: 30_000,
  countdownMs: 3_000,
  spawnMs: 750,
  blockMs: 5_000,
  stages: Object.freeze([
    Object.freeze({ at: 0, fallMs: 4_000, label: 'Trouve ton rythme' }),
    Object.freeze({ at: 10_000, fallMs: 3_400, label: 'On accélère' }),
    Object.freeze({ at: 20_000, fallMs: 3_000, label: 'Dernier sprint' })
  ]),
  basePoints: 100,
  comboStep: 25,
  maxPoints: 200,
  defaultSeed: 'ATTRAPE-21',
  tileSize: 64,
  tileGap: 10,
  minReadingMs: 900
});

export function seededRandom(seed) {
  let hash = 2166136261;
  for (const c of String(seed)) hash = Math.imul(hash ^ c.charCodeAt(0), 16777619);
  return () => {
    hash += 0x6D2B79F5;
    let n = Math.imul(hash ^ hash >>> 15, 1 | hash);
    n ^= n + Math.imul(n ^ n >>> 7, 61 | n);
    return ((n ^ n >>> 14) >>> 0) / 4294967296;
  };
}
const shuffle = (items, random) => {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};
export const stageAt = (elapsed) => CONFIG.stages.reduce((stage, next) => elapsed >= next.at ? next : stage);
export const pointsFor = (combo) => Math.min(CONFIG.maxPoints, CONFIG.basePoints + Math.max(0, combo - 1) * CONFIG.comboStep);

/** Schedule never depends on viewport, frame rate, taps, or wall-clock date. */
export function generateSequence(seed = CONFIG.defaultSeed) {
  const random = seededRandom(seed);
  const triples = [[6, 7, 8], [5, 7, 9], [4, 8, 9], [7, 7, 7], [6, 6, 9], [5, 8, 8]];
  const smallBag = [1, 1, 1, 2, 2, 3, 3, 4, 5, 6, 7, 8, 9];
  const sequence = [];
  for (let at = 0, i = 0; at < CONFIG.roundMs; at += CONFIG.spawnMs, i++) {
    // Leave two previous columns free: no stacked / concealed targets.
    const recent = new Set(sequence.slice(-2).map(tile => tile.column));
    const choices = [0, 1, 2, 3].filter(c => !recent.has(c));
    sequence.push({ id: `tile-${i}`, at, column: choices[Math.floor(random() * choices.length)],
      value: smallBag[Math.floor(random() * smallBag.length)], fallMs: stageAt(at).fallMs });
  }
  for (let block = 0; block < CONFIG.roundMs / CONFIG.blockMs; block++) {
    const slots = sequence.filter(t => t.at >= block * CONFIG.blockMs && t.at < (block + 1) * CONFIG.blockMs);
    // Early in each block, three consecutive spawns coexist for >= 1.5 s.
    const start = Math.floor(random() * 2);
    const triple = shuffle(triples[Math.floor(random() * triples.length)], random);
    triple.forEach((value, i) => { slots[start + i].value = value; slots[start + i].guaranteedBlock = block; });
    const other = slots.filter((_, i) => i < start || i > start + 2);
    const lowSlots = shuffle(other, random);
    lowSlots[0].value = 1;
    if (lowSlots[1]) lowSlots[1].value = 1 + Math.floor(random() * 3);
  }
  return Object.freeze(sequence.map(Object.freeze));
}

/** Pure score transition, independent of clock and UI. */
export function addValue(state, value) {
  const total = state.sum + value;
  if (total > 21) return { ...state, sum: 0, combo: 0, feedback: { kind: 'bust', total } };
  if (total === 21) {
    const combo = state.combo + 1;
    const points = pointsFor(combo);
    return { ...state, sum: 0, combo, score: state.score + points, successes: state.successes + 1,
      bestCombo: Math.max(state.bestCombo, combo), feedback: { kind: 'success', total, points } };
  }
  return { ...state, sum: total, feedback: { kind: 'tap', total, value } };
}

/** One monotonic clock, one round. Call tick/hit with performance.now(). */
export class Game {
  constructor(seed = CONFIG.defaultSeed) {
    this.seed = String(seed);
    this.sequence = generateSequence(this.seed);
    this.state = this.freshState('idle');
    this.consumed = new Set();
    this.startedAt = 0;
    this.pauseStarted = 0;
    this.pausedMs = 0;
  }
  freshState(status) {
    return { status, elapsed: 0, countdown: 3, sum: 0, score: 0, combo: 0, successes: 0, bestCombo: 0, feedback: null };
  }
  start(now) {
    this.state = this.freshState('countdown');
    this.consumed.clear();
    this.startedAt = now;
    this.pausedMs = 0;
    this.pauseStarted = 0;
    this.resumeStatus = null;
    return this.state;
  }
  tick(now) {
    if (!['countdown', 'running'].includes(this.state.status)) return this.state;
    const active = Math.max(0, now - this.startedAt - this.pausedMs);
    if (active < CONFIG.countdownMs) {
      this.state.countdown = Math.ceil((CONFIG.countdownMs - active) / 1000);
      return this.state;
    }
    this.state.countdown = 0;
    this.state.elapsed = Math.min(CONFIG.roundMs, active - CONFIG.countdownMs);
    this.state.status = this.state.elapsed >= CONFIG.roundMs ? 'ended' : 'running';
    return this.state;
  }
  visible() {
    if (this.state.status !== 'running') return [];
    return this.sequence.filter(t => !this.consumed.has(t.id) && this.state.elapsed >= t.at && this.state.elapsed < t.at + t.fallMs);
  }
  hit(id, now) {
    this.tick(now); // Enforce exact deadline even if rendering missed its final frame.
    if (this.state.status !== 'running' || this.consumed.has(id)) return null;
    const tile = this.sequence.find(t => t.id === id);
    if (!tile || this.state.elapsed < tile.at || this.state.elapsed >= tile.at + tile.fallMs) return null;
    this.consumed.add(id); // Atomic before UI/audio: a double tap is inert.
    this.state = addValue(this.state, tile.value);
    return this.state.feedback;
  }
  pause(now) {
    this.tick(now);
    if (!['countdown', 'running'].includes(this.state.status)) return false;
    this.resumeStatus = this.state.status;
    this.pauseStarted = now;
    this.state.status = 'paused';
    return true;
  }
  resume(now) {
    if (this.state.status !== 'paused') return false;
    this.pausedMs += Math.max(0, now - this.pauseStarted);
    this.state.status = this.resumeStatus;
    return true;
  }
}

/** A cancellable single animation chain, even after repeated replay/resume. */
export class FrameLoop {
  constructor(request, cancel, render) {
    this.request = request; this.cancel = cancel; this.render = render;
    this.handle = null; this.generation = 0;
  }
  stop() {
    this.generation++;
    if (this.handle !== null) this.cancel(this.handle);
    this.handle = null;
  }
  start() {
    this.stop();
    const generation = this.generation;
    const frame = now => {
      if (generation !== this.generation) return;
      this.handle = null;
      if (this.render(now) && generation === this.generation) this.handle = this.request(frame);
    };
    this.handle = this.request(frame);
  }
}
