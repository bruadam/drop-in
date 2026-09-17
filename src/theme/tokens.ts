/**
 * Design tokens transcribed from the Drop-In visual reference
 * (design-reference/*.html — 17 screen mockups exported from the design
 * artifact). Values are literal, not guessed: colors are exact hex, spacing
 * matches the mockups' padding/gap scale.
 */

export const colors = {
  background: "#F7F4EF",
  surface: "#FFFFFF",
  textPrimary: "#211D17",
  textSecondary: "#5C5648",
  textMuted: "#726B5B",
  border: "#C7BEAC",
  divider: "#E1DACC",
  inputBackground: "#EFEAE1",
  scrim: "#EFEAE199",
  success: "#2F6F4E",
  successBackground: "#DCEEE2",
  warning: "#8A5F0A",
  warningBackground: "#F3E7C9",
  destructive: "#B23A2E",
  avatarTints: ["#F3E7C9", "#F3DCCF", "#DCEEE2"] as const,
} as const;

// Swappable per tenant (`tenants.theme` jsonb) — this is only the fallback
// used before a community's branding has loaded.
export const DEFAULT_ACCENT = "#B84F26";

export const radius = {
  pill: 9999,
  brand: 14,
  chip: 8,
  sheet: 20,
  tag: 6,
  xs: 4,
} as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  screenEdge: 16,
} as const;

export const typography = {
  caption: { fontSize: 12, lineHeight: 16, fontWeight: "500" },
  chip: { fontSize: 12, lineHeight: 16, fontWeight: "600" },
  buttonPrimary: { fontSize: 16, lineHeight: 21, fontWeight: "600" },
  cardTitle: { fontSize: 16, lineHeight: 21, fontWeight: "600" },
  body: { fontSize: 13, lineHeight: 18, fontWeight: "400" },
  badge: { fontSize: 11, lineHeight: 15, fontWeight: "600" },
  buttonSecondary: { fontSize: 15, lineHeight: 20, fontWeight: "600" },
  h1: { fontSize: 28, lineHeight: 34, fontWeight: "700" },
  sheetHeader: { fontSize: 20, lineHeight: 25, fontWeight: "600" },
  listRowPrimary: { fontSize: 14, lineHeight: 18, fontWeight: "600" },
} as const;

// Only used on bottom-sheet modals in the reference designs — cards use a
// border, not a shadow.
export const sheetShadow = {
  shadowColor: colors.textPrimary,
  shadowOffset: { width: 0, height: -2 },
  shadowOpacity: 0.12,
  shadowRadius: 24,
  elevation: 8,
} as const;
