import { createContext, useContext, useMemo, useState, type PropsWithChildren } from "react";

import { colors as baseColors, DEFAULT_ACCENT } from "./tokens";

type ThemeColors = typeof baseColors & { accent: string; accentTint: string };

interface TenantThemeContextValue {
  accent: string;
  setAccent: (accent: string) => void;
  colors: ThemeColors;
}

const TenantThemeContext = createContext<TenantThemeContextValue | null>(null);

/**
 * Wraps the app so every screen reads colors through `useTenantTheme()`
 * instead of importing the base palette directly. Once a community is
 * chosen (see (onboarding)/choose-community.tsx), its `tenants.theme.accent`
 * value should be loaded and passed to `setAccent` — until that's wired up,
 * every tenant renders with the default terracotta accent.
 */
export function TenantThemeProvider({ children }: PropsWithChildren) {
  const [accent, setAccent] = useState(DEFAULT_ACCENT);

  const value = useMemo<TenantThemeContextValue>(
    () => ({
      accent,
      setAccent,
      colors: { ...baseColors, accent, accentTint: `${accent}22` },
    }),
    [accent],
  );

  return <TenantThemeContext.Provider value={value}>{children}</TenantThemeContext.Provider>;
}

export function useTenantTheme(): TenantThemeContextValue {
  const ctx = useContext(TenantThemeContext);
  if (!ctx) {
    throw new Error("useTenantTheme() must be called within <TenantThemeProvider>");
  }
  return ctx;
}
