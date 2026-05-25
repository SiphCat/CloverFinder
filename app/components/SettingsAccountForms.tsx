"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { PasswordField } from "@/app/components/PasswordField";

type Props = {
  initialEmail: string;
  initialUsername: string;
};

export function SettingsAccountForms({ initialEmail, initialUsername }: Props) {
  const router = useRouter();
  const [uMsg, setUMsg] = useState<string | null>(null);
  const [uErr, setUErr] = useState<string | null>(null);
  const [eMsg, setEMsg] = useState<string | null>(null);
  const [eErr, setEErr] = useState<string | null>(null);
  const [pMsg, setPMsg] = useState<string | null>(null);
  const [pErr, setPErr] = useState<string | null>(null);

  async function submitUsername(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUMsg(null);
    setUErr(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/profile/username", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: String(fd.get("username") || "") })
    });
    const data = await res.json();
    if (!res.ok) {
      setUErr(data.error ?? "Could not update");
      return;
    }
    setUMsg(data.message ?? "Saved");
    router.refresh();
  }

  async function submitEmail(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEMsg(null);
    setEErr(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/profile/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: String(fd.get("email") || "") })
    });
    const data = await res.json();
    if (!res.ok) {
      setEErr(data.error ?? "Could not update");
      return;
    }
    setEMsg(data.message ?? "Check your email");
  }

  async function submitPassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPMsg(null);
    setPErr(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/profile/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: String(fd.get("currentPassword") || ""),
        newPassword: String(fd.get("newPassword") || ""),
        confirmPassword: String(fd.get("confirmPassword") || "")
      })
    });
    const data = await res.json();
    if (!res.ok) {
      setPErr(data.error ?? "Could not update");
      return;
    }
    setPMsg(data.message ?? "Saved");
    e.currentTarget.reset();
  }

  return (
    <div className="settings-forms">
      <section className="settings-form-block">
        <h2 className="settings-form-heading">Change username</h2>
        <form className="form" onSubmit={submitUsername}>
          <label>
            Username
            <input
              type="text"
              name="username"
              required
              minLength={2}
              maxLength={30}
              pattern="[a-zA-Z0-9_]+"
              defaultValue={initialUsername}
              autoComplete="username"
            />
          </label>
          <button type="submit">Save username</button>
        </form>
        {uMsg ? <p className="success">{uMsg}</p> : null}
        {uErr ? <p className="error">{uErr}</p> : null}
      </section>

      <section className="settings-form-block">
        <h2 className="settings-form-heading">Change email</h2>
        <form className="form" onSubmit={submitEmail}>
          <label>
            New email
            <input type="email" name="email" required defaultValue={initialEmail} autoComplete="email" />
          </label>
          <button type="submit">Request email change</button>
        </form>
        {eMsg ? <p className="success">{eMsg}</p> : null}
        {eErr ? <p className="error">{eErr}</p> : null}
      </section>

      <section className="settings-form-block">
        <h2 className="settings-form-heading">Change password</h2>
        <form className="form" onSubmit={submitPassword}>
          <PasswordField
            label="Current password"
            name="currentPassword"
            autoComplete="current-password"
          />
          <PasswordField label="New password" name="newPassword" autoComplete="new-password" />
          <PasswordField
            label="Confirm new password"
            name="confirmPassword"
            autoComplete="new-password"
          />
          <small>8+ characters, one uppercase letter, one number.</small>
          <button type="submit">Update password</button>
        </form>
        {pMsg ? <p className="success">{pMsg}</p> : null}
        {pErr ? <p className="error">{pErr}</p> : null}
      </section>
    </div>
  );
}
