import { View, type ViewProps } from "react-native";

import { useTenantTheme } from "@/theme";
import { radius, spacing } from "@/theme/tokens";

export function Card({ style, ...props }: ViewProps) {
  const { colors } = useTenantTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.divider,
          borderRadius: radius.brand,
          padding: spacing.lg,
          gap: spacing.sm,
        },
        style,
      ]}
      {...props}
    />
  );
}
