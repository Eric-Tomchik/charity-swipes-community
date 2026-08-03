import { useQuery } from "convex/react";
import { useState } from "react";
import { Outlet } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { AppSidebar } from "./AppSidebar";
import { TermsModal } from "./TermsModal";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "./ui/sidebar";

export function AppLayout() {
  const profile = useQuery(api.userProfiles.get);
  const [dismissed, setDismissed] = useState(false);

  // Show Terms & Conditions if the user hasn't accepted
  const needsTerms = profile && !profile.tosAcceptedAt && !dismissed;

  // Show suspended/removed notice
  const isSuspended = profile?.accountStatus === "suspended";
  const isRemoved = profile?.accountStatus === "removed";

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-12 items-center px-4 border-b md:hidden">
          <SidebarTrigger />
          <div className="flex items-center gap-2 ml-2">
            <div className="size-6 rounded flex items-center justify-center">
              <img src="/cs-logo.png" alt="CS" className="size-6 object-contain" />
            </div>
            <span className="font-semibold text-sm">Charity Swipes</span>
          </div>
        </header>

        {/* Account status banners */}
        {isSuspended && (
          <div className="bg-red-500/10 border-b border-red-500/30 px-4 py-3 text-center">
            <p className="text-sm font-medium text-red-700 dark:text-red-400">
              ⛔ Your account has been suspended.{" "}
              {profile.suspendedReason && (
                <span>Reason: {profile.suspendedReason}. </span>
              )}
              Please contact support for assistance.
            </p>
          </div>
        )}
        {isRemoved && (
          <div className="bg-red-500/10 border-b border-red-500/30 px-4 py-3 text-center">
            <p className="text-sm font-medium text-red-700 dark:text-red-400">
              🚫 Your account has been removed. Please contact support if you believe this is an error.
            </p>
          </div>
        )}
        {profile?.accountStatus === "probation" && (
          <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-3 text-center">
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
              ⚠️ Your account is on probation
              {profile.probationUntil &&
                ` until ${new Date(profile.probationUntil).toLocaleDateString()}`}.
              {profile.suspendedReason && ` Reason: ${profile.suspendedReason}.`}
            </p>
          </div>
        )}

        <main className="flex-1">
          <Outlet />
        </main>

        {/* T&C modal */}
        {needsTerms && <TermsModal onAccepted={() => setDismissed(true)} />}
      </SidebarInset>
    </SidebarProvider>
  );
}
