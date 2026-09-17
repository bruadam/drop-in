import { useAuth } from "@clerk/expo";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";

import { Avatar, Badge, Button, Card, ScreenHeader, Screen } from "@/components/ui";
import { useTenantTheme } from "@/theme";
import { spacing, typography } from "@/theme/tokens";

const NOTIFICATION_TYPES = [
  { key: "new_activities", label: "New activities near me" },
  { key: "messages", label: "Messages" },
  { key: "alter_ego", label: "Alter ego matches" },
  { key: "announcements", label: "Community announcements" },
];

export default function ProfileScreen() {
  const { colors } = useTenantTheme();
  const { signOut } = useAuth();

  // TODO: load real values from `profiles` / push preferences; this is
  // local-only until that table exists.
  const [notificationPrefs, setNotificationPrefs] = useState<Record<string, boolean>>({
    new_activities: true,
    messages: true,
    alter_ego: true,
    announcements: false,
  });

  return (
    <Screen edges={["top"]}>
      <ScreenHeader title="Profile" />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.identityCard}>
          <Avatar name="Me" size={72} />
          {/* TODO: bind to the signed-in profile's display_name / zone / points_total. */}
          <Text style={[styles.name, { color: colors.textPrimary }]}>Your name</Text>
          <Text style={[styles.meta, { color: colors.textMuted }]}>Zone · 0 points</Text>
        </Card>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Community</Text>
          <Pressable onPress={() => router.push("/stats")} style={[styles.row, { borderBottomColor: colors.divider }]}>
            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Stats &amp; leaderboard</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/directory")}
            style={[styles.row, { borderBottomColor: colors.divider }]}
          >
            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Member directory</Text>
          </Pressable>
          {/* TODO: only show when profile.role is "moderator" or "admin". */}
          <Pressable
            onPress={() => router.push("/moderation")}
            style={[styles.row, { borderBottomColor: colors.divider }]}
          >
            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Moderation queue</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Fitness</Text>
          <View style={[styles.row, { borderBottomColor: colors.divider }]}>
            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Strava</Text>
            <Badge label="Not connected" tone="warning" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Notifications</Text>
          {NOTIFICATION_TYPES.map(({ key, label }) => (
            <View key={key} style={[styles.row, { borderBottomColor: colors.divider }]}>
              <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>{label}</Text>
              <Switch
                value={notificationPrefs[key]}
                onValueChange={(value) => setNotificationPrefs((prev) => ({ ...prev, [key]: value }))}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor="#FFFFFF"
              />
            </View>
          ))}
        </View>

        <Button label="Sign out" variant="destructive" onPress={() => void signOut()} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.screenEdge, gap: spacing.xl, paddingBottom: spacing.xxl },
  identityCard: { alignItems: "center", gap: spacing.xs },
  name: { fontSize: typography.cardTitle.fontSize, fontWeight: typography.cardTitle.fontWeight },
  meta: { fontSize: typography.body.fontSize },
  section: { gap: spacing.xxs },
  sectionTitle: { fontSize: typography.caption.fontSize, fontWeight: "600", marginBottom: spacing.xs },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  rowLabel: { fontSize: typography.listRowPrimary.fontSize, fontWeight: typography.listRowPrimary.fontWeight },
});
