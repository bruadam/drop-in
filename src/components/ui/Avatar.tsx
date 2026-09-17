import { StyleSheet, Text, View } from "react-native";

import { colors as baseColors } from "@/theme/tokens";

interface AvatarProps {
  name: string;
  size?: number;
  /** Stable key used to pick a tint so the same person always gets the same color. Defaults to `name`. */
  seed?: string;
}

function tintIndexFor(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash % baseColors.avatarTints.length;
}

function initialsFor(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  return initials || "?";
}

export function Avatar({ name, size = 44, seed }: AvatarProps) {
  const tint = baseColors.avatarTints[tintIndexFor(seed ?? name)];
  return (
    <View style={[styles.base, { width: size, height: size, borderRadius: size / 2, backgroundColor: tint }]}>
      <Text style={[styles.label, { fontSize: size * 0.38 }]}>{initialsFor(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: "center", justifyContent: "center" },
  label: { fontWeight: "600", color: "#211D17" },
});
