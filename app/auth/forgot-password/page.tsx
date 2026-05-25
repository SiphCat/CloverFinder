"use client";

import { FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData(event.currentTarget);
    const payload = { email: String(formData.get("email") || "") };

    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Could not send reset email");
      return;
    }

    setSuccess(data.message ?? "Password reset email sent.");
  }

  return (
    <section className="card authCard">
      <h1>Forgot password</h1>
      <form onSubmit={onSubmit} className="form">
        <label>
          Email
          <input type="email" name="email" required autoComplete="email" />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send reset email"}
        </button>
      </form>
      {error ? <p className="error">{error}</p> : null}
      {success ? <p className="success">{success}</p> : null}
    </section>
  );
}
