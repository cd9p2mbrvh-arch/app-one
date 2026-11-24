import { Text, type TextProps } from 'react-native';

import { typography, useTheme, type TypographyVariant } from '@/theme';

type Props = TextProps & {
  variant?: TypographyVariant;
  color?: string;
};

/** Text with the app's font, type scale and current text colour applied. */
export function AppText({ variant = 'body', color, style, ...rest }: Props) {
  const { colors } = useTheme();
  return <Text style={[typography[variant], { color: color ?? colors.text }, style]} {...rest} />;
}
