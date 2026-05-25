"use client";

import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PasswordField } from "@/app/components/PasswordField";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/protected";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const payload = {
      username: String(formData.get("username") || ""),
      password: String(formData.get("password") || ""),
      rememberMe: formData.get("rememberMe") === "on"
    };

    /** Same-origin path avoids mismatched host/origin edge cases. */
    const url = "/api/auth/login";
    const maxAttempts = 6;
    const offlineHint =
      "Chrome error -102 means this page could not reach the app (connection refused). In the project folder run `npm run dev`, wait until it says Ready, then open http://127.0.0.1:3000 or http://localhost:3000 — same port as the terminal (use 3001 if it says 3001). Refresh and try Log in again.";

    try {
      for (let i = 0; i < maxAttempts; i++) {
        let response: Response;
        try {
          response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            credentials: "same-origin"
          });
        } catch {
          if (i < maxAttempts - 1) {
            await new Promise((r) => setTimeout(r, Math.min(2000, 250 * 2 ** i)));
            continue;
          }
          setError(offlineHint);
          return;
        }

        const text = await response.text();
        let data: { error?: string; code?: string } = {};
        try {
          data = text ? (JSON.parse(text) as { error?: string; code?: string }) : {};
        } catch {
          if (response.status >= 500 && i < maxAttempts - 1) {
            await new Promise((r) => setTimeout(r, Math.min(2000, 300 * 2 ** i)));
            continue;
          }
          setError(
            response.ok
              ? "Unexpected response from server."
              : "Server returned an unreadable response. Try again in a few seconds."
          );
          return;
        }

        if (response.ok) {
          router.push(next);
          router.refresh();
          return;
        }

        if (response.status >= 500 && i < maxAttempts - 1) {
          await new Promise((r) => setTimeout(r, Math.min(2000, 300 * 2 ** i)));
          continue;
        }

        setError(
          [data.error, data.code ? `(${data.code})` : null].filter(Boolean).join(" ") ||
            "Could not log in"
        );
        return;
      }
    } catch {
      setError(offlineHint);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card authCard">
      <h1>Log in</h1>
      <form onSubmit={onSubmit} className="form">
        <label>
          Username or email
          <input
            type="text"
            name="username"
            required
            autoComplete="username"
            minLength={1}
            maxLength={320}
          />
        </label>
        <small>
          Use your Cloverfinder username if you have one; otherwise use your <strong>full</strong> sign-up
          email (including the part after @).
        </small>
        <PasswordField
          label="Password"
          name="password"
          autoComplete="current-password"
        />
        <label className="checkbox">
          <input type="checkbox" name="rememberMe" /> Remember me
        </label>
        <button type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Log in"}
        </button>
      </form>
      {error ? <p className="error">{error}</p> : null}
      <Link href="/auth/forgot-password">Forgot password?</Link>
    </section>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <section className="card authCard">
          <p>Loading…</p>
        </section>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
