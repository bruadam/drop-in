import { router } from "expo-router";
import { Platform, StyleSheet, Text, View } from "react-native";

import { Button, Card, Screen } from "@/components/ui";
import { useTenantTheme } from "@/theme";
import { spacing, typography } from "@/theme/tokens";

function finishOnboarding() {
  // TODO: mark onboarding complete on the profile once that's backed by
  // Supabase, so src/app/index.tsx can skip straight to /(tabs) next time.
  router.replace("/(tabs)");
}

export default function ConnectFitnessScreen() {
  const { colors } = useTenantTheme();

  return (
    <Screen>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Connect your fitness data</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Optional — helps match you with people at a similar pace. Skip any time.
        </Text>

        <Card>
          <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>Strava</Text>
          <Text style={[styles.optionBody, { color: colors.textMuted }]}>
            Import your routes and recent pace.
          </Text>
          {/* TODO: kick off Strava OAuth, store the result in `fitness_connections`. */}
          <Button label="Connect Strava" variant="secondary" onPress={() => {}} />
        </Card>

        {Platform.OS === "ios" ? (
          <Card>
            <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>Apple Health</Text>
            <Text style={[styles.optionBody, { color: colors.textMuted }]}>
              Read-only, on-device — a rolled-up summary syncs to your profile.
            </Text>
            {/* TODO: request HealthKit read permission, sync summary to `fitness_connections`. */}
            <Button label="Connect Apple Health" variant="secondary" onPress={() => {}} />
          </Card>
        ) : null}

        <Button label="Skip for now" variant="secondary" onPress={finishOnboarding} />
        <Button label="Done" onPress={finishOnboarding} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: spacing.screenEdge, gap: spacing.lg },
  title: { fontSize: typography.h1.fontSize, lineHeight: typography.h1.lineHeight, fontWeight: typography.h1.fontWeight },
  subtitle: { fontSize: typography.body.fontSize, lineHeight: typography.body.lineHeight },
  optionTitle: { fontSize: typography.cardTitle.fontSize, fontWeight: typography.cardTitle.fontWeight },
  optionBody: { fontSize: typography.body.fontSize, lineHeight: typography.body.lineHeight },
});
