import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { BlurView } from 'expo-blur';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { fonts, radius, spacing, useTheme } from '@/theme';
import { withAlpha } from '@/theme/color';

import { AppText } from './AppText';

export type TabItem<K extends string> = {
  key: K;
  label: string;
  /** Shows a tick, e.g. when that step has been completed. */
  done?: boolean;
};

type Props<K extends string> = {
  tabs: TabItem<K>[];
  active: K;
  onChange: (key: K) => void;
  /**
   * 'solid': filled pill on a card-coloured bar (the first design).
   * 'glass': see-through frosted glass bar with a brighter glass "lens" on the
   * active tab (experiment).
   */
  variant?: 'solid' | 'glass';
};

const PAD = spacing.xs;
const GAP = spacing.xs;

/**
 * A row of pill-shaped tabs. A pill slides to the active tab; completed tabs
 * show a tick. Comes in a solid and a glass look (see `variant`).
 */
export function Tabs<K extends string>({ tabs, active, onChange, variant = 'solid' }: Props<K>) {
  const { colors, backdrop } = useTheme();
  const glass = variant === 'glass';
  const dark = backdrop.glass === 'dark';
  const [barWidth, setBarWidth] = useState(0);
  const activeIndex = Math.max(
    0,
    tabs.findIndex((t) => t.key === active),
  );
  const tabWidth = barWidth > 0 ? (barWidth - PAD * 2 - GAP * (tabs.length - 1)) / tabs.length : 0;
  const [offset] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (tabWidth <= 0) return;
    Animated.spring(offset, {
      toValue: activeIndex * (tabWidth + GAP),
      friction: 8,
      tension: 90,
      useNativeDriver: true,
    }).start();
  }, [activeIndex, tabWidth, offset]);

  const measured = tabWidth > 0;

  const activeBg = glass ? withAlpha('#FFFFFF', dark ? 0.2 : 0.6) : colors.primary;
  const barStyle = glass
    ? {
        backgroundColor: withAlpha('#FFFFFF', dark ? 0.06 : 0.18),
        borderColor: withAlpha('#FFFFFF', dark ? 0.28 : 0.75),
        boxShadow: `0px 8px 24px ${withAlpha('#000000', dark ? 0.3 : 0.1)}`,
      }
    : { backgroundColor: colors.surface, borderColor: colors.border };

  return (
    <View
      accessibilityRole="tablist"
      onLayout={(e) => setBarWidth(e.nativeEvent.layout.width - 4)}
      style={[styles.bar, glass && styles.glassBar, barStyle]}
    >
      {glass ? (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.clip]}>
          <BlurView intensity={35} tint={backdrop.glass} style={StyleSheet.absoluteFill} />
          {/* Light falling on the top half of the glass. */}
          <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
            <Defs>
              <LinearGradient id="tabsSheen" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#FFFFFF" stopOpacity={dark ? 0.16 : 0.45} />
                <Stop offset="0.55" stopColor="#FFFFFF" stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#tabsSheen)" />
          </Svg>
        </View>
      ) : null}
      {measured ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.indicator,
            {
              width: tabWidth,
              backgroundColor: activeBg,
              transform: [{ translateX: offset }],
            },
            glass && {
              borderWidth: 1,
              borderColor: withAlpha('#FFFFFF', dark ? 0.45 : 0.95),
              boxShadow: `0px 3px 10px ${withAlpha('#000000', dark ? 0.25 : 0.12)}, inset 0px 1px 0px ${withAlpha('#FFFFFF', dark ? 0.35 : 1)}`,
            },
          ]}
        />
      ) : null}
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        const fg = isActive ? (glass ? colors.primary : colors.onPrimary) : colors.text;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            accessibilityRole="tab"
            accessibilityLabel={tab.done ? `${tab.label}, done` : tab.label}
            accessibilityState={{ selected: isActive }}
            testID={`tab-${tab.key}`}
            style={[styles.tab, isActive && !measured && { backgroundColor: activeBg }]}
          >
            {tab.done ? <Ionicons name="checkmark-circle" size={14} color={fg} /> : null}
            <AppText variant="caption" color={fg} style={styles.label} numberOfLines={1}>
              {tab.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderRadius: radius.pill,
    borderWidth: 2,
    padding: PAD,
    gap: GAP,
  },
  glassBar: { borderWidth: 1, padding: PAD + 1 },
  clip: { borderRadius: radius.pill, overflow: 'hidden' },
  indicator: {
    position: 'absolute',
    top: PAD,
    bottom: PAD,
    left: PAD,
    borderRadius: radius.pill,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  label: { fontFamily: fonts.bold },
});
