import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type HostInstance,
} from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from '../AppText';
import type { IconName } from '../OptionCard';
import {
  angleDelta,
  clampPosition,
  geometryFor,
  indexAt,
  offsetOf,
  placementFor,
  pointerAngle,
  positionFor,
  settlePosition,
} from './wheelMath';

export type WheelItem = {
  key: string;
  label: string;
  /** Shown inside the item's circle; falls back to `text`. */
  icon?: IconName;
  /** Short text inside the circle (e.g. "10"), used when there is no icon. */
  text?: string;
  locked?: boolean;
  /** Spoken and shown for locked items, e.g. "Unlocks at level 3". */
  lockHint?: string;
};

type Props = {
  items: WheelItem[];
  selectedIndex: number;
  /** Called when the wheel comes to rest on a different item. */
  onChange: (index: number) => void;
  accessibilityLabel: string;
  /** Diameter in pixels. */
  size: number;
  /** Content for the middle of the wheel; receives the item at the top. */
  renderCenter?: (item: WheelItem) => ReactNode;
  testID?: string;
};

const ITEM_SIZE = 58;
const SETTLE_MS = 220;

function tick() {
  Haptics.selectionAsync().catch(() => {});
}

/**
 * A dial you turn with your finger. Items sit around the rim; the one at the top
 * is the current choice. Every step past the top gives a light haptic tick.
 */
