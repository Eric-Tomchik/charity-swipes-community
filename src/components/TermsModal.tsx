import { useMutation } from "convex/react";
import { CheckCircle2, Scroll } from "lucide-react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";

interface TermsModalProps {
  onAccepted: () => void;
}

export function TermsModal({ onAccepted }: TermsModalProps) {
  const acceptTos = useMutation(api.userProfiles.acceptTos);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    try {
      await acceptTos();
      onAccepted();
    } catch {
      // retry silently
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-pink-500/5 to-rose-500/5">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-pink-500/10 flex items-center justify-center">
              <Scroll className="size-5 text-pink-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Terms & Conditions</h2>
              <p className="text-sm text-muted-foreground">
                Please read and accept to continue
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-sm leading-relaxed">
          <section>
            <h3 className="font-semibold text-base mb-2">1. Acceptance of Terms</h3>
            <p className="text-muted-foreground">
              By accessing and using the Charity Swipes Community platform ("Platform"), you agree to
              be bound by these Terms & Conditions ("Terms"). If you do not agree to these Terms, you
              may not access or use the Platform. These Terms constitute a legal agreement between you
              and Processing Forward, Inc. d/b/a Charity Swipes ("Company," "we," "us," or "our").
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">2. Eligibility & Account Registration</h3>
            <p className="text-muted-foreground">
              You must be at least 18 years of age and authorized to act on behalf of any business you
              represent. You agree to provide accurate, complete, and current information during
              registration and to keep your account information updated. You are responsible for
              maintaining the confidentiality of your account credentials and for all activity under your
              account.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">3. Community Guidelines & Acceptable Use</h3>
            <p className="text-muted-foreground mb-2">You agree not to:</p>
            <ul className="list-disc ml-5 text-muted-foreground space-y-1">
              <li>Post offensive, discriminatory, defamatory, or harassing content</li>
              <li>Share confidential or proprietary information of others</li>
              <li>Spam, solicit, or advertise non-Charity Swipes products or services</li>
              <li>Impersonate another person or entity</li>
              <li>Attempt to gain unauthorized access to any part of the Platform</li>
              <li>Use the Platform for any illegal purpose</li>
              <li>Share your processing rates or fees in a way that violates your merchant agreement</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              Violations may result in account suspension, probation, or permanent removal at the sole
              discretion of Charity Swipes administrators.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">4. Merchant Verification</h3>
            <p className="text-muted-foreground">
              Certain features of the Platform require merchant verification. Charity Swipes reserves the
              right to verify your merchant status and may request additional documentation. Verified
              merchant status may be revoked if your Charity Swipes processing account is terminated or
              if you provide false information.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">5. Charity Donations & Give-Back Program</h3>
            <p className="text-muted-foreground">
              The Charity Swipes give-back program directs a portion of processing fees to charitable
              organizations. Community members may participate in charity voting. Donation allocations
              are determined by Charity Swipes and are subject to change. Charity Swipes makes no
              guarantees regarding specific donation amounts or the tax-deductible status of any
              contributions.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">6. Intellectual Property</h3>
            <p className="text-muted-foreground">
              All content, trademarks, logos, and intellectual property on the Platform are owned by or
              licensed to Charity Swipes. Content you post remains yours, but you grant Charity Swipes a
              non-exclusive, royalty-free license to use, display, and distribute your content within the
              Platform.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">7. Privacy & Data Protection</h3>
            <p className="text-muted-foreground">
              We collect and process personal data as described in our Privacy Policy. By using the
              Platform, you consent to our data practices. We do not sell your personal information to
              third parties. Business information shared in your profile is visible to other community
              members as indicated in your privacy settings.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">8. Limitation of Liability</h3>
            <p className="text-muted-foreground">
              The Platform is provided "as is" without warranties of any kind. Charity Swipes shall not
              be liable for any indirect, incidental, special, or consequential damages arising from
              your use of the Platform. The Platform is a community tool and does not constitute
              financial, legal, or business advice. Any information shared by community members is their
              opinion and not endorsed by Charity Swipes.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">9. Account Suspension & Termination</h3>
            <p className="text-muted-foreground">
              We reserve the right to suspend, place on probation, or permanently remove any account
              that violates these Terms or community guidelines. You may delete your account at any
              time by contacting support. Upon termination, your right to access the Platform ceases
              immediately.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">10. Modifications to Terms</h3>
            <p className="text-muted-foreground">
              Charity Swipes reserves the right to modify these Terms at any time. Material changes will
              be communicated through the Platform. Continued use of the Platform after changes
              constitutes acceptance of the modified Terms.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">11. Governing Law</h3>
            <p className="text-muted-foreground">
              These Terms are governed by the laws of the State of Texas, without regard to conflict of
              law principles. Any disputes shall be resolved in the courts of Dallas County, Texas.
            </p>
          </section>

          <section className="text-xs text-muted-foreground italic">
            <p>
              Processing Forward, Inc. d/b/a Charity Swipes • charityswipes.com
            </p>
            <p>Last updated: April 2026</p>
          </section>
        </div>

        {/* Footer */}
        <div className="p-6 border-t space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-0.5 size-4 rounded accent-pink-500"
            />
            <span className="text-sm">
              I have read and agree to the Charity Swipes Community{" "}
              <strong>Terms & Conditions</strong> and{" "}
              <a href="/legal" target="_blank" className="text-pink-600 hover:underline">
                Privacy Policy
              </a>.
            </span>
          </label>
          <Button
            onClick={handleAccept}
            disabled={!accepted || loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <span className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <CheckCircle2 className="size-4" />
            )}
            {loading ? "Accepting..." : "Accept & Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}
