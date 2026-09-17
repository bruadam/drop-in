import { StyleSheet, type ViewProps } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

import { useTenantTheme } from "@/theme";

interface ScreenProps extends ViewProps {
  edges?: Edge[];
}

/** Standard screen background + safe-area wrapper — use under a ScreenHeader on every top-level route. */
export function Screen({ style, edges = ["top", "bottom"], ...props }: ScreenProps) {
  const { colors } = useTenantTheme();
  return (
    <SafeAreaView
      edges={edges}
      style={[styles.base, { backgroundColor: colors.background }, style]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  base: { flex: 1 },
});
