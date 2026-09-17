import { Pressable, StyleSheet, Text } from "react-native";

import { useTenantTheme } from "@/theme";
import { radius, spacing, typography } from "@/theme/tokens";

interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
}

export function Chip({ label, active, onPress }: ChipProps) {
  const { colors } = useTenantTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.base,
        {
          backgroundColor: active ? colors.accentTint : colors.inputBackground,
          borderColor: active ? colors.accent : colors.border,
        },
      ]}
    >
      <Text style={[styles.label, { color: active ? colors.accent : colors.textPrimary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: radius.chip,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
  },
  label: {
    fontSize: typography.chip.fontSize,
    lineHeight: typography.chip.lineHeight,
    fontWeight: typography.chip.fontWeight,
  },
});
