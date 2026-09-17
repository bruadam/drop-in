import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTenantTheme } from "@/theme";
import { spacing, typography } from "@/theme/tokens";

import { Avatar } from "./Avatar";

interface ScreenHeaderProps {
  title: string;
  avatarName?: string;
  onAvatarPress?: () => void;
}

export function ScreenHeader({ title, avatarName, onAvatarPress }: ScreenHeaderProps) {
  const { colors } = useTenantTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      {avatarName ? (
        <Pressable onPress={onAvatarPress} hitSlop={8}>
          <Avatar name={avatarName} size={32} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.screenEdge,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: typography.h1.fontSize,
    lineHeight: typography.h1.lineHeight,
    fontWeight: typography.h1.fontWeight,
  },
});
