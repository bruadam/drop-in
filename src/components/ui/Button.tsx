import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from "react-native";

import { useTenantTheme } from "@/theme";
import { radius, spacing, typography } from "@/theme/tokens";

type Variant = "primary" | "secondary" | "destructive" | "success";

interface ButtonProps extends Omit<PressableProps, "style"> {
  label: string;
  variant?: Variant;
  loading?: boolean;
}

export function Button({ label, variant = "primary", loading, disabled, ...props }: ButtonProps) {
  const { colors } = useTenantTheme();

  const variantStyle = {
    primary: { backgroundColor: colors.accent, borderColor: colors.accent },
    secondary: { backgroundColor: colors.surface, borderColor: colors.border },
    destructive: { backgroundColor: colors.surface, borderColor: colors.destructive },
    success: { backgroundColor: colors.success, borderColor: colors.success },
  }[variant];

  const textColor = {
    primary: colors.surface,
    secondary: colors.textPrimary,
    destructive: colors.destructive,
    success: colors.surface,
  }[variant];

  const isDisabled = disabled || loading;

  return (
    <Pressable
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variantStyle,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text
          style={[
            styles.label,
            {
              color: textColor,
              fontSize:
                variant === "secondary" ? typography.buttonSecondary.fontSize : typography.buttonPrimary.fontSize,
              lineHeight:
                variant === "secondary"
                  ? typography.buttonSecondary.lineHeight
                  : typography.buttonPrimary.lineHeight,
            },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: radius.brand,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontWeight: "600",
  },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
});
