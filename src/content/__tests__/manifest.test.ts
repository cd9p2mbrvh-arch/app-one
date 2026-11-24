import { linesFor, LINES_EN } from '../lines';
import {
  DURATIONS_MIN,
  firstUnlocked,
  isUnlocked,
  lockReason,
  MAX_DURATION_MIN,
  MIN_DURATION_MIN,
  MUSIC,
  SHARED_LINES_PER_THEME,
  THEMES,
  VOICE_LINES_PER_THEME,
  VOICES,
  type CatalogItem,
} from '../manifest';

const categories: [string, CatalogItem[]][] = [
  ['themes', THEMES],
  ['voices', VOICES],
  ['music', MUSIC],
];

describe.each(categories)('%s catalogue', (_name, items) => {
  it('has unique ids and labels', () => {
    expect(new Set(items.map((i) => i.id)).size).toBe(items.length);
    expect(new Set(items.map((i) => i.label)).size).toBe(items.length);
  });

  it('has valid unlock levels and something available at level 1', () => {
    for (const item of items) {
      expect(Number.isInteger(item.unlockLevel)).toBe(true);
      expect(item.unlockLevel).toBeGreaterThanOrEqual(1);
    }
    expect(isUnlocked(firstUnlocked(items, 1), 1)).toBe(true);
  });
});

describe('durations', () => {
  it('covers every minute from 3 to 60', () => {
    expect(DURATIONS_MIN[0]).toBe(MIN_DURATION_MIN);
    expect(DURATIONS_MIN.at(-1)).toBe(MAX_DURATION_MIN);
    expect(DURATIONS_MIN).toHaveLength(58);
  });
});

describe('unlocking', () => {
  it('unlocks items at their level', () => {
    const item = { unlockLevel: 3 };
    expect(isUnlocked(item, 2)).toBe(false);
    expect(isUnlocked(item, 3)).toBe(true);
  });
});

describe.each(THEMES.map((t) => t.id))('lines for theme "%s"', (themeId) => {
  const theme = LINES_EN[themeId];

  it('exist', () => {
    expect(theme).toBeDefined();
    expect(theme.theme).toBe(themeId);
  });

  it(`has ${SHARED_LINES_PER_THEME} unique shared lines`, () => {
    expect(theme.shared).toHaveLength(SHARED_LINES_PER_THEME);
    expect(new Set(theme.shared.map((l) => l.id)).size).toBe(SHARED_LINES_PER_THEME);
    expect(new Set(theme.shared.map((l) => l.text)).size).toBe(SHARED_LINES_PER_THEME);
  });

  it.each(VOICES.map((v) => v.id))(`has ${VOICE_LINES_PER_THEME} own lines for %s`, (voiceId) => {
    const own = theme.voices[voiceId];
    expect(own).toHaveLength(VOICE_LINES_PER_THEME);
    expect(new Set(own.map((l) => l.id)).size).toBe(VOICE_LINES_PER_THEME);
  });

  it('has short, non-empty lines', () => {
    const all = [...theme.shared, ...Object.values(theme.voices).flat()];
    for (const line of all) {
      expect(line.text.trim().length).toBeGreaterThan(5);
      expect(line.text.length).toBeLessThanOrEqual(120);
    }
  });

  it('gives each voice 130 distinct lines per session pool', () => {
    const pool = linesFor(themeId, 'voice1');
    expect(pool).toHaveLength(SHARED_LINES_PER_THEME + VOICE_LINES_PER_THEME);
    expect(new Set(pool.map((l) => l.id)).size).toBe(pool.length);
  });
});

describe('linesFor', () => {
  it('returns nothing for an unknown theme', () => {
    expect(linesFor('nope', 'voice1')).toEqual([]);
  });
});

describe('paid content', () => {
  const paid = [...VOICES, ...MUSIC].filter((i) => i.purchase);

  it('has three paid narrators and three paid music tracks', () => {
    expect(VOICES.filter((v) => v.purchase)).toHaveLength(3);
    expect(MUSIC.filter((m) => m.purchase)).toHaveLength(3);
  });

  it('uses unique product ids and a price label', () => {
    const ids = paid.map((i) => i.purchase!.productId);
    expect(new Set(ids).size).toBe(ids.length);
    for (const item of paid) expect(item.purchase!.priceLabel).toBe('$1');
  });

  it('locks paid items until bought, whatever the level', () => {
    const item = paid[0];
    expect(lockReason(item, 99)).toEqual({ kind: 'purchase', priceLabel: '$1' });
    expect(lockReason(item, 1, new Set([item.purchase!.productId]))).toBeNull();
  });

  it('still locks level items by level only', () => {
    const voice6 = VOICES.find((v) => v.id === 'voice6')!;
    expect(lockReason(voice6, 1)).toEqual({ kind: 'level', level: 5 });
    expect(lockReason(voice6, 5)).toBeNull();
  });
});
