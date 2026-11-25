import { parseHex } from './contrast';

const hex2 = (n: number) =>
  Math.round(Math.min(255, Math.max(0, n)))
    .toString(16)
    .padStart(2, '0');

/**
 * Lightens (amount > 0, towards white) or darkens (amount < 0, towards black) an
 * opaque colour. Used for soft gradients on tiles. Returns #RRGGBB.
 */
export function shade(hex: string, amount: number): string {
  const { r, g, b } = parseHex(hex);
  const target = amount > 0 ? 255 : 0;
  const t = Math.min(1, Math.abs(amount));
  return `#${[r, g, b].map((c) => hex2(c + (target - c) * t)).join('')}`.toUpperCase();
}

/** The same colour with an alpha (0–1), as #RRGGBBAA. */
export function withAlpha(hex: string, alpha: number): string {
  const { r, g, b } = parseHex(hex);
  return `#${[r, g, b].map(hex2).join('')}${hex2(alpha * 255)}`.toUpperCase();
}
