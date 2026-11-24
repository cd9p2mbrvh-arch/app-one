import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

type Props = {
  /** Base colour of the placeholder portrait. */
  accent: string;
  width: number;
  height: number;
  /** Unique per instance so SVG gradient ids do not clash. */
  id: string;
};

/**
 * Placeholder portrait: a soft head-and-shoulders silhouette on a gradient in the
 * narrator's colour. Real portrait images will replace this component's use.
 */
export function NarratorPortrait({ accent, width, height, id }: Props) {
  const w = 100;
  const h = (100 * height) / width;
  const headR = 17;
  const headY = h * 0.42;
  return (
    <View style={{ width, height }} accessibilityElementsHidden importantForAccessibility="no">
      <Svg width={width} height={height} viewBox={`0 0 ${w} ${h}`}>
        <Defs>
          <LinearGradient id={`bg-${id}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={accent} stopOpacity={0.55} />
            <Stop offset="1" stopColor={accent} stopOpacity={1} />
          </LinearGradient>
          <LinearGradient id={`fig-${id}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.85} />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0.55} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width={w} height={h} fill={`url(#bg-${id})`} />
        <Circle cx={w / 2} cy={headY} r={headR} fill={`url(#fig-${id})`} />
        <Path
          d={`M ${w / 2 - 34} ${h} C ${w / 2 - 34} ${headY + 30}, ${w / 2 - 18} ${headY + 22}, ${w / 2} ${headY + 22} C ${w / 2 + 18} ${headY + 22}, ${w / 2 + 34} ${headY + 30}, ${w / 2 + 34} ${h} Z`}
          fill={`url(#fig-${id})`}
        />
      </Svg>
    </View>
  );
}
