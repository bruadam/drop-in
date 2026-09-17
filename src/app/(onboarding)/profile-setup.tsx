import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { Avatar, Button, Chip, Screen } from "@/components/ui";
import { useTenantTheme } from "@/theme";
import { spacing, typography } from "@/theme/tokens";

// UN17 Village's buildings, per spec — swap for `tenants.zones` once loaded.
const ZONES = ["Lunden", "Kronen", "Norden", "Spidsen", "Søen"];

// TODO: load from the tenant's `interests` table instead of hardcoding.
const INTERESTS = ["Running", "Knitting", "Board games", "Powerlifting", "Cycling", "Yoga", "Cooking", "Reading"];

export default function ProfileSetupScreen() {
  const { colors } = useTenantTheme();
  const [name, setName] = useState("");
  const [zone, setZone] = useState<string | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  function toggleInterest(interest: string) {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest],
    );
  }

  function handleContinue() {
    // TODO: upsert into `profiles` (+ `profile_interests`) via Supabase.
    router.push("/(onboarding)/connect-fitness");
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Set up your profile</Text>

        <View style={styles.avatarRow}>
          <Avatar name={name || "?"} size={72} />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Display name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Building</Text>
          <View style={styles.chipRow}>
            {ZONES.map((z) => (
              <Chip key={z} label={z} active={zone === z} onPress={() => setZone(z)} />
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Interests</Text>
          <View style={styles.chipRow}>
            {INTERESTS.map((interest) => (
              <Chip
                key={interest}
                label={interest}
                active={selectedInterests.includes(interest)}
                onPress={() => toggleInterest(interest)}
              />
            ))}
          </View>
        </View>

        <Button label="Continue" onPress={handleContinue} disabled={!name.trim() || !zone} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.screenEdge, gap: spacing.lg },
  title: { fontSize: typography.h1.fontSize, lineHeight: typography.h1.lineHeight, fontWeight: typography.h1.fontWeight },
  avatarRow: { alignItems: "center" },
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
});
