import { useAuth } from "@clerk/expo";
import { Redirect } from "expo-router";
import { useEffect } from "react";

import { LoadingScreen } from "@/components/ui";

/**
 * TODO once the `profiles` table is live: a signed-in user whose Clerk ID
 * already has a `profiles` row (i.e. they finished onboarding before)
 * should land on /(tabs) directly instead of restarting onboarding. That
 * needs a Supabase lookup here (or in a shared hook) keyed off `userId`.
 * For now every signed-in user is sent through onboarding every time.
 */
export default function Index() {
  const { isLoaded, isSignedIn, userId, sessionId } = useAuth();

  // TEMP diagnostic — remove once the stuck-on-sign-in bug is confirmed fixed.
  useEffect(() => {
    console.warn("index render:", { isLoaded, isSignedIn, userId, sessionId });
  }, [isLoaded, isSignedIn, userId, sessionId]);

  if (!isLoaded) {
    return <LoadingScreen />;
  }

  return <Redirect href={isSignedIn ? "/(onboarding)/choose-community" : "/(auth)/sign-in"} />;
}
