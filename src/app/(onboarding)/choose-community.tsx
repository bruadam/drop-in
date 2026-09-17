import { router } from "expo-router";
import { useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, View } from "react-native";

import { Button, Card, Screen } from "@/components/ui";
import { useTenantTheme } from "@/theme";
import { spacing, typography } from "@/theme/tokens";

// TODO: replace with a geo query against the `tenants` table (~20km
// radius, per spec) once Supabase is wired up. UN17 Village is the first
// real tenant and stands in as the only result for now.
const NEARBY_COMMUNITIES = [{ id: "un17-village", name: "UN17 Village", location: "Copenhagen, Denmark" }];

export default function ChooseCommunityScreen() {
  const { colors } = useTenantTheme();
  const [query, setQuery] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const results = NEARBY_COMMUNITIES.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));

  function selectCommunity() {
    // TODO: persist the chosen tenant_id and apply its `theme.accent` via
    // setAccent() from useTenantTheme() before continuing.
    router.push("/(onboarding)/profile-setup");
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Choose your community</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Search nearby, or enter an invite code.
        </Text>
      </View>

      <View style={styles.content}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search communities"
          style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
        />

        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: spacing.sm }}
          renderItem={({ item }) => (
            <Card>
              <Text style={[styles.communityName, { color: colors.textPrimary }]}>{item.name}</Text>
              <Text style={[styles.communityLocation, { color: colors.textMuted }]}>{item.location}</Text>
              <Button label="Join" onPress={selectCommunity} />
            </Card>
          )}
        />

        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
          <Text style={[styles.dividerLabel, { color: colors.textMuted }]}>or</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
        </View>

        <TextInput
          value={inviteCode}
          onChangeText={setInviteCode}
          placeholder="Invite code"
          autoCapitalize="characters"
          style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
        />
        <Button label="Use invite code" variant="secondary" onPress={selectCommunity} disabled={!inviteCode.trim()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: spacing.xxl, paddingHorizontal: spacing.screenEdge, gap: spacing.xs },
  title: { fontSize: typography.h1.fontSize, lineHeight: typography.h1.lineHeight, fontWeight: typography.h1.fontWeight },
  subtitle: { fontSize: typography.body.fontSize, lineHeight: typography.body.lineHeight },
  content: { flex: 1, padding: spacing.screenEdge, gap: spacing.md },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.body.fontSize,
  },
  communityName: { fontSize: typography.cardTitle.fontSize, fontWeight: typography.cardTitle.fontWeight },
  communityLocation: { fontSize: typography.body.fontSize },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  dividerLine: { flex: 1, height: 1 },
  dividerLabel: { fontSize: typography.caption.fontSize },
});
