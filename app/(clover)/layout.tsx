import "@/app/cloverfinder.css";
import { CloverChrome } from "@/app/components/CloverChrome";
import { HomeMapHost } from "@/app/components/HomeMapHost";

export default function CloverLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="clover-site">
      <CloverChrome />
      <HomeMapHost />
      {children}
    </div>
  );
}
