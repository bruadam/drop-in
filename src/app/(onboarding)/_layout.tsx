import { useAuth } from "@clerk/expo";
import { Redirect, Stack } from "expo-router";

import { LoadingScreen } from "@/components/ui";

export default function OnboardingLayout() {
  const { isLoaded, isSignedIn } = useAuth();

  // isLoaded briefly reverts to false while Clerk's auth state is updating
  // (e.g. during setActive() right after sign-in) — deciding on isSignedIn
  // before it settles bounces a freshly-authenticated user back to sign-in.
  if (!isLoaded) {
    return <LoadingScreen />;
  }

  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
