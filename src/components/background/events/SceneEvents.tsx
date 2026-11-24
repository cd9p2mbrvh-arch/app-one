import { useEffect, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { delayBetween, EVENT_GAP_MS, FIRST_EVENT_MS, pickEvent } from './schedule';

export type EventProps = {
  width: number;
  height: number;
  topInset: number;
  /** Random value in [0, 1) chosen per occurrence, for position/direction. */
  variant: number;
  /** Must be called when the event's animation has finished. */
  onDone: () => void;
};

export type SceneEvent = (props: EventProps) => ReactNode;

type Props = {
  events: Record<string, SceneEvent>;
  width: number;
  height: number;
  topInset: number;
  still: boolean;
};

type Current = { name: string; id: number; variant: number };

/**
 * Plays one occasional event at a time, chosen at random from `events`, with a
 * random pause between them. Nothing plays when motion is reduced.
 */
export function SceneEvents({ events, width, height, topInset, still }: Props) {
  const [current, setCurrent] = useState<Current | null>(null);
  const scheduleNext = useRef<() => void>(() => {});
  const names = Object.keys(events).sort().join('|');

  useEffect(() => {
    if (still) return;
    const list = names.split('|');
    const state = {
      timer: null as ReturnType<typeof setTimeout> | null,
      last: null as string | null,
      count: 0,
    };
    const schedule = (range: [number, number]) => {
      state.timer = setTimeout(
        () => {
          const name = pickEvent(list, state.last, Math.random);
          state.last = name;
          state.count += 1;
          setCurrent({ name, id: state.count, variant: Math.random() });
        },
        delayBetween(range, Math.random),
      );
    };
    scheduleNext.current = () => schedule(EVENT_GAP_MS);
    schedule(FIRST_EVENT_MS);
    return () => {
      if (state.timer) clearTimeout(state.timer);
      scheduleNext.current = () => {};
    };
  }, [still, names]);

  if (!current || still) return null;
  const Event = events[current.name];
  if (!Event) return null;

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      testID={`scene-event-${current.name}`}
    >
      <Event
        key={current.id}
        width={width}
        height={height}
        topInset={topInset}
        variant={current.variant}
        onDone={() => {
          setCurrent(null);
          scheduleNext.current();
        }}
      />
    </View>
  );
}
