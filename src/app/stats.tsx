import { Stack } from "expo-router";
import { FlatList } from "react-native";

import { ListRow, Screen } from "@/components/ui";
import { spacing } from "@/theme/tokens";

interface LeaderboardEntry {
  profileId: string;
  name: string;
  zone: string;
  points: number;
}

// TODO: replace with a query against `points_ledger` (summed per profile,
// tenant-scoped) ordered by points desc. Leaderboard-consent toggle is
// noted in the spec as an open question — respect it here once decided.
const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { profileId: "1", name: "Mette", zone: "Lunden", points: 340 },
  { profileId: "2", name: "Jonas", zone: "Kronen", points: 210 },
  { profileId: "3", name: "Alex", zone: "Norden", points: 180 },
];

export default function StatsScreen() {
  return (
    <Screen edges={["bottom"]}>
      <Stack.Screen options={{ headerShown: true, title: "Community stats" }} />
      <FlatList
        data={MOCK_LEADERBOARD}
        keyExtractor={(item) => item.profileId}
        contentContainerStyle={{ paddingHorizontal: spacing.screenEdge }}
        renderItem={({ item, index }) => (
          <ListRow
            leadingLabel={String(index + 1)}
            title={item.name}
            subtitle={`${item.zone} · ${item.points} points`}
            avatarSeed={item.profileId}
          />
        )}
      />
    </Screen>
  );
}
