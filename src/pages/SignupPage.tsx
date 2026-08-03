import { useMutation } from "convex/react";
import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { SignUp } from "@/components/SignUp";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function setRepCookie(repUid: string) {
  // Set a cookie that lasts 30 days for referral tracking
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `cs_ref_uid=${repUid}; expires=${expires}; path=/; SameSite=Lax`;
}

export function getRepCookie(): string | null {
  const match = document.cookie.match(/cs_ref_uid=([^;]+)/);
  return match ? match[1] : null;
}

export function SignupPage() {
  const [searchParams] = useSearchParams();
  const refUid = searchParams.get("ref");
  const trackClick = useMutation(api.salesReps.trackReferralClick);

  useEffect(() => {
    if (refUid) {
      // Store the referral UID in a cookie
      setRepCookie(refUid);
      // Track the click
      trackClick({ repUid: refUid }).catch(() => {});
    }
  }, [refUid]);

  return (
    <div className="flex-1 flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 right-1/4 size-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 size-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto size-14 flex items-center justify-center mb-4">
            <img src="/cs-logo.png" alt="Charity Swipes" className="size-14 object-contain" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Join the Community
          </h1>
          <p className="text-muted-foreground text-sm">
            Create your Charity Swipes Community account
          </p>
          {refUid && (
            <Badge variant="secondary" className="mt-2">
              Referred by rep: {refUid}
            </Badge>
          )}
        </div>

        <SignUp />

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Button variant="link" className="p-0 h-auto font-medium" asChild>
            <Link to="/login">Sign in</Link>
          </Button>
        </p>
      </div>
    </div>
  );
}
