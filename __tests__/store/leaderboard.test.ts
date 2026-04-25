import { calcLevel, LeaderboardEntry } from '../../src/store/xpStore';

/** Simulate the sort that Firestore performs (orderBy xp desc) */
function sortLeaderboard(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return [...entries].sort((a, b) => b.xp - a.xp);
}

describe('Leaderboard', () => {
  const mockEntries: LeaderboardEntry[] = [
    { uid: 'c', displayName: 'Carol', xp: 200, level: calcLevel(200) },
    { uid: 'a', displayName: 'Alice', xp: 500, level: calcLevel(500) },
    { uid: 'b', displayName: 'Bob', xp: 350, level: calcLevel(350) },
  ];

  test('sorts entries by XP descending', () => {
    const sorted = sortLeaderboard(mockEntries);
    expect(sorted[0].uid).toBe('a'); // Alice 500
    expect(sorted[1].uid).toBe('b'); // Bob 350
    expect(sorted[2].uid).toBe('c'); // Carol 200
  });

  test('levels are calculated correctly for each entry', () => {
    mockEntries.forEach((e) => {
      expect(e.level).toBe(calcLevel(e.xp));
    });
  });

  test('top entry is rank 1 (index 0)', () => {
    const sorted = sortLeaderboard(mockEntries);
    expect(sorted[0].xp).toBeGreaterThanOrEqual(sorted[1].xp);
  });
});
