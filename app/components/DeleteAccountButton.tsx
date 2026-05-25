"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteAccountButton() {
  const router = useRouter();
  const [phase, setPhase] = useState<"idle" | "confirm">("idle");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function doDelete() {
    setPending(true);
    setError(null);
    const res = await fetch("/api/auth/delete-account", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setPending(false);

    if (!res.ok) {
      const msg = typeof data.error === "string" ? data.error : "Could not delete account";
      const dbg =
        process.env.NODE_ENV === "development" &&
        data.debug &&
        typeof data.debug === "object"
          ? `\n\n${JSON.stringify(data.debug, null, 2)}`
          : "";
      setError(msg + dbg);
      return;
    }

    router.push("/");
    router.refresh();
  }

  if (phase === "confirm") {
    return (
      <div className="delete-account-block">
        <p className="delete-account-warning">
          <strong>Are you sure?</strong> This permanently deletes your account and profile
          information from Cloverfinder. You can sign up again later with the same email or
          username if you want.
        </p>
        {error ? <p className="error">{error}</p> : null}
        <div className="actions">
          <button type="button" className="secondary" onClick={() => setPhase("idle")}>
            Cancel
          </button>
          <button type="button" className="button danger" disabled={pending} onClick={doDelete}>
            {pending ? "Deleting…" : "Yes, delete forever"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button type="button" className="button danger-outline" onClick={() => setPhase("confirm")}>
      Delete my account
    </button>
  );
}
