type RGBA = { r: number; g: number; b: number; a: number };

/** Parses #RRGGBB or #RRGGBBAA. */
export function parseHex(hex: string): RGBA {
  const match = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(hex);
  if (!match) {
    throw new Error(`Expected a #RRGGBB or #RRGGBBAA colour, got "${hex}"`);
  }
  const n = parseInt(match[1], 16);
  return {
    r: (n >> 16) & 255,
    g: (n >> 8) & 255,
    b: n & 255,
    a: match[2] ? parseInt(match[2], 16) / 255 : 1,
  };
}

function toHex({ r, g, b }: RGBA): string {
  return `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`;
}

/** Paints a (possibly translucent) colour over an opaque background. Returns #RRGGBB. */
export function composite(fg: string, bg: string): string {
  const f = parseHex(fg);
  const b = parseHex(bg);
  if (b.a !== 1) throw new Error(`Background must be opaque, got "${bg}"`);
  const mix = (x: number, y: number) => x * f.a + y * (1 - f.a);
  return toHex({ r: mix(f.r, b.r), g: mix(f.g, b.g), b: mix(f.b, b.b), a: 1 });
}

/** WCAG 2.x relative luminance of an opaque colour. */
export function relativeLuminance(hex: string): number {
  const c = parseHex(hex);
  if (c.a !== 1) throw new Error(`Luminance needs an opaque colour, got "${hex}"`);
  const channels = [c.r, c.g, c.b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

/** WCAG contrast ratio between two opaque colours, from 1 (none) to 21 (black on white). */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
