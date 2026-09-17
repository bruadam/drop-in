import { ClerkLoaded, ClerkProvider } from "@clerk/expo";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";

import { tokenCache } from "@/lib/clerk-token-cache";
import { queryClient } from "@/lib/query-client";
import { TenantThemeProvider } from "@/theme";

// Required once, at module scope, for the OAuth (Google/Apple via Clerk SSO)
// redirect flow in (auth)/sign-in.tsx to resolve correctly when the
// in-app browser session hands control back to the app.
WebBrowser.maybeCompleteAuthSession();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error(
    "Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY — copy .env.example to .env and fill in your " +
      "Clerk development instance's publishable key.",
  );
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ClerkLoaded>
        <QueryClientProvider client={queryClient}>
          <TenantThemeProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <SafeAreaProvider>
                <Stack screenOptions={{ headerShown: false }} />
              </SafeAreaProvider>
            </GestureHandlerRootView>
          </TenantThemeProvider>
        </QueryClientProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
