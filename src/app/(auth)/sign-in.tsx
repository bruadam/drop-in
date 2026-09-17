import { useSignIn, useSignUp, useSSO } from "@clerk/expo";
import { router, type Href } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { Button } from "@/components/ui";
import { useTenantTheme } from "@/theme";
import { spacing, typography } from "@/theme/tokens";

/**
 * Combined sign-in-or-up, per spec: email code, Google, Apple — no
 * passwords (the Clerk instance's password/username requirements were
 * disabled to match). Attempts sign-in first; a "no such user" error
 * transfers to sign-up with the same email. See @clerk/expo's
 * custom-flows guide for the method-based SignInFuture/SignUpFuture API.
 */
export default function SignInScreen() {
  const { colors } = useTenantTheme();
  const { signIn, errors: signInErrors, fetchStatus: signInFetchStatus } = useSignIn();
  const { signUp, errors: signUpErrors, fetchStatus: signUpFetchStatus } = useSignUp();
  const { startSSOFlow } = useSSO();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitting = signInFetchStatus === "fetching" || signUpFetchStatus === "fetching";

  function navigateAfterAuth({
    session,
    decorateUrl,
  }: {
    session?: { currentTask?: unknown };
    decorateUrl: (url: string) => string;
  }) {
    if (session?.currentTask) {
      // TODO: route to session-task UI (e.g. forced MFA enrollment) once needed.
      return;
    }
    const url = decorateUrl("/(onboarding)/choose-community");
    if (url.startsWith("http")) {
      // Web only: decorateUrl can return an absolute URL for Safari ITP cookie refresh.
      if (typeof window !== "undefined") window.location.href = url;
    } else {
      router.replace(url as Href);
    }
  }

  async function handleRequestCode() {
    if (!email.trim()) return;
    setError(null);

    const { error: signInError } = await signIn.emailCode.sendCode({ emailAddress: email.trim() });
    if (!signInError) {
      setIsNewUser(false);
      setPendingVerification(true);
      return;
    }

    if (signInError.code === "form_identifier_not_found") {
      const { error: signUpError } = await signUp.create({ emailAddress: email.trim() });
      if (signUpError) {
        setError(signUpError.longMessage ?? "Couldn't start sign-up. Try again.");
        return;
      }
      await signUp.verifications.sendEmailCode();
      setIsNewUser(true);
      setPendingVerification(true);
      return;
    }

    setError(signInError.longMessage ?? "Couldn't send a code. Try again.");
  }

  async function handleVerifyCode() {
    if (!code.trim()) return;
    setError(null);

    if (isNewUser) {
      const { error: verifyError } = await signUp.verifications.verifyEmailCode({ code: code.trim() });
      if (verifyError) {
        setError(verifyError.longMessage ?? "That code didn't work. Try again.");
        return;
      }
      console.warn("signUp status after verify:", signUp.status, "missingFields:", signUp.missingFields);
      if (signUp.status === "complete") {
        const { error: finalizeError } = await signUp.finalize({ navigate: navigateAfterAuth });
        if (finalizeError) {
          console.error("signUp.finalize error:", JSON.stringify(finalizeError, null, 2));
          setError(finalizeError.longMessage ?? "Couldn't complete sign-up. Try again.");
        }
      } else {
        setError(`Sign-up isn't complete yet (status: ${signUp.status}). Missing: ${signUp.missingFields.join(", ") || "—"}`);
      }
    } else {
      const { error: verifyError } = await signIn.emailCode.verifyCode({ code: code.trim() });
      if (verifyError) {
        setError(verifyError.longMessage ?? "That code didn't work. Try again.");
        return;
      }
      console.warn("signIn status after verify:", signIn.status);
      if (signIn.status === "complete") {
        const { error: finalizeError } = await signIn.finalize({ navigate: navigateAfterAuth });
        if (finalizeError) {
          console.error("signIn.finalize error:", JSON.stringify(finalizeError, null, 2));
          setError(finalizeError.longMessage ?? "Couldn't complete sign-in. Try again.");
        }
      } else {
        setError(`Sign-in isn't complete yet (status: ${signIn.status}).`);
      }
    }
  }

  async function handleOAuth(strategy: "oauth_google" | "oauth_apple") {
    setError(null);
    try {
      const { createdSessionId, setActive, signUp: oauthSignUp } = await startSSOFlow({ strategy });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace("/(onboarding)/choose-community");
      } else if (oauthSignUp?.status === "missing_requirements") {
        console.warn("OAuth sign-up missing requirements:", oauthSignUp.missingFields);
        setError(`Missing required info: ${oauthSignUp.missingFields.join(", ")}`);
      }
      // Otherwise: no session and no missing-requirements signUp means the user cancelled — not an error.
    } catch (oauthError) {
      console.error(JSON.stringify(oauthError, null, 2));
      setError("Sign-in failed. Try again.");
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
      {signInErrors.fields.identifier ? (
        <Text style={[styles.error, { color: colors.destructive }]}>{signInErrors.fields.identifier.message}</Text>
      ) : null}
      {signUpErrors.fields.captcha ? (
        <Text style={[styles.error, { color: colors.destructive }]}>{signUpErrors.fields.captcha.message}</Text>
      ) : null}

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

      {/* Required mount point for Clerk's bot-protection captcha — this screen can create a sign-up. */}
      <View nativeID="clerk-captcha" />
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
