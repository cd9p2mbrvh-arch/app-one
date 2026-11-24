import { levelForXp, xpToReachLevel } from '../progress';

describe('levels', () => {
  it.each([
    [1, 0],
    [2, 100],
    [3, 300],
    [4, 600],
    [5, 1000],
  ])('level %i starts at %i XP', (level, xp) => {
    expect(xpToReachLevel(level)).toBe(xp);
    expect(levelForXp(xp)).toBe(level);
    expect(levelForXp(xp - 1)).toBe(Math.max(1, level - 1));
  });

  it('treats invalid XP as zero', () => {
    expect(levelForXp(-50)).toBe(1);
    expect(levelForXp(Number.NaN)).toBe(1);
  });
});
