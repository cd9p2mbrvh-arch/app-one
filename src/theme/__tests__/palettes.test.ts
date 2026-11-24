import { contrastRatio, relativeLuminance } from '../contrast';
import { palettes } from '../palettes';

/** WCAG AA: 4.5 for normal text, 3 for large/bold text and UI elements. */
const AA_TEXT = 4.5;

describe('contrastRatio', () => {
  it('matches known WCAG values', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
  });

  it('is symmetric', () => {
    expect(contrastRatio('#66747C', '#F5F6F6')).toBeCloseTo(contrastRatio('#F5F6F6', '#66747C'));
  });

  it('rejects malformed colours', () => {
    expect(() => relativeLuminance('blue')).toThrow();
    expect(() => relativeLuminance('#FFF')).toThrow();
  });
});

describe.each(Object.entries(palettes))('palette "%s"', (_name, p) => {
  it.each([
    ['text on background', p.text, p.background],
    ['text on surface', p.text, p.surface],
    ['muted text on background', p.textMuted, p.background],
    ['muted text on surface', p.textMuted, p.surface],
    ['button text on primary', p.onPrimary, p.primary],
    ['accent on background', p.accent, p.background],
  ])('%s meets WCAG AA', (_label, fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it('progress fill is distinguishable from its track', () => {
    expect(contrastRatio(p.primary, p.track)).toBeGreaterThanOrEqual(3);
  });
});
