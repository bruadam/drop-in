import { Stack } from "expo-router";
import { useState } from "react";
import { FlatList, StyleSheet, TextInput } from "react-native";

import { ListRow, Screen } from "@/components/ui";
import { useTenantTheme } from "@/theme";
import { spacing, typography } from "@/theme/tokens";

interface Member {
  id: string;
  name: string;
  zone: string;
}

// TODO: replace with a paginated `profiles` query, tenant-scoped, searchable
// by display_name server-side once the list can be large.
const MOCK_MEMBERS: Member[] = [
  { id: "1", name: "Mette", zone: "Lunden" },
  { id: "2", name: "Jonas", zone: "Kronen" },
  { id: "3", name: "Alex", zone: "Norden" },
  { id: "4", name: "Priya", zone: "Spidsen" },
];

export default function DirectoryScreen() {
  const { colors } = useTenantTheme();
  const [query, setQuery] = useState("");

  const members = MOCK_MEMBERS.filter((m) => m.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <Screen edges={["bottom"]}>
      <Stack.Screen options={{ headerShown: true, title: "Members" }} />
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search members"
        style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
      />
      <FlatList
        data={members}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: spacing.screenEdge }}
        renderItem={({ item }) => <ListRow title={item.name} subtitle={item.zone} avatarSeed={item.id} />}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    marginHorizontal: spacing.screenEdge,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.body.fontSize,
  },
});
