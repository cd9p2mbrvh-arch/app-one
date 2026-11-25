import type { ViewStyle } from 'react-native';

import { withAlpha } from './color';
import { UI_MATERIAL } from './palettes';
import { useTheme } from './ThemeProvider';

/**
 * Styles for the app's card material. With the glass material: see-through fill,
 * bright edge, a soft shadow and a thin highlight along the top edge, like light
 * catching glass. With the chunky material it is just the card colour and border.
 */
export function useGlass() {
  const { colors, backdrop } = useTheme();
  const dark = backdrop.glass === 'dark';
  if (UI_MATERIAL !== 'glass') {
    return {
      enabled: false,
      card: { backgroundColor: colors.surface, borderColor: colors.border } as ViewStyle,
      /** Extra shadow to append to a custom boxShadow (glow), or '' */
      highlight: '',
      /** Soft drop shadow + top highlight, or undefined */
      shadow: undefined as string | undefined,
    };
  }
  const highlight = `inset 0px 1px 0px ${withAlpha('#FFFFFF', dark ? 0.22 : 0.9)}`;
  const shadow = `0px 8px 20px ${withAlpha(colors.glassShadow, dark ? 0.35 : 0.13)}, ${highlight}`;
  return {
    enabled: true,
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      boxShadow: shadow,
    } as ViewStyle,
    highlight: `, ${highlight}`,
    shadow,
  };
}
