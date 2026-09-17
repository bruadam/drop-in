import type { ExpoConfig, ConfigContext } from "expo/config";

// APP_ENV is set by eas.json's per-profile "environment" field (development |
// preview | production) and mirrors the git branch: dev -> development,
// staging -> preview, main -> production. Locally it comes from your own
// .env file (see .env.example).
type Env = "development" | "preview" | "production";

const APP_ENV = (process.env.APP_ENV as Env | undefined) ?? "development";

const IDENTIFIERS: Record<Env, { name: string; bundleId: string; scheme: string }> = {
  development: {
    name: "Drop-In (Dev)",
    bundleId: "com.dropin.app.dev",
    scheme: "dropin-dev",
  },
  preview: {
    name: "Drop-In (Staging)",
    bundleId: "com.dropin.app.staging",
    scheme: "dropin-staging",
  },
  production: {
    name: "Drop-In",
    bundleId: "com.dropin.app",
    scheme: "dropin",
  },
};

// E2E builds (eas.json's "e2e-test" profile) always get one stable identity,
// regardless of which backend environment (development or preview) their env
// vars point at — otherwise the Maestro flows' hardcoded `appId` would break
// depending on which backend the build happened to target.
const IS_E2E_BUILD = process.env.EXPO_PUBLIC_E2E_BUILD === "true";
const E2E_IDENTITY = { name: "Drop-In (E2E)", bundleId: "com.dropin.app.e2e", scheme: "dropin-e2e" };

export default ({ config }: ConfigContext): ExpoConfig => {
  const env = IS_E2E_BUILD ? E2E_IDENTITY : (IDENTIFIERS[APP_ENV] ?? IDENTIFIERS.development);

  return {
    ...config,
    name: env.name,
    slug: "dropin-app",
    scheme: env.scheme,
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "automatic",
    icon: "./assets/icon.png",
    ios: {
      ...config.ios,
      bundleIdentifier: env.bundleId,
      supportsTablet: false,
    },
    android: {
      ...config.android,
      package: env.bundleId,
      adaptiveIcon: {
        foregroundImage: "./assets/android-icon-foreground.png",
        backgroundImage: "./assets/android-icon-background.png",
        monochromeImage: "./assets/android-icon-monochrome.png",
        backgroundColor: "#F7F4EF",
      },
    },
    web: {
      ...config.web,
      favicon: "./assets/favicon.png",
      bundler: "metro",
      output: "static",
    },
    extra: {
      ...config.extra,
      appEnv: APP_ENV,
      eas: {
        projectId: process.env.EAS_PROJECT_ID,
      },
    },
    updates: {
      url: process.env.EAS_PROJECT_ID
        ? `https://u.expo.dev/${process.env.EAS_PROJECT_ID}`
        : undefined,
    },
    runtimeVersion: { policy: "fingerprint" },
    // "@clerk/expo" is load-bearing, not cosmetic: its plugin bumps the iOS
    // deployment target to 17.0 (required by the native Clerk SDK pod) and
    // adds the Sign in with Apple entitlement our sign-in screen depends on.
    // Skipping it produces a deployment-target mismatch that breaks `pod
    // install` (CocoaPods' Swift Package Manager integration crashes trying
    // to resolve ClerkExpo's target). expo-secure-store / expo-web-browser /
    // expo-notifications add their usual permission-string config.
    plugins: ["expo-router", "@clerk/expo", "expo-secure-store", "expo-web-browser", "expo-notifications"],
  };
};
