import { render } from '@testing-library/react-native';
import type { ReactElement, ReactNode } from 'react';

import { ThemeProvider, type TimeOfDay } from '@/theme';

/** Wraps children in the app's ThemeProvider, fixed to one period for stable tests. */
export function themeWrapper(period: TimeOfDay = 'morning') {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <ThemeProvider initialOverride={period}>{children}</ThemeProvider>;
  };
}

export function renderWithTheme(ui: ReactElement, period: TimeOfDay = 'morning') {
  return render(ui, { wrapper: themeWrapper(period) });
}
