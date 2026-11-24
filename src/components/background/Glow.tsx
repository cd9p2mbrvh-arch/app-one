import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

/** A soft round glow that fades to transparent at its edge. */
export function Glow({
  id,
  size,
  color,
  core = 0.9,
}: {
  id: string;
  size: number;
  color: string;
  /** Opacity at the centre. */
  core?: number;
}) {
  return (
    <Svg width={size} height={size}>
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={color} stopOpacity={core} />
          <Stop offset="0.55" stopColor={color} stopOpacity={core * 0.4} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
    </Svg>
  );
}
