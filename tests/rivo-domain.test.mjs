import test from 'node:test';
import assert from 'node:assert/strict';
import '../rivo/src/domain.js';

const domain = globalThis.RivoDomain;
const results = count => Array.from({ length: count }, (_, index) => ({
  userId: `u${index + 1}`, score: count - index, durationMs: 1000 + index
}));

test('points use the normalized scale for groups of 2, 7, 15 and larger', () => {
  for (const count of [2, 7, 15, 64]) {
    const ranked = domain.rankResults(results(count));
    assert.equal(ranked[0].points, 100);
    assert.equal(ranked.at(-1).points, 10);
    assert.ok(ranked.every(row => Number.isInteger(row.points)));
  }
  assert.equal(domain.scoreForRank(1, 1), 100);
});

test('equal results receive the rounded average for their occupied positions', () => {
  const ranked = domain.rankResults([
    { userId: 'a', score: 9, durationMs: 1000 },
    { userId: 'b', score: 8, durationMs: 1000 },
    { userId: 'c', score: 8, durationMs: 1000 },
    { userId: 'd', score: 7, durationMs: 1000 }
  ]);
  assert.equal(ranked[1].rank, 2);
  assert.equal(ranked[2].rank, 2);
  assert.equal(ranked[1].points, 55);
  assert.equal(ranked[2].points, 55);
});

test('double points affect competition points only', () => {
  const [row] = domain.rankResults([{ userId: 'a', score: 4, durationMs: 999 }], { multiplierFor: () => 2 });
  assert.equal(row.score, 4);
  assert.equal(row.basePoints, 100);
  assert.equal(row.points, 200);
});

test('season calendar has ten unique games and exact contiguous 24-hour windows', () => {
  const ids = Array.from({ length: 10 }, (_, index) => `game-${index}`);
  const calendar = domain.buildSeasonCalendar(ids, '2026-10-24T16:00:00.000Z');
  assert.equal(calendar.length, 10);
  assert.equal(Date.parse(calendar[0].startsAt), Date.parse('2026-10-24T16:00:00.000Z'));
  calendar.forEach((day, index) => {
    assert.equal(Date.parse(day.endsAt) - Date.parse(day.startsAt), domain.DAY_MS);
    if (index) assert.equal(day.startsAt, calendar[index - 1].endsAt);
  });
  assert.throws(() => domain.buildSeasonCalendar(ids.slice(1), Date.now()), /exactly 10/);
  assert.throws(() => domain.buildSeasonCalendar([...ids.slice(1), ids[1]], Date.now()), /cannot repeat/);
});

test('two vote dates start on day four and are separated by at least three days', () => {
  for (const value of [0, 0.3, 0.7, 0.999]) {
    const [first, second] = domain.chooseVoteDays(() => value);
    assert.ok(first >= 4 && second <= 10 && second - first >= 3);
  }
});

test('vote tie-break selects one of the tied options using injected randomness', () => {
  const outcome = domain.chooseVoteWinner(['a', 'b', 'c'], ['a', 'b'], () => 0.999);
  assert.deepEqual(outcome.tied, ['a', 'b', 'c']);
  assert.equal(outcome.winner, 'c');
});
