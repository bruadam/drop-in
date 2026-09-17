import { useAuth } from "@clerk/expo";
import { Redirect, Tabs } from "expo-router";

import { useTenantTheme } from "@/theme";

// The reference designs show exactly 3 bottom tabs — Feed, Alter ego,
// Profile. Stats and the member directory are reached by pushing from
// elsewhere (e.g. a button on Profile), not tabs of their own.
//
// TODO: tab icons — the mockups use custom 22x22 line-style SVGs, which
// needs react-native-svg (or @expo/vector-icons) wired in; text-only labels
// for now.
export default function TabsLayout() {
  const { isSignedIn } = useAuth();
  const { colors } = useTenantTheme();

  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { borderTopColor: colors.divider, backgroundColor: colors.surface },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Feed" }} />
      <Tabs.Screen name="alter-ego" options={{ title: "Alter ego" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
