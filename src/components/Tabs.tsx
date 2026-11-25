import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import { fonts, radius, spacing, useTheme } from '@/theme';

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
};

const PAD = spacing.xs;
const GAP = spacing.xs;

/**
 * A row of pill-shaped tabs. A filled pill slides to the active tab;
 * completed tabs show a tick.
 */
export function Tabs<K extends string>({ tabs, active, onChange }: Props<K>) {
  const { colors } = useTheme();
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

  return (
    <View
      accessibilityRole="tablist"
      onLayout={(e) => setBarWidth(e.nativeEvent.layout.width - 4)}
      style={[styles.bar, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      {measured ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.indicator,
            {
              width: tabWidth,
              backgroundColor: colors.primary,
              transform: [{ translateX: offset }],
            },
          ]}
        />
      ) : null}
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        const fg = isActive ? colors.onPrimary : colors.text;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            accessibilityRole="tab"
            accessibilityLabel={tab.done ? `${tab.label}, done` : tab.label}
            accessibilityState={{ selected: isActive }}
            testID={`tab-${tab.key}`}
            style={[styles.tab, isActive && !measured && { backgroundColor: colors.primary }]}
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
