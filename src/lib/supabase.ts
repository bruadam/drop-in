import "react-native-url-polyfill/auto";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY — copy .env.example to " +
      ".env (or .env.dev.example, etc.) and fill in your Supabase project's values.",
  );
}

/**
 * Auth lives entirely in Clerk (see ClerkProvider in src/app/_layout.tsx) —
 * Supabase never runs its own sign-in and holds no session of its own.
 * Every request instead carries the current Clerk session JWT via this
 * `accessToken` callback (the third-party-auth integration Supabase and
 * Clerk both document), and Postgres RLS policies read `auth.jwt()` claims
 * to enforce `tenant_id` isolation per spec.
 *
 * Not a singleton: call this from `useSupabase()` (src/hooks/useSupabase.ts)
 * so the client is always bound to the signed-in user's current token
 * getter, not a stale one captured at module load.
 */
export function createSupabaseClient(getToken: () => Promise<string | null>): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    accessToken: () => getToken(),
  });
}
