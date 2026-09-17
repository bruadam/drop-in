// @clerk/expo's default useSignIn/useSignUp are the newer "signals" API
// (Clerk Core 3) — the `/legacy` subpath keeps the classic promise-based
// shape (`signIn.create()`, `signIn.attemptFirstFactor()`, etc.) this file
// is written against.
import { useSignIn, useSignUp } from "@clerk/expo/legacy";
import { useSSO } from "@clerk/expo";
import * as AuthSession from "expo-auth-session";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { Button } from "@/components/ui";
import { useTenantTheme } from "@/theme";
import { spacing, typography } from "@/theme/tokens";

/**
 * Spec calls for "email magic link, Google, Apple — no passwords". This
 * implements email as a one-time code instead of a magic link (no deep-link
 * listener needed to receive it) — swap to Clerk's `email_link` strategy
 * later if a true tap-the-link flow matters more than avoiding that
 * plumbing. Also doesn't yet know if the email address belongs to an
 * existing resident or a brand-new one — it currently only completes the
 * *existing user* sign-in path; wiring the sign-up branch (create + verify
 * via `useSignUp`) is still open.
 */
export default function SignInScreen() {
  const { colors } = useTenantTheme();
  const { signIn, setActive: setActiveFromSignIn, isLoaded: signInLoaded } = useSignIn();
  const { signUp, setActive: setActiveFromSignUp, isLoaded: signUpLoaded } = useSignUp();
  const { startSSOFlow } = useSSO();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRequestCode() {
    if (!signInLoaded || !signUpLoaded || !email.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await signIn.create({ identifier: email.trim(), strategy: "email_code" });
      setIsNewUser(false);
      setPendingVerification(true);
    } catch {
      try {
        await signUp.create({ emailAddress: email.trim() });
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        setIsNewUser(true);
        setPendingVerification(true);
      } catch (signUpError) {
        setError(signUpError instanceof Error ? signUpError.message : "Couldn't send a code. Try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyCode() {
    if (!signInLoaded || !signUpLoaded || !code.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      if (isNewUser) {
        const result = await signUp.attemptEmailAddressVerification({ code: code.trim() });
        if (result.status === "complete") {
          await setActiveFromSignUp({ session: result.createdSessionId });
          router.replace("/(onboarding)/choose-community");
        }
      } else {
        const result = await signIn.attemptFirstFactor({ strategy: "email_code", code: code.trim() });
        if (result.status === "complete") {
          await setActiveFromSignIn({ session: result.createdSessionId });
          router.replace("/(onboarding)/choose-community");
        }
      }
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : "That code didn't work. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOAuth(strategy: "oauth_google" | "oauth_apple") {
    setError(null);
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy,
        redirectUrl: AuthSession.makeRedirectUri(),
      });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace("/(onboarding)/choose-community");
      }
    } catch (oauthError) {
      setError(oauthError instanceof Error ? oauthError.message : "Sign-in was cancelled or failed.");
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.wordmark, { color: colors.accent }]}>Drop-In</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Find neighbors doing something, right now.
      </Text>

      {pendingVerification ? (
        <View style={styles.form}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Code sent to {email}</Text>
          <TextInput
            value={code}
            onChangeText={setCode}
            placeholder="123456"
            keyboardType="number-pad"
            style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
          />
          <Button label="Verify" onPress={handleVerifyCode} loading={submitting} disabled={!code.trim()} />
        </View>
      ) : (
        <View style={styles.form}>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
          />
          <Button label="Continue" onPress={handleRequestCode} loading={submitting} disabled={!email.trim()} />
        </View>
      )}

      {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}

      <View style={styles.dividerRow}>
        <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
        <Text style={[styles.dividerLabel, { color: colors.textMuted }]}>or</Text>
        <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
      </View>

      <View style={styles.form}>
        <Button label="Continue with Google" variant="secondary" onPress={() => handleOAuth("oauth_google")} />
        <Button label="Continue with Apple" variant="secondary" onPress={() => handleOAuth("oauth_apple")} />
      </View>

      <Text style={[styles.footer, { color: colors.textMuted }]}>Protected by Clerk</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
    gap: spacing.lg,
  },
  wordmark: {
    fontSize: typography.h1.fontSize,
    lineHeight: typography.h1.lineHeight,
    fontWeight: typography.h1.fontWeight,
    textAlign: "center",
  },
  subtitle: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  form: { gap: spacing.md },
  label: { fontSize: typography.caption.fontSize },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.body.fontSize,
  },
  error: { fontSize: typography.caption.fontSize, textAlign: "center" },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  dividerLine: { flex: 1, height: 1 },
  dividerLabel: { fontSize: typography.caption.fontSize },
  footer: { fontSize: typography.caption.fontSize, textAlign: "center", marginTop: spacing.lg },
});
