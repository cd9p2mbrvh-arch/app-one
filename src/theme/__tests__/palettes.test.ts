import { composite, contrastRatio, parseHex, relativeLuminance } from '../contrast';
import { looks } from '../palettes';

/** WCAG AA: 4.5 for normal text, 3 for large/bold text and UI elements. */
const AA_TEXT = 4.5;
const AA_UI = 3;

describe('colour utilities', () => {
  it('matches known WCAG contrast values', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
  });

  it('is symmetric', () => {
    expect(contrastRatio('#66747C', '#F5F6F6')).toBeCloseTo(contrastRatio('#F5F6F6', '#66747C'));
  });

  it('composites translucent colours', () => {
    expect(composite('#FFFFFF80', '#000000')).toBe('#808080');
    expect(composite('#FF0000', '#00FF00')).toBe('#ff0000');
  });

  it('rejects malformed or translucent input where opaque is required', () => {
    expect(() => parseHex('blue')).toThrow();
    expect(() => relativeLuminance('#FFFFFF80')).toThrow();
    expect(() => composite('#FFFFFF', '#00000080')).toThrow();
  });
});

describe.each(Object.entries(looks))('%s look', (_period, { colors: c, backdrop }) => {
  // Every colour the background can show: gradient stops, blob centres and waves
  // (taken at full strength, the worst case).
  const backgrounds = [
    ...backdrop.gradient,
    ...backdrop.blobs.map((b) => b.color),
    ...backdrop.waves.map((w) => w.color),
  ];

  it.each(backgrounds)('text is readable directly on background %s', (bg) => {
    expect(contrastRatio(c.text, bg)).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrastRatio(c.textMuted, bg)).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrastRatio(c.accent, bg)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it.each(backgrounds)('text is readable on a card over background %s', (bg) => {
    const card = composite(c.surface, bg);
    expect(contrastRatio(c.text, card)).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrastRatio(c.textMuted, card)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it.each(backgrounds)('primary stands out from a card over background %s', (bg) => {
    const card = composite(c.surface, bg);
    expect(contrastRatio(c.primary, card)).toBeGreaterThanOrEqual(AA_UI);
  });

  it('button text is readable on primary', () => {
    expect(contrastRatio(c.onPrimary, c.primary)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it.each(backgrounds)('progress fill is distinguishable from its track over %s', (bg) => {
    expect(contrastRatio(c.primary, composite(c.track, bg))).toBeGreaterThanOrEqual(AA_UI);
  });
});
