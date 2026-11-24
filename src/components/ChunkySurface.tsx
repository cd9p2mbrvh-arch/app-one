import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { radius } from '@/theme';

type Props = {
  pressed: boolean;
  /** Height of the 3D edge when not pressed. */
  depth: number;
  face: string;
  edge: string;
  border: string;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

const BORDER = 2;

/**
 * The 3D "chunky" look: a face with a thick bottom border acting as its edge.
 * The edge is part of the face's own border (not a layer underneath), so
 * translucent faces show the background, not the edge colour. When pressed, the
 * edge collapses and the face moves down by the same amount.
 */
export function ChunkySurface({ pressed, depth, face, edge, border, style, children }: Props) {
  return (
    <View
      style={[
        {
          backgroundColor: face,
          borderRadius: radius.md,
          borderWidth: BORDER,
          borderColor: border,
          borderBottomColor: edge,
          borderBottomWidth: pressed ? BORDER : BORDER + depth,
          marginTop: pressed ? depth : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
