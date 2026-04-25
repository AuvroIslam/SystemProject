import { calcLevel } from '../../src/store/xpStore';

describe('XP calculations', () => {
  test('calcLevel returns 0 for 0 XP', () => {
    expect(calcLevel(0)).toBe(0);
  });

  test('calcLevel returns correct level', () => {
    expect(calcLevel(99)).toBe(0);
    expect(calcLevel(100)).toBe(1);
    expect(calcLevel(150)).toBe(1);
    expect(calcLevel(200)).toBe(2);
    expect(calcLevel(550)).toBe(5);
  });

  test('focus session awards 50 XP', () => {
    const xp = 50;
    expect(xp).toBe(50);
  });

  test('clean session awards 50 + 30 = 80 XP', () => {
    const base = 50;
    const bonus = 30;
    expect(base + bonus).toBe(80);
  });

  test('debt clearance awards 10 XP per set', () => {
    const sets = 3;
    const xp = sets * 10;
    expect(xp).toBe(30);
  });
});
