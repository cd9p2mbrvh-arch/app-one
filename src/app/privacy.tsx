import { Linking, StyleSheet, View } from 'react-native';

import { AppText, BackButton, ChunkyButton, Screen } from '@/components';
import { APP_INFO } from '@/config/appInfo';
import { PRIVACY_POLICY, PRIVACY_POLICY_UPDATED } from '@/content/legal/privacyPolicy';
import { spacing, useTheme } from '@/theme';

/** The privacy policy, shown in the app (the same text is published on the web). */
export default function PrivacyScreen() {
  const { colors } = useTheme();
  return (
    <Screen>
      <View style={styles.header}>
        <BackButton />
        <AppText variant="title">Privacy policy</AppText>
      </View>
      <AppText variant="caption" color={colors.textMuted}>
        Last updated: {PRIVACY_POLICY_UPDATED}
      </AppText>
      {PRIVACY_POLICY.map((section) => (
        <View key={section.heading} style={styles.section}>
          <AppText variant="heading" accessibilityRole="header">
            {section.heading}
          </AppText>
          {section.paragraphs.map((p, i) => (
            <AppText key={i}>{p}</AppText>
          ))}
        </View>
      ))}
      {APP_INFO.privacyPolicyUrl ? (
        <ChunkyButton
          title="Open on the web"
          variant="secondary"
          onPress={() => Linking.openURL(APP_INFO.privacyPolicyUrl).catch(() => {})}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  section: { gap: spacing.sm },
});
