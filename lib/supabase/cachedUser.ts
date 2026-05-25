import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { createSupabaseServerComponentClient } from "@/lib/supabase/server";
import { isSupabaseReady } from "@/lib/supabase/env";

/** One auth lookup per request (layout + page share the same result). */
export const getCachedUser = cache(async (): Promise<User | null> => {
  if (!isSupabaseReady()) return null;
  const supabase = await createSupabaseServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return user;
});
