import { router, Stack } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { Button, Chip, Screen } from "@/components/ui";
import { useTenantTheme } from "@/theme";
import { DEFAULT_ACCENT, spacing, typography } from "@/theme/tokens";

const ACCENT_OPTIONS = [DEFAULT_ACCENT, "#1C6E8C", "#2F6F4E", "#8A5F0A"];

export default function CreateCommunityScreen() {
  const { colors } = useTenantTheme();
  const [creationCode, setCreationCode] = useState("");
  const [codeVerified, setCodeVerified] = useState(false);
  const [name, setName] = useState("");
  const [zonesText, setZonesText] = useState("");
  const [accent, setAccent] = useState(DEFAULT_ACCENT);
  const [createdInviteCode, setCreatedInviteCode] = useState<string | null>(null);

  function verifyCode() {
    // TODO: check `org_creation_codes` (uses_count < max_uses, not expired)
    // via Supabase — platform-admin issued, never open to residents.
    setCodeVerified(creationCode.trim().length > 0);
  }

  function handleCreate() {
    // TODO: insert into `tenants` (name, theme.accent, zones parsed from
    // zonesText), create the Clerk Organization, sync via webhook, then
    // increment `org_creation_codes.uses_count`.
    setCreatedInviteCode("DROPIN-" + Math.random().toString(36).slice(2, 8).toUpperCase());
  }

  if (createdInviteCode) {
    return (
      <Screen edges={["bottom"]}>
        <Stack.Screen options={{ headerShown: true, title: "Create community", presentation: "modal" }} />
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{name} is live</Text>
          <View style={[styles.codeBox, { borderColor: colors.success, backgroundColor: colors.successBackground }]}>
            <Text style={[styles.codeLabel, { color: colors.success }]}>Invite code</Text>
            <Text style={[styles.code, { color: colors.success }]}>{createdInviteCode}</Text>
          </View>
          <Button label="Done" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  if (!codeVerified) {
    return (
      <Screen edges={["bottom"]}>
        <Stack.Screen options={{ headerShown: true, title: "Create community", presentation: "modal" }} />
        <View style={styles.content}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Platform-admin creation code</Text>
          <TextInput
            value={creationCode}
            onChangeText={setCreationCode}
            autoCapitalize="characters"
            style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
          />
          <Button label="Continue" onPress={verifyCode} disabled={!creationCode.trim()} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={["bottom"]}>
      <Stack.Screen options={{ headerShown: true, title: "Create community", presentation: "modal" }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Community name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. UN17 Village"
            style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Zones / buildings (comma-separated)</Text>
          <TextInput
            value={zonesText}
            onChangeText={setZonesText}
            placeholder="Lunden, Kronen, Norden"
            style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Accent color</Text>
          <View style={styles.chipRow}>
            {ACCENT_OPTIONS.map((hex) => (
              <Chip key={hex} label={hex} active={accent === hex} onPress={() => setAccent(hex)} />
            ))}
          </View>
        </View>

        <Button label="Create community" onPress={handleCreate} disabled={!name.trim()} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.screenEdge, gap: spacing.lg, paddingBottom: spacing.xxl },
  field: { gap: spacing.sm },
  label: { fontSize: typography.caption.fontSize, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.body.fontSize,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  title: { fontSize: typography.h1.fontSize, lineHeight: typography.h1.lineHeight, fontWeight: typography.h1.fontWeight },
  codeBox: { borderWidth: 1, borderRadius: 14, padding: spacing.lg, alignItems: "center", gap: spacing.xs },
  codeLabel: { fontSize: typography.caption.fontSize, fontWeight: "600" },
  code: { fontSize: typography.h1.fontSize - 8, fontWeight: "700", letterSpacing: 1 },
});
