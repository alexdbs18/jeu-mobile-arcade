/* Pure rules shared by the browser preview and server-side Supabase functions. */
(() => {
  'use strict';
  const DAY_MS = 24 * 60 * 60 * 1000;
  const SEASON_DAYS = 10;
  const randomIndex = (length, random = Math.random) => {
    if (!Number.isInteger(length) || length < 1) throw new RangeError('length must be positive');
    const value = random();
    if (!(value >= 0 && value < 1)) throw new RangeError('random source must return a value in [0, 1)');
    return Math.floor(value * length);
  };

  function scoreForRank(participants, rank) {
    if (!Number.isInteger(participants) || participants < 1) throw new RangeError('participants must be positive');
    if (!Number.isInteger(rank) || rank < 1 || rank > participants) throw new RangeError('rank is out of range');
    return participants === 1
      ? 100
      : Math.floor(10 + 90 * (participants - rank) / (participants - 1) + 0.5);
  }

  function rankResults(rows, { multiplierFor = () => 1 } = {}) {
    if (!Array.isArray(rows) || rows.some(row => !row || row.userId == null ||
      !Number.isFinite(row.score) || !Number.isFinite(row.durationMs) || row.durationMs < 0)) {
      throw new TypeError('Each result needs a userId, finite score and non-negative durationMs');
    }
    if (new Set(rows.map(row => String(row.userId))).size !== rows.length) {
      throw new RangeError('A player can only appear once in a daily ranking');
    }
    const ordered = rows.map(row => ({ ...row })).sort((a, b) =>
      b.score - a.score || a.durationMs - b.durationMs || String(a.userId).localeCompare(String(b.userId)));
    const count = ordered.length;
    return ordered.map((row, index) => {
      const previous = ordered[index - 1];
      const tiedWithPrevious = previous && previous.score === row.score && previous.durationMs === row.durationMs;
      const first = tiedWithPrevious ? ordered.findIndex(item => item.score === row.score && item.durationMs === row.durationMs) : index;
      const tieSize = ordered.filter(item => item.score === row.score && item.durationMs === row.durationMs).length;
      const occupiedRanks = Array.from({ length: tieSize }, (_, offset) => scoreForRank(count, first + offset + 1));
      const basePoints = Math.floor(occupiedRanks.reduce((sum, points) => sum + points, 0) / tieSize + 0.5);
      const multiplier = multiplierFor(row.userId);
      if (multiplier !== 1 && multiplier !== 2) throw new RangeError('multiplier must be 1 or 2');
      return { ...row, rank: first + 1, basePoints, multiplier, points: basePoints * multiplier };
    });
  }

  function buildSeasonCalendar(gameIds, startsAt) {
    if (!Array.isArray(gameIds) || gameIds.length !== SEASON_DAYS) {
      throw new RangeError('A season needs exactly 10 distinct playable games');
    }
    if (new Set(gameIds).size !== gameIds.length) throw new RangeError('A game cannot repeat within a season');
    const startMs = typeof startsAt === 'number' ? startsAt : Date.parse(startsAt);
    if (!Number.isFinite(startMs)) throw new TypeError('startsAt must be a valid instant resolved in the league timezone');
    return gameIds.map((gameId, index) => ({
      dayNumber: index + 1,
      gameId,
      startsAt: new Date(startMs + index * DAY_MS).toISOString(),
      endsAt: new Date(startMs + (index + 1) * DAY_MS).toISOString()
    }));
  }

  function chooseVoteDays(random = Math.random) {
    const pairs = [];
    for (let first = 4; first <= SEASON_DAYS; first++) {
      for (let second = first + 3; second <= SEASON_DAYS; second++) pairs.push([first, second]);
    }
    return pairs[randomIndex(pairs.length, random)];
  }

  function chooseVoteCandidates(gameIds, random = Math.random) {
    const pool = [...new Set(gameIds)];
    if (pool.length < 3) throw new RangeError('A vote needs three distinct unplayed, unscheduled games');
    const candidates = [];
    while (candidates.length < 3) candidates.push(pool.splice(randomIndex(pool.length, random), 1)[0]);
    return candidates;
  }

  function chooseVoteWinner(candidates, ballots, random = Math.random) {
    if (!Array.isArray(candidates) || candidates.length !== 3 || new Set(candidates).size !== 3) {
      throw new RangeError('A vote needs exactly three distinct candidates');
    }
    const counts = new Map(candidates.map(id => [id, 0]));
    for (const ballot of ballots) {
      if (!counts.has(ballot)) throw new RangeError('Ballot is not one of the candidates');
      counts.set(ballot, counts.get(ballot) + 1);
    }
    const high = Math.max(...counts.values());
    const tied = candidates.filter(id => counts.get(id) === high);
    return { winner: tied[randomIndex(tied.length, random)], tied, counts: Object.fromEntries(counts) };
  }

  globalThis.RivoDomain = Object.freeze({
    DAY_MS, SEASON_DAYS, scoreForRank, rankResults, buildSeasonCalendar,
    chooseVoteDays, chooseVoteCandidates, chooseVoteWinner
  });
})();
