import { router, Stack } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";

import { Button, ListRow, Screen } from "@/components/ui";
import { spacing } from "@/theme/tokens";

interface TenantSummary {
  id: string;
  name: string;
  residentCount: number;
}

// TODO: read from `tenants`, gated on `platform_admins` containing the
// current Clerk user id (checked server-side, not just hidden client-side).
const MOCK_TENANTS: TenantSummary[] = [{ id: "un17-village", name: "UN17 Village", residentCount: 128 }];

export default function PlatformAdminScreen() {
  return (
    <Screen edges={["bottom"]}>
      <Stack.Screen options={{ headerShown: true, title: "All communities" }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Button label="+ Create community" onPress={() => router.push("/admin/create-community")} />
        <View>
          {MOCK_TENANTS.map((tenant) => (
            <ListRow
              key={tenant.id}
              title={tenant.name}
              subtitle={`${tenant.residentCount} residents`}
              avatarSeed={tenant.id}
              // TODO: "view as" — switch the active tenant context to this
              // one for support/debugging, without actually joining it.
              onPress={() => {}}
            />
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.screenEdge, gap: spacing.lg },
});
