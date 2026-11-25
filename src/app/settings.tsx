import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { AppText, BackButton, ChunkyButton, Screen, type IconName, HeaderRow } from '@/components';
import { APP_INFO } from '@/config/appInfo';
import { tap } from '@/feedback';
import { usePurchases } from '@/state/purchases';
import { radius, spacing, useTheme } from '@/theme';

/** Settings & info: restore purchases, health notice, privacy policy, support, version. */
export default function SettingsScreen() {
  const { colors } = useTheme();
  const restore = usePurchases((s) => s.restore);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const version = Constants.expoConfig?.version ?? '1.0.0';

  const onRestore = async () => {
    tap();
    setRestoring(true);
    try {
      const { restored } = await restore();
      setRestoreMessage(
        restored > 0
          ? `Restored ${restored} purchase${restored === 1 ? '' : 's'}.`
          : 'No purchases to restore.',
      );
    } catch {
      setRestoreMessage('Could not restore purchases. Please try again.');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <Screen>
      <HeaderRow style={styles.header}>
        <BackButton />
        <AppText variant="title">Settings & info</AppText>
      </HeaderRow>

      <Section title="Purchases">
        <AppText color={colors.textMuted}>
          Bought narrators or music on another phone, or reinstalled the app? Restore them here.
        </AppText>
        <ChunkyButton
          title={restoring ? 'Restoring…' : 'Restore purchases'}
          variant="secondary"
          disabled={restoring}
          onPress={onRestore}
        />
        {restoreMessage ? (
          <AppText variant="caption" accessibilityLiveRegion="polite" testID="restore-message">
            {restoreMessage}
          </AppText>
        ) : null}
      </Section>

      <Section title="Health">
        <AppText testID="health-notice">
          {APP_INFO.name} is for relaxation and wellbeing. It is not medical advice and does not
          diagnose, treat or prevent any condition. If you have health concerns, talk to a doctor.
        </AppText>
      </Section>

      <Section title="About">
        <Row
          icon="shield-checkmark-outline"
          label="Privacy policy"
          onPress={() => router.push('/privacy')}
        />
        {APP_INFO.supportEmail ? (
          <Row
            icon="mail-outline"
            label="Contact support"
            detail={APP_INFO.supportEmail}
            onPress={() => Linking.openURL(`mailto:${APP_INFO.supportEmail}`).catch(() => {})}
          />
        ) : null}
        <Row icon="information-circle-outline" label="Version" detail={version} />
      </Section>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <AppText variant="heading" accessibilityRole="header">
        {title}
      </AppText>
      {children}
    </View>
  );
}

function Row({
  icon,
  label,
  detail,
  onPress,
}: {
  icon: IconName;
  label: string;
  detail?: string;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const content = (
    <>
      <Ionicons name={icon} size={22} color={colors.primary} />
      <AppText variant="label" style={styles.rowLabel}>
        {label}
      </AppText>
      {detail ? (
        <AppText variant="caption" color={colors.textMuted}>
          {detail}
        </AppText>
      ) : null}
      {onPress ? <Ionicons name="chevron-forward" size={18} color={colors.textMuted} /> : null}
    </>
  );
  return onPress ? (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={styles.row}
    >
      {content}
    </Pressable>
  ) : (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`${label}${detail ? `: ${detail}` : ''}`}
    >
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  section: { borderWidth: 2, borderRadius: radius.md, padding: spacing.md, gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xs },
  rowLabel: { flex: 1 },
});
