import { StyleSheet, Text, View } from "react-native";

import { useTenantTheme } from "@/theme";
import { radius, spacing, typography } from "@/theme/tokens";

interface BadgeProps {
  label: string;
  tone?: "success" | "warning";
}

export function Badge({ label, tone = "success" }: BadgeProps) {
  const { colors } = useTenantTheme();
  const backgroundColor = tone === "success" ? colors.successBackground : colors.warningBackground;
  const textColor = tone === "success" ? colors.success : colors.warning;

  return (
    <View style={[styles.base, { backgroundColor }]}>
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: "flex-start",
    borderRadius: radius.chip,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  label: {
    fontSize: typography.badge.fontSize,
    lineHeight: typography.badge.lineHeight,
    fontWeight: typography.badge.fontWeight,
  },
});
