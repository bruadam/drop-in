import { Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { FlatList, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { Avatar, Button, Card, Screen } from "@/components/ui";
import { useTenantTheme } from "@/theme";
import { spacing, typography } from "@/theme/tokens";

interface ChatMessage {
  id: string;
  senderName: string;
  body: string;
  isPaymentRequest?: boolean;
}

// TODO: replace with `activities` + `attendance` + `messages` queries (the
// latter subscribed via Supabase Realtime) scoped to this activity id.
const MOCK_ATTENDEES = ["Mette", "Jonas", "Alex"];
const MOCK_MESSAGES: ChatMessage[] = [
  { id: "1", senderName: "Mette", body: "See you all by the harbor entrance!" },
];

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTenantTheme();
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState(MOCK_MESSAGES);

  function sendMessage() {
    if (!draft.trim()) return;
    // TODO: insert into `messages` with activity_id = id instead of local state.
    setMessages((prev) => [...prev, { id: String(prev.length + 1), senderName: "You", body: draft.trim() }]);
    setDraft("");
  }

  return (
    <Screen edges={["bottom"]}>
      <Stack.Screen options={{ headerShown: true, title: "Activity" }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <Text style={[styles.time, { color: colors.accent }]}>in 2 hours</Text>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Easy 5k around the harbor (#{id})</Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            Chill pace, all levels welcome. Meet by the harbor entrance.
          </Text>

          <View style={styles.attendeeRow}>
            {MOCK_ATTENDEES.map((name) => (
              <Avatar key={name} name={name} size={32} />
            ))}
          </View>

          <Button label="I'm going" onPress={() => {}} />
        </Card>

        <View style={styles.chatSection}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Chat</Text>
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={{ gap: spacing.sm }}
            renderItem={({ item }) => (
              <View style={[styles.messageBubble, { backgroundColor: colors.inputBackground }]}>
                <Text style={[styles.messageSender, { color: colors.textMuted }]}>{item.senderName}</Text>
                <Text style={[styles.messageBody, { color: colors.textPrimary }]}>{item.body}</Text>
              </View>
            )}
          />
        </View>
      </ScrollView>

      <View style={[styles.composer, { borderTopColor: colors.divider }]}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Message the group"
          style={[styles.composerInput, { borderColor: colors.border, color: colors.textPrimary }]}
        />
        <Button label="Send" onPress={sendMessage} disabled={!draft.trim()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.screenEdge, gap: spacing.lg, paddingBottom: spacing.xxl },
  time: { fontSize: typography.caption.fontSize, fontWeight: "500" },
  title: { fontSize: typography.h1.fontSize - 8, lineHeight: typography.h1.lineHeight - 8, fontWeight: "700" },
  body: { fontSize: typography.body.fontSize, lineHeight: typography.body.lineHeight },
  attendeeRow: { flexDirection: "row", gap: spacing.xs },
  chatSection: { gap: spacing.sm },
  sectionTitle: { fontSize: typography.caption.fontSize, fontWeight: "600" },
  messageBubble: { borderRadius: 14, padding: spacing.md, gap: spacing.xxs },
  messageSender: { fontSize: typography.caption.fontSize, fontWeight: "600" },
  messageBody: { fontSize: typography.body.fontSize },
  composer: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.screenEdge,
    borderTopWidth: 1,
    alignItems: "center",
  },
  composerInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.body.fontSize,
  },
});
