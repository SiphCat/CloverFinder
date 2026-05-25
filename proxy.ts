import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isSupabaseReady } from "@/lib/supabase/env";

const PROTECTED_ROUTES = ["/protected"];

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });

  if (!isSupabaseReady()) {
    return response;
  }

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        }
      }
    });

    const {
      data: { user }
    } = await supabase.auth.getUser();

    const isProtected = PROTECTED_ROUTES.some((route) =>
      request.nextUrl.pathname.startsWith(route)
    );

    if (isProtected && !user) {
      const loginUrl = new URL("/auth/log-in", request.url);
      loginUrl.searchParams.set("next", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  } catch {
    // Invalid keys / network: still allow the page through; auth APIs will surface errors.
    return response;
  }

  return response;
}

export const config = {
  matcher: ["/protected/:path*"]
};
