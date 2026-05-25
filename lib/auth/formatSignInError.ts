type RpcDetail = { code?: string; message: string };

/**
 * Human-readable copy for username → email RPC failures (PostgREST / network).
 */
export function formatUsernameLookupFailure(detail?: RpcDetail): {
  error: string;
  code: string;
} {
  const msg = (detail?.message ?? "").toLowerCase();
  const code = detail?.code ?? "";

  if (
    code === "PGRST202" ||
    code === "42883" ||
    msg.includes("could not find the function") ||
    msg.includes("does not exist")
  ) {
    return {
      error:
        "Username login is not set up in Supabase yet. Open Supabase → SQL Editor, run `supabase/sql/lookup_email_by_login_identifier.sql` from this repo, then try again. You can still log in with your full email address.",
      code: "USERNAME_LOOKUP_SQL_MISSING"
    };
  }

  if (
    msg.includes("invalid api") ||
    msg.includes("jwt") ||
    msg.includes("permission denied") ||
    msg.includes("unauthorized")
  ) {
    return {
      error:
        "The server could not call Supabase with your service key. In `.env.local`, set `SUPABASE_SERVICE_ROLE_KEY` to the **service_role** JWT (or the new **secret** key) from the **same** project as `NEXT_PUBLIC_SUPABASE_URL`, then restart `npm run dev`.",
      code: "SERVICE_KEY_INVALID"
    };
  }

  return {
    error:
      "Could not look up this username. Try your full email address, or ask the project owner to run the username SQL script and verify `SUPABASE_SERVICE_ROLE_KEY`.",
    code: "USERNAME_LOOKUP_FAILED"
  };
}

type AuthLikeError = { message?: string; code?: string; status?: number };

/**
 * Maps GoTrue `signInWithPassword` errors to HTTP status + client message.
 */
export function formatPasswordSignInFailure(error: AuthLikeError | null | undefined): {
  status: number;
  error: string;
  code?: string;
} {
  if (!error) {
    return { status: 401, error: "Invalid username or password" };
  }

  const code = typeof error.code === "string" ? error.code : "";
  const msg = (error.message ?? "").toLowerCase();

  if (code === "email_not_confirmed" || code === "phone_not_confirmed") {
    return {
      status: 401,
      error:
        "This email is not verified yet. Check your inbox for the confirmation link from Supabase, then try logging in again.",
      code: "EMAIL_NOT_CONFIRMED"
    };
  }

  if (code === "invalid_credentials" || code === "invalid_grant" || msg.includes("invalid login")) {
    return { status: 401, error: "Invalid username or password" };
  }

  if (code === "user_banned" || msg.includes("banned")) {
    return { status: 403, error: "This account is disabled.", code: "USER_BANNED" };
  }

  if (msg.includes("invalid api") || msg.includes("api key")) {
    return {
      status: 503,
      error:
        "Supabase rejected the browser key. In `.env.local`, copy **anon** (legacy JWT) or **publishable** from Supabase → Settings → API for `NEXT_PUBLIC_SUPABASE_ANON_KEY`, matching the same project URL.",
      code: "ANON_KEY_INVALID"
    };
  }

  if (error.message && error.message.length > 0 && error.message.length < 220) {
    return { status: 401, error: error.message, code: code || "SIGNIN_FAILED" };
  }

  return { status: 401, error: "Invalid username or password" };
}
