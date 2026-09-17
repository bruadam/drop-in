import { useAuth } from "@clerk/expo";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

/**
 * TODO once the `profiles` table is live: a signed-in user whose Clerk ID
 * already has a `profiles` row (i.e. they finished onboarding before)
 * should land on /(tabs) directly instead of restarting onboarding. That
 * needs a Supabase lookup here (or in a shared hook) keyed off `userId`.
 * For now every signed-in user is sent through onboarding every time.
 */
export default function Index() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return <Redirect href={isSignedIn ? "/(onboarding)/choose-community" : "/(auth)/sign-in"} />;
}
