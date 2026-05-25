import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { isSupabaseReady } from "@/lib/supabase/env";

function requireEnv() {
  if (!isSupabaseReady()) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local"
    );
  }
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  };
}

/**
 * Use in **Route Handlers** and **Server Actions** only — cookie writes are allowed there.
 */
export async function createSupabaseServerClient() {
  requireEnv();
  const cookieStore = await cookies();

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      }
    }
  });
}

/**
 * Use in **Server Components** (pages, layouts). Next.js 15+ forbids mutating `cookies()`
 * during RSC render; Supabase may still try to persist refreshed tokens — those writes are
 * skipped here. Actual session refresh belongs in Route Handlers / middleware.
 */
export async function createSupabaseServerComponentClient() {
  requireEnv();
  const cookieStore = await cookies();

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          /* ignore: read-only cookie context during RSC */
        }
      }
    }
  });
}
