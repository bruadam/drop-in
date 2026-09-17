import { router, Stack } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";

import { Button, Chip, Screen } from "@/components/ui";
import { isWithinActivityHorizon } from "@/lib/activity-window";
import { useTenantTheme } from "@/theme";
import { spacing, typography } from "@/theme/tokens";

// TODO: load from the tenant's `interests` table.
const INTERESTS = ["Running", "Knitting", "Board games", "Powerlifting", "Cycling", "Yoga"];

export default function CreateActivityScreen() {
  const { colors } = useTenantTheme();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [interest, setInterest] = useState<string | null>(null);
  const [isVagueTime, setIsVagueTime] = useState(false);
  const [hoursFromNow, setHoursFromNow] = useState("2");
  const [isPaid, setIsPaid] = useState(false);

  // Deriving this from the raw hour count (rather than calling `new
  // Date()`/`Date.now()` here) keeps the render pure — React flags impure
  // calls made during render. It's numerically equivalent to
  // `isWithinActivityHorizon(now, now + hoursFromNow)`.
  const hoursNumber = Number(hoursFromNow);
  const withinHorizon = isVagueTime || (Number.isFinite(hoursNumber) && hoursNumber >= 0 && hoursNumber <= 48);

  function handlePost() {
    const now = new Date();
    const startsAt = isVagueTime ? null : new Date(now.getTime() + hoursNumber * 60 * 60 * 1000);
    if (startsAt && !isWithinActivityHorizon(now, startsAt)) return;
    // TODO: insert into `activities` (kind: isVagueTime ? "dropin" with
    // starts_at null : "dropin", starts_at as computed above).
    router.back();
  }

  return (
    <Screen edges={["bottom"]}>
      <Stack.Screen options={{ headerShown: true, title: "New activity", presentation: "modal" }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>What is happening?</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Easy 5k around the harbor"
            style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Details</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Chill pace, all levels welcome"
            multiline
            style={[styles.input, styles.textArea, { borderColor: colors.border, color: colors.textPrimary }]}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Interest</Text>
          <View style={styles.chipRow}>
            {INTERESTS.map((i) => (
              <Chip key={i} label={i} active={interest === i} onPress={() => setInterest(i)} />
            ))}
          </View>
        </View>

        <View style={[styles.toggleRow, { borderColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Still figuring out the time</Text>
            <Text style={[styles.hint, { color: colors.textMuted }]}>
              Post a vague call-out and firm it up in chat once people respond.
            </Text>
          </View>
          <Switch
            value={isVagueTime}
            onValueChange={setIsVagueTime}
            trackColor={{ false: colors.border, true: colors.accent }}
            thumbColor="#FFFFFF"
          />
        </View>

        {!isVagueTime && (
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Hours from now</Text>
            <TextInput
              value={hoursFromNow}
              onChangeText={setHoursFromNow}
              keyboardType="number-pad"
              style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
            />
            {!withinHorizon ? (
              <Text style={[styles.hint, { color: colors.destructive }]}>
                Drop-ins have to start within 48 hours of posting.
              </Text>
            ) : null}
          </View>
        )}

        <View style={[styles.toggleRow, { borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>Paid activity</Text>
          <Switch
            value={isPaid}
            onValueChange={setIsPaid}
            trackColor={{ false: colors.border, true: colors.accent }}
            thumbColor="#FFFFFF"
          />
        </View>
        {isPaid ? (
          <Text style={[styles.hint, { color: colors.textMuted }]}>
            {/* TODO: Polar.sh checkout for community-sold events, or surface the host's MobilePay number for peer-to-peer — per spec, no in-app money movement either way. */}
            Payment collection is not wired up yet — this just tags the activity as paid.
          </Text>
        ) : null}

        <Button
          label="Post"
          onPress={handlePost}
          disabled={!title.trim() || !interest || !withinHorizon}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.screenEdge, gap: spacing.lg, paddingBottom: spacing.xxl },
  field: { gap: spacing.sm },
  label: { fontSize: typography.caption.fontSize, fontWeight: "600" },
  hint: { fontSize: typography.caption.fontSize },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.body.fontSize,
  },
  textArea: { minHeight: 80, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: 14,
    padding: spacing.md,
  },
});
