import Link from "next/link";
import { LogoutButton } from "@/app/components/LogoutButton";

export function ProtectedTopBar() {
  return (
    <div className="protected-top-bar">
      <Link href="/" className="protected-top-bar-link">
        ← Back to map
      </Link>
      <LogoutButton className="logout-toolbar" />
    </div>
  );
}
