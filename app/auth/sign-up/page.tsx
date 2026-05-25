"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { PasswordField } from "@/app/components/PasswordField";

export default function SignUpPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData(event.currentTarget);
    const payload = {
      username: String(formData.get("username") || ""),
      email: String(formData.get("email") || ""),
      password: String(formData.get("password") || ""),
      confirmPassword: String(formData.get("confirmPassword") || ""),
      rememberMe: formData.get("rememberMe") === "on"
    };

    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Could not sign up");
      return;
    }

    setSuccess(data.message ?? "Check your email for verification.");
    router.refresh();
  }

  return (
    <section className="card authCard">
      <h1>Create account</h1>
      <p>Email verification is required before the account is active.</p>
      <form onSubmit={onSubmit} className="form">
        <label>
          Username
          <input
            type="text"
            name="username"
            required
            autoComplete="username"
            minLength={2}
            maxLength={30}
            pattern="[a-zA-Z0-9_]+"
            title="Letters, numbers, and underscores only"
          />
        </label>
        <small>Shown on your profile. Letters, numbers, and underscores (2–30 characters).</small>
        <label>
          Email
          <input type="email" name="email" required autoComplete="email" />
        </label>
        <PasswordField label="Password" name="password" autoComplete="new-password" />
        <small>Password must be 8+ chars, include 1 uppercase and 1 number.</small>
        <PasswordField
          label="Confirm password"
          name="confirmPassword"
          autoComplete="new-password"
        />
        <label className="checkbox">
          <input type="checkbox" name="rememberMe" /> Remember me
        </label>
        <button type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Sign up"}
        </button>
      </form>
      {error ? <p className="error">{error}</p> : null}
      {success ? <p className="success">{success}</p> : null}
    </section>
  );
}
