export { baseLooks, looks, UI_MATERIAL, type Backdrop, type Look, type Palette } from './palettes';
export { ThemeProvider, useTheme } from './ThemeProvider';
export { useGlass } from './useGlass';
export { getTimeOfDay, PERIOD_START_HOUR, type TimeOfDay } from './timeOfDay';

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;

export const radius = { md: 16, lg: 24, pill: 999 } as const;

/** Height of the 3D edge under chunky buttons and cards. */
export const edge = { button: 5, card: 4 } as const;

export const fonts = {
  regular: 'PlusJakartaSans_500Medium',
  bold: 'PlusJakartaSans_700Bold',
  black: 'PlusJakartaSans_800ExtraBold',
} as const;

export const typography = {
  title: { fontFamily: fonts.black, fontSize: 28, lineHeight: 34 },
  heading: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 26 },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 22 },
  label: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 20 },
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  button: { fontFamily: fonts.black, fontSize: 16, lineHeight: 20, letterSpacing: 0.8 },
} as const;

export type TypographyVariant = keyof typeof typography;
