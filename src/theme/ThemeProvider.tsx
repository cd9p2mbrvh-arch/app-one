import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { looks, type Look } from './palettes';
import { getTimeOfDay, type TimeOfDay } from './timeOfDay';

type ThemeValue = Look & {
  /** The period currently shown (the override if set, otherwise the clock). */
  period: TimeOfDay;
  /** Forces a period, or `null` to follow the clock. Used for previews. */
  override: TimeOfDay | null;
  setOverride: (period: TimeOfDay | null) => void;
};

const ThemeContext = createContext<ThemeValue | null>(null);

const CLOCK_CHECK_MS = 60_000;

type Props = {
  children: ReactNode;
  /** Injectable clock, for tests. */
  now?: () => Date;
  /** Initial override, for tests and previews. */
  initialOverride?: TimeOfDay | null;
};

export function ThemeProvider({ children, now = defaultNow, initialOverride = null }: Props) {
  const [clockPeriod, setClockPeriod] = useState<TimeOfDay>(() => getTimeOfDay(now()));
  const [override, setOverride] = useState<TimeOfDay | null>(initialOverride);

  useEffect(() => {
    const refresh = () => setClockPeriod(getTimeOfDay(now()));
    const timer = setInterval(refresh, CLOCK_CHECK_MS);
    // Timers pause in the background, so re-check as soon as the app returns.
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [now]);

  const period = override ?? clockPeriod;
  const value = useMemo(
    () => ({ ...looks[period], period, override, setOverride }),
    [period, override],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

function defaultNow() {
  return new Date();
}

export function useTheme(): ThemeValue {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error('useTheme must be used inside <ThemeProvider>');
  }
  return value;
}
