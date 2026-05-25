import { z } from "zod";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { isTransientNetworkError, sleep } from "@/lib/http/isTransientNetworkError";

export type RpcDetail = { code?: string; message: string };

export type ResolveLoginEmailResult = {
  email: string | null;
  error: "not_found" | "missing_service_role" | "rpc_error" | "transient" | null;
  rpcDetail?: RpcDetail;
};

/**
 * Returns the auth email to use with signInWithPassword, or null if unknown / misconfigured.
 */
export async function resolveLoginEmail(loginId: string): Promise<ResolveLoginEmailResult> {
  const trimmed = loginId.trim();
  if (!trimmed) return { email: null, error: "not_found" };

  if (trimmed.includes("@")) {
    const parsed = z.string().email().safeParse(trimmed);
    return parsed.success
      ? { email: parsed.data, error: null }
      : { email: null, error: "not_found" };
  }

  const service = createSupabaseServiceClient();
  if (!service) {
    return { email: null, error: "missing_service_role" };
  }

  const maxAttempts = 3;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let data: unknown;
    let error: unknown;
    try {
      const res = await service.rpc("lookup_email_by_login_identifier", {
        p_identifier: trimmed
      });
      data = res.data;
      error = res.error;
    } catch (e) {
      if (isTransientNetworkError(e) && attempt < maxAttempts - 1) {
        await sleep(200 * (attempt + 1));
        continue;
      }
      return {
        email: null,
        error: isTransientNetworkError(e) ? "transient" : "rpc_error",
        rpcDetail: isTransientNetworkError(e)
          ? undefined
          : {
              message: e instanceof Error ? e.message : String(e)
            }
      };
    }

    if (!error) {
      if (typeof data === "string" && data.includes("@")) {
        return { email: data, error: null };
      }
      return { email: null, error: "not_found" };
    }

    if (isTransientNetworkError(error) && attempt < maxAttempts - 1) {
      await sleep(200 * (attempt + 1));
      continue;
    }

    const rpcDetail: RpcDetail = {
      code: typeof (error as { code?: string }).code === "string" ? (error as { code: string }).code : undefined,
      message: String((error as { message?: string }).message ?? "RPC error").slice(0, 400)
    };

    return {
      email: null,
      error: isTransientNetworkError(error) ? "transient" : "rpc_error",
      rpcDetail: isTransientNetworkError(error) ? undefined : rpcDetail
    };
  }

  return { email: null, error: "rpc_error", rpcDetail: { message: "Lookup exhausted retries" } };
}
