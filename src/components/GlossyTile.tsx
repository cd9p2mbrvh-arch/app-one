import Ionicons from '@expo/vector-icons/Ionicons';
import { useId, type ComponentProps } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, Ellipse, LinearGradient, Rect, Stop } from 'react-native-svg';

import { shade, withAlpha } from '@/theme/color';

type Props = {
  /** Base colour; the tile shades from a lighter to a deeper version of it. */
  color: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  size: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * A soft "3D" icon tile: rounded square with a diagonal gradient, a glossy
 * highlight and a coloured glow underneath, like a clay or plastic toy block.
 */
export function GlossyTile({ color, icon, size, style }: Props) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const r = size * 0.3;
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: r,
          boxShadow: `0px ${size * 0.14}px ${size * 0.3}px ${withAlpha(shade(color, -0.3), 0.45)}`,
        },
        style,
      ]}
    >
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={shade(color, 0.35)} />
            <Stop offset="1" stopColor={shade(color, -0.22)} />
          </LinearGradient>
          <LinearGradient id={`h${id}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.55} />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect width={size} height={size} rx={r} fill={`url(#g${id})`} />
        {/* Inner shadow at the bottom edge for depth. */}
        <Rect
          x={size * 0.06}
          y={size * 0.08}
          width={size * 0.88}
          height={size * 0.86}
          rx={r * 0.85}
          fill="none"
          stroke={withAlpha(shade(color, -0.45), 0.25)}
          strokeWidth={size * 0.04}
        />
        {/* Glossy highlight at the top. */}
        <Ellipse
          cx={size * 0.42}
          cy={size * 0.24}
          rx={size * 0.32}
          ry={size * 0.15}
          fill={`url(#h${id})`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.icon]}>
        <Ionicons
          name={icon}
          size={size * 0.46}
          color="#FFFFFF"
          style={{ textShadowColor: withAlpha(shade(color, -0.5), 0.4), textShadowRadius: 6 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  icon: { alignItems: 'center', justifyContent: 'center' },
});
