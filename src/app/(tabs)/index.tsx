import { router } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { Avatar, Badge, Card, Chip, Screen } from "@/components/ui";
import { useTenantTheme } from "@/theme";
import { spacing, typography } from "@/theme/tokens";

interface FeedActivity {
  id: string;
  title: string;
  hostName: string;
  zone: string;
  relativeTime: string;
  interest: string;
  tags: string[];
  isVague: boolean;
}

// TODO: replace with a React Query hook reading `activities` (joined with
// `profiles` for host, `interests` for the filter chips) scoped to the
// current tenant, ordered soonest-first, within the 48h horizon.
const MOCK_ACTIVITIES: FeedActivity[] = [
  {
    id: "1",
    title: "Easy 5k around the harbor",
    hostName: "Mette",
    zone: "Lunden",
    relativeTime: "in 2 hours",
    interest: "Running",
    tags: ["Running", "Beginner"],
    isVague: false,
  },
  {
    id: "2",
    title: "Anyone up for boardgames tonight?",
    hostName: "Jonas",
    zone: "Kronen",
    relativeTime: "tonight, time TBD",
    interest: "Board games",
    tags: ["Board games"],
    isVague: true,
  },
];

const INTEREST_FILTERS = ["All", "Running", "Board games", "Knitting", "Powerlifting"];

export default function ActivityFeedScreen() {
  const { colors } = useTenantTheme();
  const [activeFilter, setActiveFilter] = useState("All");

  const activities = useMemo(
    () =>
      activeFilter === "All" ? MOCK_ACTIVITIES : MOCK_ACTIVITIES.filter((a) => a.interest === activeFilter),
    [activeFilter],
  );

  return (
    <Screen edges={["top"]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Tonight &amp; tomorrow</Text>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => router.push("/activity/create")}
            style={[styles.newButton, { backgroundColor: colors.accent }]}
            hitSlop={8}
          >
            <Text style={styles.newButtonLabel}>+</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/(tabs)/profile")} hitSlop={8}>
            <Avatar name="Me" size={32} />
          </Pressable>
        </View>
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={INTEREST_FILTERS}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.filterRow}
        renderItem={({ item }) => (
          <Chip label={item} active={item === activeFilter} onPress={() => setActiveFilter(item)} />
        )}
      />

      <FlatList
        data={activities}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/activity/${item.id}`)}>
            <Card>
              <View style={styles.cardTopRow}>
                <Text style={[styles.relativeTime, { color: colors.accent }]}>{item.relativeTime}</Text>
                <Text style={[styles.zone, { color: colors.textMuted }]}>{item.zone}</Text>
              </View>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{item.title}</Text>
              <Text style={[styles.host, { color: colors.textMuted }]}>Hosted by {item.hostName}</Text>
              <View style={styles.tagRow}>
                {item.isVague ? <Badge label="Firming up" tone="warning" /> : null}
                {item.tags.map((tag) => (
                  <Chip key={tag} label={tag} />
                ))}
              </View>
            </Card>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.screenEdge,
    paddingBottom: spacing.md,
  },
  title: { fontSize: typography.h1.fontSize, lineHeight: typography.h1.lineHeight, fontWeight: typography.h1.fontWeight },
  headerActions: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  newButton: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  newButtonLabel: { color: "#FFFFFF", fontSize: 20, fontWeight: "700", lineHeight: 22 },
  filterRow: { paddingHorizontal: spacing.screenEdge, gap: spacing.sm, paddingBottom: spacing.md },
  list: { paddingHorizontal: spacing.screenEdge, gap: spacing.sm, paddingBottom: spacing.xxl },
  cardTopRow: { flexDirection: "row", justifyContent: "space-between" },
  relativeTime: { fontSize: typography.caption.fontSize, fontWeight: "500" },
  zone: { fontSize: typography.caption.fontSize, fontWeight: "600" },
  cardTitle: { fontSize: typography.cardTitle.fontSize, fontWeight: typography.cardTitle.fontWeight },
  host: { fontSize: typography.body.fontSize },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
});
