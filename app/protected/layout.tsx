import "@/app/cloverfinder.css";
import { BundlePrefetch } from "@/app/components/BundlePrefetch";
import { CloverfinderAppHeader } from "@/app/components/CloverfinderAppHeader";
import { ProfileScrollArea } from "@/app/components/ProfileScrollArea";
import { ProtectedSidebar } from "@/app/components/ProtectedSidebar";
import { ProtectedTopBar } from "@/app/components/ProtectedTopBar";
import { UsernameSetupCallout } from "@/app/components/UsernameSetupCallout";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="clover-site app-chrome-root">
      <BundlePrefetch />
      <ProtectedTopBar />
      <CloverfinderAppHeader />
      <div className="app-chrome-body app-chrome-body--with-sidebar">
        <ProtectedSidebar />
        <ProfileScrollArea>
          <UsernameSetupCallout />
          {children}
        </ProfileScrollArea>
      </div>
    </div>
  );
}
