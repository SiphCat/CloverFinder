import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireSupabaseConfigured } from "@/lib/supabase/guard";
import { loginSchema } from "@/lib/validators/auth";
import { resolveLoginEmail } from "@/lib/auth/resolveLoginEmail";
import { formatPasswordSignInFailure, formatUsernameLookupFailure } from "@/lib/auth/formatSignInError";
import { isTransientNetworkError, sleep } from "@/lib/http/isTransientNetworkError";

type AttemptState = { count: number; firstAttemptMs: number };

const attempts = new Map<string, AttemptState>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

function getAttemptKey(ip: string, loginId: string) {
  return `${ip}:${loginId.toLowerCase()}`;
}

function isRateLimited(ip: string, loginId: string) {
  const now = Date.now();
  const key = getAttemptKey(ip, loginId);
  const state = attempts.get(key);

  if (!state) return false;
  if (now - state.firstAttemptMs > WINDOW_MS) {
    attempts.delete(key);
    return false;
  }

  return state.count >= MAX_ATTEMPTS;
}

function recordFailedAttempt(ip: string, loginId: string) {
  const now = Date.now();
  const key = getAttemptKey(ip, loginId);
  const existing = attempts.get(key);

  if (!existing || now - existing.firstAttemptMs > WINDOW_MS) {
    attempts.set(key, { count: 1, firstAttemptMs: now });
    return;
  }

  attempts.set(key, { ...existing, count: existing.count + 1 });
}

function clearAttempts(ip: string, loginId: string) {
  attempts.delete(getAttemptKey(ip, loginId));
}

export async function POST(request: Request) {
  try {
    const missing = requireSupabaseConfigured();
    if (missing) return missing;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { username: loginId, password, rememberMe } = parsed.data;
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

    if (isRateLimited(ip, loginId)) {
      return NextResponse.json(
        { error: "Too many login attempts. Try again later." },
        { status: 429 }
      );
    }

    const { email, error: resolveErr, rpcDetail } = await resolveLoginEmail(loginId);

    if (resolveErr === "missing_service_role" && !loginId.includes("@")) {
      return NextResponse.json(
        {
          code: "MISSING_SERVICE_ROLE",
          error:
            "Username sign-in needs SUPABASE_SERVICE_ROLE_KEY on the server and the SQL function lookup_email_by_login_identifier. See supabase/sql/lookup_email_by_login_identifier.sql"
        },
        { status: 503 }
      );
    }

    if (!email) {
      if (resolveErr === "transient") {
        return NextResponse.json(
          {
            code: "AUTH_NETWORK",
            error:
              "Could not reach your account provider. Check your internet connection and tap Log in again."
          },
          { status: 503 }
        );
      }
      if (resolveErr === "rpc_error") {
        const { error, code } = formatUsernameLookupFailure(rpcDetail);
        return NextResponse.json({ error, code }, { status: 503 });
      }
      recordFailedAttempt(ip, loginId);
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    const supabase = await createSupabaseServerClient();

    let signInError: { message?: string; code?: string; status?: number } | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error) {
          signInError = null;
          break;
        }
        signInError = error;
        if (isTransientNetworkError(error) && attempt < 2) {
          await sleep(250 * (attempt + 1));
          continue;
        }
        break;
      } catch (e) {
        if (isTransientNetworkError(e) && attempt < 2) {
          await sleep(250 * (attempt + 1));
          continue;
        }
        if (isTransientNetworkError(e)) {
          return NextResponse.json(
            {
              code: "AUTH_NETWORK",
              error:
                "Could not reach your account provider. Check your internet connection and tap Log in again."
            },
            { status: 503 }
          );
        }
        return NextResponse.json(
          {
            code: "AUTH_EXCEPTION",
            error: "Sign-in failed unexpectedly. Restart `npm run dev` and try again; if it keeps happening, check Supabase status."
          },
          { status: 503 }
        );
      }
    }

    if (signInError) {
      if (isTransientNetworkError(signInError)) {
        return NextResponse.json(
          {
            code: "AUTH_NETWORK",
            error:
              "Could not reach your account provider. Check your internet connection and tap Log in again."
          },
          { status: 503 }
        );
      }
      const mapped = formatPasswordSignInFailure(signInError);
      if (mapped.status === 401 && mapped.code !== "EMAIL_NOT_CONFIRMED") {
        recordFailedAttempt(ip, loginId);
      }
      return NextResponse.json(
        { error: mapped.error, ...(mapped.code ? { code: mapped.code } : {}) },
        { status: mapped.status }
      );
    }

    clearAttempts(ip, loginId);

    if (!rememberMe) {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        const seconds = Math.max(60, Math.floor((data.session.expires_in ?? 3600) / 24));
        const res = NextResponse.json({ message: "Logged in", redirectTo: "/protected" });
        res.cookies.set("sb-access-token-session", "true", {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: seconds
        });
        return res;
      }
    }

    return NextResponse.json({ message: "Logged in", redirectTo: "/protected" });
  } catch {
    return NextResponse.json(
      {
        error:
          "Sign-in hit an unexpected error. Check your internet connection, wait a few seconds, and try again."
      },
      { status: 503 }
    );
  }
}
