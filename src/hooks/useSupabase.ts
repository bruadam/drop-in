import { useMemo } from "react";
import { useAuth } from "@clerk/expo";

import { createSupabaseClient } from "@/lib/supabase";

/** A Supabase client bound to the current Clerk session. See src/lib/supabase.ts. */
export function useSupabase() {
  const { getToken } = useAuth();
  return useMemo(() => createSupabaseClient(() => getToken()), [getToken]);
}
