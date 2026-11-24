import { linesFor, LINES_EN } from '../lines';
import {
  DURATIONS_MIN,
  firstUnlocked,
  isUnlocked,
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
