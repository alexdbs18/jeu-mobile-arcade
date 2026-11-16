import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG, Game, FrameLoop, addValue, generateSequence, pointsFor } from '../games/attrape-21/game.js';
const scoreState = () => new Game().state;
const add = (state, values) => values.reduce(addValue, state);

test('8 + 7 + 6 = 100, second 21 = 225; combo caps at 200 points', () => {
  let state = add(scoreState(), [8, 7, 6]);
  assert.equal(state.score, 100); assert.equal(state.sum, 0); assert.equal(state.combo, 1);
  state = add(state, [8, 7, 6]);
  assert.equal(state.score, 225); assert.equal(state.successes, 2);
  for (let n = 3; n <= 8; n++) state = add(state, [8, 7, 6]);
  assert.equal(state.score, 1350); assert.equal(state.combo, 8); assert.equal(state.bestCombo, 8);
  assert.equal(pointsFor(99), 200);
});
test('9 + 8 + 6 exposes 23, resets sum and combo but keeps score and best combo', () => {
  let state = add(scoreState(), [8, 7, 6, 8, 7, 6]);
  state = add(state, [9, 8, 6]);
  assert.deepEqual(state.feedback, { kind: 'bust', total: 23 });
  assert.equal(state.score, 225); assert.equal(state.sum, 0); assert.equal(state.combo, 0); assert.equal(state.bestCombo, 2);
  assert.equal(add(state, [8, 7, 6]).score, 325);
});
test('single atomic tap, future/expired tiles ignored, deadline frozen', () => {
  const game = new Game('test'); game.start(0);
  assert.equal(game.hit('tile-0', 2999), null);
  const result = game.hit('tile-0', 3000);
  assert.ok(result); const snapshot = structuredClone(game.state);
  assert.equal(game.hit('tile-0', 3000), null);
  assert.deepEqual(game.state, snapshot);
  assert.equal(game.hit('tile-20', 3000), null);
  assert.equal(game.hit('tile-1', 9000), null);
  game.state = add(game.state, [9, 8, 6]);
  const score = game.state.score;
  assert.equal(game.hit('tile-39', 33000), null);
  assert.equal(game.state.status, 'ended'); assert.equal(game.state.score, score);
  const end = structuredClone(game.state); game.hit('tile-39', 34000); game.tick(99999);
  assert.deepEqual(game.state, end);
});
test('countdown is exactly 3 seconds, round is exactly 30 seconds', () => {
  const game = new Game(); game.start(120);
  assert.equal(game.tick(1119).countdown, 3);
  assert.equal(game.tick(1120).countdown, 2);
  assert.equal(game.tick(2120).countdown, 1);
  assert.equal(game.tick(3120).elapsed, 0); assert.equal(game.state.status, 'running');
  assert.equal(game.tick(33119).status, 'running');
  assert.equal(game.tick(33120).status, 'ended'); assert.equal(game.state.elapsed, 30000);
});
test('background pause freezes clock; explicit resume offsets all timing', () => {
  const game = new Game(); game.start(100);
  game.tick(5100); assert.equal(game.state.elapsed, 2000);
  assert.equal(game.pause(5100), true); game.tick(60000); assert.equal(game.state.elapsed, 2000);
  assert.equal(game.hit('tile-1', 60000), null);
  assert.equal(game.resume(60100), true); game.tick(60100); assert.equal(game.state.elapsed, 2000);
  game.tick(61100); assert.equal(game.state.elapsed, 3000);
  game.pause(61100); game.resume(71100); game.tick(72100); assert.equal(game.state.elapsed, 4000);
});
test('pause during countdown does not silently start a round', () => {
  const game = new Game(); game.start(0); game.pause(1200); game.resume(9000);
  assert.equal(game.tick(9000).countdown, 2);
  assert.equal(game.tick(10800).status, 'running'); assert.equal(game.state.elapsed, 0);
});
test('identical seed, schedule and elapsed state independent of frame rate', () => {
  assert.deepEqual(generateSequence('α 21'), generateSequence('α 21'));
  assert.notDeepEqual(generateSequence('a'), generateSequence('b'));
  const fast = new Game('same'), slow = new Game('same'); fast.start(0); slow.start(0);
  for (let now = 0; now < 27000; now += 1000 / 144) fast.tick(now);
  fast.tick(27000); slow.tick(27000);
  assert.deepEqual(fast.state, slow.state); assert.deepEqual(fast.visible(), slow.visible());
  const schedule = structuredClone(fast.sequence);
  for (let i = 0; i < 30; i++) fast.start(i * 100);
  assert.deepEqual(fast.sequence, schedule); assert.equal(fast.consumed.size, 0);
});
test('1000 seeds: every block has a readable 21, a 1, safe columns and exact cadence', () => {
  for (let seed = 0; seed < 1000; seed++) {
    const seq = generateSequence(String(seed));
    assert.equal(seq.length, 40);
    seq.forEach((tile, i) => {
      assert.equal(tile.at, i * 750); assert.ok(tile.value >= 1 && tile.value <= 9);
      assert.ok(tile.column >= 0 && tile.column <= 3);
      assert.ok(seq.slice(Math.max(0, i-2), i).every(prev => prev.column !== tile.column));
      assert.equal(tile.fallMs, tile.at < 10000 ? 4000 : tile.at < 20000 ? 3400 : 3000);
    });
    for (let block = 0; block < 6; block++) {
      const group = seq.filter(t => t.guaranteedBlock === block);
      assert.equal(group.length, 3); assert.equal(group.reduce((n, t) => n + t.value, 0), 21);
      assert.equal(new Set(group.map(t => t.column)).size, 3);
      const lastAppears = Math.max(...group.map(t => t.at));
      // UI caps height at 19% of arena, so a tile is fully visible through 81% of its fall.
      const firstClips = Math.min(...group.map(t => t.at + t.fallMs * .81));
      assert.ok(firstClips - lastAppears >= CONFIG.minReadingMs);
      assert.ok(lastAppears < (block + 1) * 5000);
      assert.ok(seq.some(t => t.value === 1 && Math.floor(t.at / 5000) === block));
    }
  }
});
test('replay never creates a second animation loop; stale callbacks cannot restart it', () => {
  let id = 0, frames = 0;
  const pending = new Map(), stale = [];
  const loop = new FrameLoop(cb => { pending.set(++id, cb); return id; }, id => { stale.push(pending.get(id)); pending.delete(id); }, () => { frames++; return true; });
  for (let i = 0; i < 25; i++) loop.start();
  assert.equal(pending.size, 1);
  for (const callback of stale) callback?.(1000);
  assert.equal(frames, 0); assert.equal(pending.size, 1);
  const [handle, cb] = [...pending][0]; pending.delete(handle); cb(2000);
  assert.equal(frames, 1); assert.equal(pending.size, 1);
  loop.stop(); assert.equal(pending.size, 0);
});
