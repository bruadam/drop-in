import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Avatar, Badge, Button, Card, Screen } from "@/components/ui";
import { useTenantTheme } from "@/theme";
import { spacing, typography } from "@/theme/tokens";

type MatchState = "tease" | "waiting" | "revealed";

// TODO: read from `alter_ego_matches` for the current profile/week. State
// starts at "tease" until the resident opts in (`profile_a_opted_in` /
// `profile_b_opted_in`); "revealed" only once *both* sides have opted in
// (`revealed_at` set) — this is a mutual-interest reveal, not a queue.
export default function AlterEgoScreen() {
  const { colors } = useTenantTheme();
  const [state, setState] = useState<MatchState>("tease");

  return (
    <Screen>
      <View style={styles.content}>
        {state === "tease" && (
          <Card style={styles.card}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>You have an alter ego</Text>
            <Text style={[styles.cardBody, { color: colors.textSecondary }]}>
              Someone in your community shares a surprising number of your interests. Say you are curious,
              and if they are too, you will both find out who.
            </Text>
            <Button label="I'm curious" onPress={() => setState("waiting")} />
          </Card>
        )}

        {state === "waiting" && (
          <Card style={styles.card}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Waiting on them</Text>
            <Text style={[styles.cardBody, { color: colors.textSecondary }]}>
              You said you are curious. We will reveal the match the moment they say they are too.
            </Text>
            {/* Dev-only shortcut to preview the revealed state — remove once real-time updates are wired up. */}
            <Button label="(dev) simulate mutual opt-in" variant="secondary" onPress={() => setState("revealed")} />
          </Card>
        )}

        {state === "revealed" && (
          <Card style={styles.card}>
            <View style={styles.avatarRow}>
              <Avatar name="Alex" size={72} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.textPrimary, textAlign: "center" }]}>
              You and Alex matched!
            </Text>
            <Text style={[styles.cardBody, { color: colors.textSecondary, textAlign: "center" }]}>
              Knitting · Powerlifting · Kronen
            </Text>
            <Badge label="Now following each other's activities" tone="success" />
            <Button label="Open chat" onPress={() => router.push("/(tabs)")} />
          </Card>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: spacing.screenEdge, justifyContent: "center" },
  card: { alignItems: "stretch", gap: spacing.md },
  avatarRow: { alignItems: "center" },
  cardTitle: { fontSize: typography.cardTitle.fontSize, fontWeight: typography.cardTitle.fontWeight },
  cardBody: { fontSize: typography.body.fontSize, lineHeight: typography.body.lineHeight },
});
