"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ButtonHTMLAttributes } from "react";

type Props = {
  className?: string;
  /** Omit default toolbar styling (e.g. when used inside a menu). */
  plain?: boolean;
  /** Runs immediately before the logout request (e.g. close a dropdown). */
  onBeforeLogout?: () => void;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "onClick" | "disabled">;

export function LogoutButton({ className, plain, onBeforeLogout, ...rest }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onLogout() {
    onBeforeLogout?.();
    setPending(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      {...rest}
      className={[plain ? undefined : "secondary", className].filter(Boolean).join(" ")}
      disabled={pending}
      onClick={onLogout}
    >
      {pending ? "Signing out…" : "Log out"}
    </button>
  );
}
