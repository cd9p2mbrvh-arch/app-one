/**
 * XP and levels (v1). Reaching level n+1 from level n costs 100 × n XP:
 * level 2 at 100 XP, level 3 at 300, level 4 at 600, level 5 at 1000 …
 */
export function xpToReachLevel(level: number): number {
  if (level <= 1) return 0;
  return (100 * (level - 1) * level) / 2;
}

export function levelForXp(xp: number): number {
  const safeXp = Number.isFinite(xp) && xp > 0 ? xp : 0;
  let level = 1;
  while (xpToReachLevel(level + 1) <= safeXp) level++;
  return level;
}
