import * as SecureStore from "expo-secure-store";

// Shaped to match @clerk/expo's `TokenCache` prop for <ClerkProvider> —
// defined locally instead of imported so this file doesn't break if that
// type's export path moves between Clerk versions.
interface TokenCache {
  getToken: (key: string) => Promise<string | null>;
  saveToken: (key: string, value: string) => Promise<void>;
  clearToken?: (key: string) => Promise<void>;
}

export const tokenCache: TokenCache = {
  async getToken(key) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error("clerk tokenCache.getToken failed", error);
      return null;
    }
  },
  async saveToken(key, value) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error("clerk tokenCache.saveToken failed", error);
    }
  },
  async clearToken(key) {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error("clerk tokenCache.clearToken failed", error);
    }
  },
};
