"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { PasswordField } from "@/app/components/PasswordField";

export default function ResetPasswordPage() {
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
      password: String(formData.get("password") || ""),
      confirmPassword: String(formData.get("confirmPassword") || "")
    };

    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Could not reset password");
      return;
    }

    setSuccess("Password updated. Redirecting to login...");
    setTimeout(() => router.push("/auth/log-in"), 1000);
  }

  return (
    <section className="card authCard">
      <h1>Reset password</h1>
      <form onSubmit={onSubmit} className="form">
        <PasswordField label="New password" name="password" autoComplete="new-password" />
        <small>Password must be 8+ chars, include 1 uppercase and 1 number.</small>
        <PasswordField
          label="Confirm new password"
          name="confirmPassword"
          autoComplete="new-password"
        />
        <button type="submit" disabled={loading}>
          {loading ? "Updating..." : "Update password"}
        </button>
      </form>
      {error ? <p className="error">{error}</p> : null}
      {success ? <p className="success">{success}</p> : null}
    </section>
  );
}
