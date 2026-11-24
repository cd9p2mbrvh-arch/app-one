import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { spacing } from '@/theme';

type Props = {
  children: ReactNode;
  /** Content pinned to the bottom of the screen, outside the scroll area. */
  footer?: ReactNode;
  /** Set to false for screens with their own gestures (e.g. the wheel). */
  scroll?: boolean;
};

/**
 * Standard screen container: safe area, padding, scroll. Transparent so the
 * time-of-day background (drawn once in the root layout) shows through.
 */
export function Screen({ children, footer, scroll = true }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      {/* Always a ScrollView (only scrolling is toggled) so children are never
          re-created when a screen switches between scrolling and fixed layouts. */}
      <ScrollView
        scrollEnabled={scroll}
        contentContainerStyle={[styles.content, !scroll && styles.fixed]}
      >
        {children}
      </ScrollView>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: spacing.lg, gap: spacing.lg },
  fixed: { flexGrow: 1 },
  footer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.md },
});
