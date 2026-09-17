import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTenantTheme } from "@/theme";
import { spacing, typography } from "@/theme/tokens";

import { Avatar } from "./Avatar";

interface ListRowProps {
  title: string;
  subtitle?: string;
  leadingLabel?: string;
  avatarSeed?: string;
  onPress?: () => void;
}

/** Bordered list row used by the directory and leaderboard screens. */
export function ListRow({ title, subtitle, leadingLabel, avatarSeed, onPress }: ListRowProps) {
  const { colors } = useTenantTheme();
  return (
    <Pressable onPress={onPress} style={[styles.row, { borderBottomColor: colors.divider }]}>
      {leadingLabel ? (
        <Text style={[styles.leading, { color: colors.textMuted }]}>{leadingLabel}</Text>
      ) : null}
      <Avatar name={title} size={44} seed={avatarSeed} />
      <View style={styles.textColumn}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  leading: {
    width: spacing.xl,
    fontSize: typography.listRowPrimary.fontSize,
    fontWeight: "700",
    textAlign: "center",
  },
  textColumn: { flex: 1, gap: spacing.xxs },
  title: {
    fontSize: typography.listRowPrimary.fontSize,
    lineHeight: typography.listRowPrimary.lineHeight,
    fontWeight: typography.listRowPrimary.fontWeight,
  },
  subtitle: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
  },
});
