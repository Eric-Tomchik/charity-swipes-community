import { ArrowLeft, ExternalLink, FileText, Lock, Scale, Shield, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

export function LegalPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#3d1048] to-[#6b2fa0] text-white">
        <div className="max-w-4xl mx-auto px-6 py-10">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white mb-4"
          >
            <ArrowLeft className="size-4" /> Back to Community
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <Scale className="size-8" />
            <h1 className="text-3xl font-bold">Legal & Compliance</h1>
          </div>
          <p className="text-white/80 max-w-2xl">
            Charity Swipes is committed to full compliance with all applicable laws, regulations, and
            industry standards governing payment processing and data protection.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">
        {/* Company Info */}
        <section className="rounded-xl border bg-card p-6 space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="size-5 text-pink-600" />
            <h2 className="text-xl font-bold">Company Information</h2>
          </div>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong className="text-foreground">Legal Entity:</strong> Processing Forward, Inc.
              d/b/a Charity Swipes
            </p>
            <p>
              <strong className="text-foreground">Website:</strong>{" "}
              <a
                href="https://charityswipes.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-pink-600 hover:underline inline-flex items-center gap-1"
              >
                charityswipes.com <ExternalLink className="size-3" />
              </a>
            </p>
            <p>
              <strong className="text-foreground">Industry:</strong> Payment Processing Services /
              Merchant Services
            </p>
            <p>
              <strong className="text-foreground">Description:</strong> Charity Swipes provides
              merchant payment processing services where a portion of every transaction fee is
              donated to charitable organizations selected by participating merchants through a
              community voting process.
            </p>
          </div>
        </section>

        {/* PCI DSS Compliance */}
        <section className="rounded-xl border bg-card p-6 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-pink-600" />
            <h2 className="text-xl font-bold">PCI DSS Compliance</h2>
          </div>
          <div className="text-sm text-muted-foreground space-y-3">
            <p>
              The Payment Card Industry Data Security Standard (PCI DSS) is the global security
              standard for all entities that store, process, or transmit cardholder data. Charity
              Swipes is committed to maintaining PCI DSS compliance.
            </p>
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <p className="font-semibold text-foreground">Our PCI Commitments:</p>
              <ul className="list-disc ml-5 space-y-1">
                <li>
                  <strong className="text-foreground">No cardholder data on this platform</strong> — The Charity Swipes
                  Community platform does not collect, store, process, or transmit cardholder data
                  (credit card numbers, CVVs, PINs, or magnetic stripe data).
                </li>
                <li>
                  All payment processing is handled through PCI-compliant processing partners and
                  point-of-sale systems (e.g., Clover).
                </li>
                <li>
                  Merchant accounts are managed through registered payment facilitators and acquiring
                  banks in accordance with card network (Visa, Mastercard, Discover, Amex) rules.
                </li>
                <li>
                  Community members should never share full card numbers, CVVs, or other sensitive
                  cardholder data in community channels or messages.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Data Privacy */}
        <section className="rounded-xl border bg-card p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Lock className="size-5 text-pink-600" />
            <h2 className="text-xl font-bold">Data Privacy & Protection</h2>
          </div>
          <div className="text-sm text-muted-foreground space-y-3">
            <p>
              Charity Swipes respects your privacy and is committed to protecting personal information
              in accordance with applicable federal and state privacy laws.
            </p>

            <h3 className="font-semibold text-foreground text-base">Information We Collect</h3>
            <ul className="list-disc ml-5 space-y-1">
              <li>
                <strong className="text-foreground">Account information:</strong> Name, email
                address, phone number, business name and address
              </li>
              <li>
                <strong className="text-foreground">Business information:</strong> Business type,
                current payment processor, processing volume (for qualification purposes)
              </li>
              <li>
                <strong className="text-foreground">Usage data:</strong> Community interactions, login
                activity, support tickets
              </li>
              <li>
                <strong className="text-foreground">Referral data:</strong> Referral source tracking
                for sales representative attribution
              </li>
            </ul>

            <h3 className="font-semibold text-foreground text-base">How We Use Your Information</h3>
            <ul className="list-disc ml-5 space-y-1">
              <li>To provide and maintain the Community platform</li>
              <li>To verify merchant status and process applications</li>
              <li>To communicate service updates and community notifications</li>
              <li>To track charitable donation impact and reporting</li>
              <li>To attribute referrals to sales representatives</li>
              <li>To improve our services and user experience</li>
            </ul>

            <h3 className="font-semibold text-foreground text-base">Information We Do NOT Collect or Store</h3>
            <ul className="list-disc ml-5 space-y-1">
              <li>Credit card numbers, debit card numbers, or any payment card data</li>
              <li>Bank account numbers or routing numbers</li>
              <li>Social Security numbers or Tax ID numbers</li>
              <li>Passwords are securely hashed and never stored in plaintext</li>
            </ul>

            <h3 className="font-semibold text-foreground text-base">Data Sharing</h3>
            <p>
              We do not sell, rent, or trade your personal information to third parties. We may share
              limited information with:
            </p>
            <ul className="list-disc ml-5 space-y-1">
              <li>Payment processing partners (for account verification only)</li>
              <li>Charitable organizations (aggregate donation data, never individual merchant data)</li>
              <li>Law enforcement (only when required by law or valid legal process)</li>
            </ul>

            <h3 className="font-semibold text-foreground text-base">Your Rights</h3>
            <p>You have the right to:</p>
            <ul className="list-disc ml-5 space-y-1">
              <li>Access your personal data we hold</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and associated data</li>
              <li>Opt out of non-essential communications</li>
              <li>Export your data in a portable format</li>
            </ul>
            <p>
              To exercise these rights, contact our support team through the community ticket system
              or email{" "}
              <a href="mailto:support@charityswipes.com" className="text-pink-600 hover:underline">
                support@charityswipes.com
              </a>.
            </p>
          </div>
        </section>

        {/* Industry Compliance */}
        <section className="rounded-xl border bg-card p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="size-5 text-pink-600" />
            <h2 className="text-xl font-bold">Industry Regulations & Compliance</h2>
          </div>
          <div className="text-sm text-muted-foreground space-y-3">
            <div className="rounded-lg bg-muted/50 p-4 space-y-3">
              <div>
                <p className="font-semibold text-foreground">
                  Electronic Fund Transfer Act (EFTA) & Regulation E
                </p>
                <p>
                  Governs electronic fund transfers including debit card transactions. We comply with
                  all disclosure, error resolution, and consumer protection requirements.
                </p>
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  Truth in Lending Act (TILA) & Regulation Z
                </p>
                <p>
                  Ensures transparency in credit terms. All merchant agreements clearly disclose
                  processing rates, fees, and terms.
                </p>
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  Bank Secrecy Act (BSA) / Anti-Money Laundering (AML)
                </p>
                <p>
                  We maintain AML compliance programs including know-your-customer (KYC) procedures
                  for merchant onboarding and transaction monitoring through our banking partners.
                </p>
              </div>
              <div>
                <p className="font-semibold text-foreground">Card Network Rules</p>
                <p>
                  Charity Swipes operates in compliance with Visa, Mastercard, Discover, and American
                  Express operating regulations. Merchants are required to adhere to all applicable
                  card network rules in their processing agreements.
                </p>
              </div>
              <div>
                <p className="font-semibold text-foreground">State Money Transmitter Laws</p>
                <p>
                  Payment processing activities are conducted through properly licensed acquiring banks
                  and registered payment facilitators in compliance with all applicable state money
                  transmitter regulations.
                </p>
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  CAN-SPAM Act & Telephone Consumer Protection Act (TCPA)
                </p>
                <p>
                  All marketing communications comply with federal and state regulations. Community
                  members can opt out of communications at any time through their account settings.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Charitable Giving Disclosures */}
        <section className="rounded-xl border bg-card p-6 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">💖</span>
            <h2 className="text-xl font-bold">Charitable Giving Disclosures</h2>
          </div>
          <div className="text-sm text-muted-foreground space-y-3">
            <ul className="list-disc ml-5 space-y-2">
              <li>
                The charitable give-back program is funded by a designated portion of payment
                processing fees. Merchants do not pay additional fees for charitable contributions.
              </li>
              <li>
                Charity allocations are determined through a combination of community voting and
                Charity Swipes discretion. Community votes serve as input but do not guarantee specific
                allocation amounts.
              </li>
              <li>
                Charity Swipes is <strong className="text-foreground">not</strong> a registered 501(c)(3) nonprofit
                organization. Donations made through the give-back program may not be tax-deductible
                for participating merchants.
              </li>
              <li>
                Donation amounts and recipients are reported on the community Charity Impact dashboard.
                Charity Swipes aims for full transparency in how give-back funds are allocated.
              </li>
              <li>
                Charity Swipes complies with all applicable state charitable solicitation registration
                requirements.
              </li>
            </ul>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-6 space-y-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            ⚠️ Disclaimer
          </h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              The information on this page is for general informational purposes only and does not
              constitute legal advice. Community content (posts, discussions, shared information) is
              user-generated and does not represent the views or advice of Charity Swipes.
            </p>
            <p>
              Processing rates, fees, and terms discussed in community channels are for informational
              purposes. Individual merchant agreements may vary. Always refer to your specific
              merchant processing agreement for your applicable rates and terms.
            </p>
            <p>
              For legal inquiries, contact us at{" "}
              <a href="mailto:legal@charityswipes.com" className="text-pink-600 hover:underline">
                legal@charityswipes.com
              </a>.
            </p>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pb-8">
          <p>
            © {new Date().getFullYear()} Processing Forward, Inc. d/b/a Charity Swipes. All rights reserved.
          </p>
          <p className="mt-1">
            <a href="https://charityswipes.com" target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:underline">
              charityswipes.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
