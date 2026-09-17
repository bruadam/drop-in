import { Stack } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Badge, Button, Card, Screen } from "@/components/ui";
import { useTenantTheme } from "@/theme";
import { spacing, typography } from "@/theme/tokens";

interface QueueItem {
  id: string;
  subjectType: "activity" | "message";
  preview: string;
  aiReason: string;
}

// TODO: read from `moderation_queue` where status = "pending", tenant-scoped
// (moderators only — gate this whole route on profile.role once that's
// available). Approve/reject should update `status` + `reviewed_by` /
// `reviewed_at`; reject should also offer the suspension tier picker
// (1_day | 1_week | permanent) described in the spec.
const MOCK_QUEUE: QueueItem[] = [
  {
    id: "1",
    subjectType: "activity",
    preview: "\"Anyone want to split a bulk vitamin order, DM for details\"",
    aiReason: "Possible solicitation / off-topic for a community activity board",
  },
  {
    id: "2",
    subjectType: "message",
    preview: "\"meet me outside, don't tell the others\"",
    aiReason: "Flagged for review — ambiguous, low confidence",
  },
];

export default function ModerationQueueScreen() {
  const { colors } = useTenantTheme();
  const [queue, setQueue] = useState(MOCK_QUEUE);

  function resolve(id: string) {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  }

  const current = queue[0];

  return (
    <Screen edges={["bottom"]}>
      <Stack.Screen options={{ headerShown: true, title: "Moderation queue" }} />
      <View style={styles.content}>
        {current ? (
          <Card>
            <Badge label={`AI flagged · ${current.subjectType}`} tone="warning" />
            <Text style={[styles.preview, { color: colors.textPrimary }]}>{current.preview}</Text>
            <Text style={[styles.reason, { color: colors.textMuted }]}>{current.aiReason}</Text>
            {/* TODO: real card-stack swipe gesture (react-native-gesture-handler)
                to match the reference design; buttons are the interim interaction. */}
            <View style={styles.actionRow}>
              <View style={{ flex: 1 }}>
                <Button label="✕ Reject" variant="destructive" onPress={() => resolve(current.id)} />
              </View>
              <View style={{ flex: 1 }}>
                <Button label="✓ Approve" variant="success" onPress={() => resolve(current.id)} />
              </View>
            </View>
          </Card>
        ) : (
          <Text style={[styles.empty, { color: colors.textMuted }]}>Queue is clear.</Text>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: spacing.screenEdge, justifyContent: "center" },
  preview: { fontSize: typography.cardTitle.fontSize, fontWeight: typography.cardTitle.fontWeight },
  reason: { fontSize: typography.body.fontSize, lineHeight: typography.body.lineHeight },
  actionRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.sm },
  empty: { fontSize: typography.body.fontSize, textAlign: "center" },
});
