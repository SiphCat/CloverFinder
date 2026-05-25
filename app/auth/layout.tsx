import "@/app/cloverfinder.css";
import { CloverfinderAppHeader } from "@/app/components/CloverfinderAppHeader";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="clover-site app-chrome-root">
      <CloverfinderAppHeader />
      <div className="app-chrome-body app-chrome-body--solo">
        <div className="app-chrome-main app-chrome-main--solo">{children}</div>
      </div>
    </div>
  );
}