export function RotaryWheel({
  items,
  selectedIndex,
  onChange,
  accessibilityLabel,
  size,
  renderCenter,
  testID,
}: Props) {
  const { colors } = useTheme();
  const g = useMemo(() => geometryFor(items.length), [items.length]);
  const radius = size / 2 - ITEM_SIZE / 2 - 6;

  const [pos, setPos] = useState(selectedIndex);
  const posRef = useRef(selectedIndex);
  const [prevSelected, setPrevSelected] = useState(selectedIndex);

  // Follow selection changes made from outside (e.g. a reset).
  if (selectedIndex !== prevSelected) {
    setPrevSelected(selectedIndex);
    if (indexAt(pos, g) !== selectedIndex) setPos(selectedIndex);
  }

  // Keep the ref used by gesture handlers in step with what is drawn.
  useEffect(() => {
    posRef.current = pos;
  }, [pos]);

  const tickedIndex = useRef(indexAt(selectedIndex, g));
  const anim = useRef(new Animated.Value(selectedIndex)).current;
  const center = useRef({ x: 0, y: 0 });
  const viewRef = useRef<HostInstance>(null);

  const moveTo = (next: number) => {
    posRef.current = next;
    setPos(next);
    const idx = indexAt(next, g);
    if (idx !== tickedIndex.current) {
      tickedIndex.current = idx;
      tick();
    }
  };

  const settleTo = (target: number) => {
    anim.stopAnimation();
    anim.setValue(posRef.current);
    const id = anim.addListener(({ value }) => moveTo(value));
    Animated.timing(anim, {
      toValue: target,
      duration: SETTLE_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(() => {
      anim.removeListener(id);
      moveTo(target);
      const idx = indexAt(target, g);
      if (idx !== prevSelected) onChange(idx);
    });
  };

  const measureCenter = () => {
    viewRef.current?.measureInWindow((x, y, w, h) => {
      center.current = { x: x + w / 2, y: y + h / 2 };
    });
  };

  const drag = useRef({ startX: 0, startY: 0, angle: 0, time: 0, velocity: 0 });

  const onTouchStart = (e: GestureResponderEvent) => {
    drag.current.startX = e.nativeEvent.pageX;
    drag.current.startY = e.nativeEvent.pageY;
  };

  // Become the touch responder once the finger has moved a little, so taps on
  // items still work and a drag anywhere on the wheel turns it.
  const onMoveShouldSetResponder = (e: GestureResponderEvent) =>
    Math.hypot(
      e.nativeEvent.pageX - drag.current.startX,
      e.nativeEvent.pageY - drag.current.startY,
    ) > 6;

  const onResponderGrant = (e: GestureResponderEvent) => {
    anim.stopAnimation();
    measureCenter();
    const { pageX, pageY, timestamp } = e.nativeEvent;
    drag.current.angle = pointerAngle(pageX, pageY, center.current.x, center.current.y);
    drag.current.time = timestamp;
    drag.current.velocity = 0;
  };

  const onResponderMove = (e: GestureResponderEvent) => {
    const { pageX, pageY, timestamp } = e.nativeEvent;
    const angle = pointerAngle(pageX, pageY, center.current.x, center.current.y);
    const steps = -angleDelta(drag.current.angle, angle) / g.stepDeg;
    const dt = Math.max(1, timestamp - drag.current.time);
    drag.current.angle = angle;
    drag.current.time = timestamp;
    drag.current.velocity = steps / dt;
    moveTo(clampPosition(posRef.current + steps, g));
  };

  const onResponderRelease = () =>
    settleTo(settlePosition(posRef.current, drag.current.velocity, g));

  const step = (direction: 1 | -1) => {
    const next = clampPosition(Math.round(posRef.current) + direction, g);
    settleTo(next);
  };

  const current = items[indexAt(pos, g)];
  const valueText = current
    ? current.locked && current.lockHint
      ? `${current.label}, locked. ${current.lockHint}`
      : current.label
    : '';

  return (
    <View
      ref={viewRef}
      onLayout={measureCenter}
      testID={testID}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ text: valueText }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => step(e.nativeEvent.actionName === 'increment' ? 1 : -1)}
      style={{ width: size, height: size }}
      onTouchStart={onTouchStart}
      onMoveShouldSetResponder={onMoveShouldSetResponder}
      onResponderTerminationRequest={() => false}
      onResponderGrant={onResponderGrant}
      onResponderMove={onResponderMove}
      onResponderRelease={onResponderRelease}
      onResponderTerminate={onResponderRelease}
    >
      <View
        style={[
          StyleSheet.absoluteFill,
          styles.ring,
          { borderRadius: size / 2, borderColor: colors.border, backgroundColor: colors.surface },
        ]}
      />
      <View style={[styles.pointer, { left: size / 2 - 7, borderTopColor: colors.primary }]} />

      <View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="none">
        {current && renderCenter ? renderCenter(current) : null}
      </View>

      {items.map((item, i) => {
        const p = placementFor(offsetOf(i, pos, g), g, radius);
        if (!p.visible) return null;
        const isCurrent = i === indexAt(pos, g);
        const scale = 0.78 + 0.42 * p.emphasis;
        const fg = isCurrent ? colors.onPrimary : colors.text;
        return (
          <Pressable
            key={item.key}
            testID={testID ? `${testID}-item-${item.key}` : undefined}
            onPress={() => settleTo(positionFor(i, posRef.current, g))}
            style={[
              styles.item,
              {
                left: size / 2 + p.x - ITEM_SIZE / 2,
                top: size / 2 + p.y - ITEM_SIZE / 2,
                opacity: p.opacity * (item.locked && !isCurrent ? 0.6 : 1),
                transform: [{ scale }],
                backgroundColor: isCurrent ? colors.primary : colors.surface,
                borderColor: isCurrent ? colors.primaryEdge : colors.border,
              },
            ]}
          >
            {item.icon ? (
              <Ionicons name={item.icon} size={24} color={isCurrent ? fg : colors.primary} />
            ) : (
              <AppText variant="label" color={fg}>
                {item.text ?? item.label}
              </AppText>
            )}
            {item.locked ? (
              <View
                style={[
                  styles.lock,
                  {
                    backgroundColor: colors.text,
                    borderColor: isCurrent ? colors.primary : colors.surface,
                  },
                ]}
              >
                <Ionicons
                  name="lock-closed"
                  size={11}
                  color={colors.onPrimary === colors.text ? colors.primary : colors.surface}
                />
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  ring: { borderWidth: 2 },
  pointer: {
    position: 'absolute',
    top: -2,
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  center: { alignItems: 'center', justifyContent: 'center', padding: ITEM_SIZE + 16 },
  item: {
    position: 'absolute',
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: ITEM_SIZE / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lock: {
    position: 'absolute',
    right: -4,
    top: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
