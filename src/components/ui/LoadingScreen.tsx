import { ActivityIndicator, View } from "react-native";

/** Shown while `useAuth().isLoaded` is false — at boot, and briefly during any setActive() transition. */
export function LoadingScreen() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator />
    </View>
  );
}
