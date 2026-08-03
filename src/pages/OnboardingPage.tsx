import { useMutation, useQuery } from "convex/react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Heart,
  Loader2,
  User,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getMerchantCookie, getRepCookie } from "./SignupPage";

type AccountType = "merchant" | "prospect" | "sales_rep";

const BUSINESS_TYPES = [
  "Restaurant / Food Service",
  "Retail / Shopping",
  "Healthcare / Medical",
  "Professional Services",
  "eCommerce / Online",
  "Fitness / Wellness",
  "Automotive",
  "Beauty / Salon / Spa",
  "Hospitality / Lodging",
  "Education",
  "Nonprofit",
  "Other",
];

const PROCESSORS = [
  "Clover",
  "Square",
  "Stripe",
  "Toast",
  "Heartland",
  "First Data / Fiserv",
  "PayPal / Venmo",
  "None — Not Currently Processing",
  "Other",
];

const VOLUME_RANGES = [
  "Not yet processing",
  "Under $5,000 / month",
  "$5,000 – $15,000 / month",
  "$15,000 – $50,000 / month",
  "$50,000 – $100,000 / month",
  "Over $100,000 / month",
];

const HOW_HEARD = [
  "Sales Representative",
  "Referral from another merchant",
  "Social Media (Facebook, Instagram, etc.)",
  "Google Search",
  "Trade Show / Event",
  "Charity Swipes Website",
  "Other",
];

export function OnboardingPage() {
  const user = useQuery(api.auth.currentUser);
  const createProfile = useMutation(api.userProfiles.create);
  const attachMerchantReferral = useMutation(
    api.merchantReferrals.attachProspectToClick,
  );
  const createApplication = useMutation(api.applications.create);
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1=type, 2=basics, 3=qualifying, 4=charity, 5=confirm
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Basic info
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState("");

  // Business qualifying questions
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [currentProcessor, setCurrentProcessor] = useState("");
  const [monthlyVolume, setMonthlyVolume] = useState("");
  const [acceptsCards, setAcceptsCards] = useState<boolean | null>(null);
  const [merchantId, setMerchantId] = useState("");

  // Discovery & charity
  const [howHeard, setHowHeard] = useState("");
  const [charityInterest, setCharityInterest] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");

  // Sales rep fields
  const [repCompany, setRepCompany] = useState("");
  const [repTerritory, setRepTerritory] = useState("");

  if (user?.name && !name) setName(user.name);

  const accountTypes: { id: AccountType; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      id: "merchant",
      label: "Verified Merchant",
      desc: "I already use Charity Swipes for payment processing and want full community access.",
      icon: <Building2 className="size-6" />,
    },
    {
      id: "prospect",
      label: "Potential Merchant",
      desc: "I'm interested in Charity Swipes and want to explore the community before signing up.",
      icon: <User className="size-6" />,
    },
    {
      id: "sales_rep",
      label: "Sales Representative",
      desc: "I'm a Charity Swipes sales rep and need access to connect with merchants I've referred.",
      icon: <UserPlus className="size-6" />,
    },
  ];

  const totalSteps = accountType === "sales_rep" ? 3 : 5;

  const canProceed = () => {
    switch (step) {
      case 1:
        return !!accountType;
      case 2:
        return name.trim().length > 0;
      case 3:
        if (accountType === "sales_rep") return repCompany.trim().length > 0;
        return businessName.trim().length > 0 && businessType.length > 0;
      case 4:
        return howHeard.length > 0;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!accountType || !name.trim()) return;
    setLoading(true);
    setError("");

    try {
      const refUid = getRepCookie();
      const roleMap: Record<AccountType, "prospect" | "customer" | "sales_rep"> = {
        merchant: "prospect", // Start as prospect, upgraded on approval
        prospect: "prospect",
        sales_rep: "sales_rep",
      };

      await createProfile({
        name: name.trim(),
        email: user?.email || "",
        businessName: businessName.trim() || repCompany.trim() || undefined,
        phone: phone.trim() || undefined,
        role: roleMap[accountType],
        referredByRepId: refUid || undefined,
      });

      // Attribute the signup to a referring merchant, if they arrived via ?mref=
      const mrefUid = getMerchantCookie();
      if (mrefUid && user?._id) {
        await attachMerchantReferral({
          referralUid: mrefUid,
          prospectUserId: user._id,
          prospectName: name.trim(),
          prospectEmail: user?.email || undefined,
          businessName: businessName.trim() || undefined,
        }).catch(() => {});
      }

      // For merchants and prospects, submit qualifying application
      if (accountType === "merchant" || accountType === "prospect") {
        await createApplication({
          accountType,
          businessName: businessName.trim(),
          businessType: businessType || undefined,
          businessAddress: businessAddress.trim() || undefined,
          currentProcessor: currentProcessor || undefined,
          monthlyVolume: monthlyVolume || undefined,
          acceptsCards: acceptsCards ?? undefined,
          merchantId: merchantId.trim() || undefined,
          howHeard: howHeard || undefined,
          charityInterest: charityInterest.trim() || undefined,
          message: additionalInfo.trim() || undefined,
        });
      }

      navigate("/community");
    } catch (e: any) {
      setError(e.message || "Failed to create profile");
    }
    setLoading(false);
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all ${
            i + 1 === step
              ? "w-8 bg-pink-500"
              : i + 1 < step
                ? "w-6 bg-pink-300"
                : "w-6 bg-muted"
          }`}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="w-full max-w-lg space-y-4">
        <div className="text-center space-y-2">
          <div className="mx-auto size-16 flex items-center justify-center mb-4">
            <img src="/cs-logo.png" alt="Charity Swipes" className="size-16 object-contain" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome to the Community!</h1>
          <p className="text-muted-foreground text-sm">
            {step === 1
              ? "How would you like to participate?"
              : step === 2
                ? "Tell us about yourself"
                : step === 3
                  ? accountType === "sales_rep"
                    ? "Your sales information"
                    : "Tell us about your business"
                  : step === 4
                    ? "Almost there — a few more questions"
                    : "Review & submit your application"}
          </p>
        </div>

        {step > 1 && renderStepIndicator()}

        {/* Step 1: Account Type */}
        {step === 1 && (
          <div className="space-y-3">
            {accountTypes.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => {
                  setAccountType(type.id);
                  setStep(2);
                }}
                className={`w-full text-left rounded-xl border-2 bg-card p-5 transition-all hover:border-pink-400/50 hover:shadow-md ${
                  accountType === type.id ? "border-pink-500 shadow-md" : "border-border"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="size-12 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-600 shrink-0">
                    {type.icon}
                  </div>
                  <div>
                    <div className="font-semibold">{type.label}</div>
                    <div className="text-sm text-muted-foreground mt-1">{type.desc}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Basic Info */}
        {step === 2 && (
          <div className="rounded-xl border bg-card p-6 space-y-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="size-4 text-pink-500" />
              <span>
                Joining as{" "}
                <span className="font-medium text-foreground">
                  {accountTypes.find((t) => t.id === accountType)?.label}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-pink-500 underline ml-auto text-xs"
              >
                Change
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Qualifying Questions (Merchant/Prospect) */}
        {step === 3 && accountType !== "sales_rep" && (
          <div className="rounded-xl border bg-card p-6 space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <ClipboardList className="size-5 text-pink-500" />
              <h2 className="font-semibold text-lg">Business Information</h2>
            </div>
            <p className="text-xs text-muted-foreground -mt-3">
              This information helps us qualify your application and customize your experience.
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Business Name *</Label>
                <Input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Your business name"
                />
              </div>

              <div className="space-y-2">
                <Label>Business Type / Industry *</Label>
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                >
                  <option value="">Select your industry...</option>
                  {BUSINESS_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Business City & State</Label>
                <Input
                  value={businessAddress}
                  onChange={(e) => setBusinessAddress(e.target.value)}
                  placeholder="e.g. Dallas, TX"
                />
              </div>

              <div className="space-y-2">
                <Label>Current Payment Processor</Label>
                <select
                  value={currentProcessor}
                  onChange={(e) => setCurrentProcessor(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                >
                  <option value="">Select your current processor...</option>
                  {PROCESSORS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Monthly Processing Volume</Label>
                <select
                  value={monthlyVolume}
                  onChange={(e) => setMonthlyVolume(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                >
                  <option value="">Select your volume range...</option>
                  {VOLUME_RANGES.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Do you currently accept credit card payments?</Label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setAcceptsCards(true)}
                    className={`flex-1 rounded-lg border-2 py-2 text-sm font-medium transition-all ${
                      acceptsCards === true
                        ? "border-pink-500 bg-pink-500/10 text-pink-700 dark:text-pink-400"
                        : "border-border hover:border-pink-300"
                    }`}
                  >
                    <CreditCard className="size-4 inline mr-1.5" /> Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setAcceptsCards(false)}
                    className={`flex-1 rounded-lg border-2 py-2 text-sm font-medium transition-all ${
                      acceptsCards === false
                        ? "border-pink-500 bg-pink-500/10 text-pink-700 dark:text-pink-400"
                        : "border-border hover:border-pink-300"
                    }`}
                  >
                    Not Yet
                  </button>
                </div>
              </div>

              {acceptsCards && (
                <div className="space-y-2">
                  <Label>Merchant ID (MID) — if available</Label>
                  <Input
                    value={merchantId}
                    onChange={(e) => setMerchantId(e.target.value)}
                    placeholder="Optional — helps us verify your account faster"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Sales Rep Info */}
        {step === 3 && accountType === "sales_rep" && (
          <div className="rounded-xl border bg-card p-6 space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <UserPlus className="size-5 text-pink-500" />
              <h2 className="font-semibold text-lg">Sales Representative Details</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Company / Organization *</Label>
                <Input
                  value={repCompany}
                  onChange={(e) => setRepCompany(e.target.value)}
                  placeholder="Your company or agency name"
                />
              </div>
              <div className="space-y-2">
                <Label>Sales Territory / Region</Label>
                <Input
                  value={repTerritory}
                  onChange={(e) => setRepTerritory(e.target.value)}
                  placeholder="e.g. Dallas–Fort Worth, TX"
                />
              </div>
              <div className="space-y-2">
                <Label>Anything else we should know?</Label>
                <textarea
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background resize-none"
                  rows={3}
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  placeholder="How you're connected to Charity Swipes, your experience, etc."
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Discovery & Charity (merchant/prospect only) */}
        {step === 4 && accountType !== "sales_rep" && (
          <div className="rounded-xl border bg-card p-6 space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <Heart className="size-5 text-pink-500" />
              <h2 className="font-semibold text-lg">Discovery & Charity</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>How did you hear about Charity Swipes? *</Label>
                <select
                  value={howHeard}
                  onChange={(e) => setHowHeard(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                >
                  <option value="">Select an option...</option>
                  {HOW_HEARD.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>What charity or cause is most important to you?</Label>
                <Input
                  value={charityInterest}
                  onChange={(e) => setCharityInterest(e.target.value)}
                  placeholder="e.g. Local food banks, children's hospitals, animal shelters..."
                />
              </div>

              <div className="space-y-2">
                <Label>Anything else you'd like us to know?</Label>
                <textarea
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background resize-none"
                  rows={3}
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  placeholder="Questions, comments, or anything to help us serve you better..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Review & Submit (merchant/prospect) */}
        {step === 5 && accountType !== "sales_rep" && (
          <div className="rounded-xl border bg-card p-6 space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="size-5 text-pink-500" />
              <h2 className="font-semibold text-lg">Review Your Application</h2>
            </div>
            <p className="text-xs text-muted-foreground -mt-3">
              Please review your information before submitting. An admin will review your application.
            </p>

            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-muted-foreground text-xs">Account Type</span>
                  <p className="font-medium">{accountType === "merchant" ? "Verified Merchant" : "Potential Merchant"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Name</span>
                  <p className="font-medium">{name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Business</span>
                  <p className="font-medium">{businessName || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Industry</span>
                  <p className="font-medium">{businessType || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Current Processor</span>
                  <p className="font-medium">{currentProcessor || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Monthly Volume</span>
                  <p className="font-medium">{monthlyVolume || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Accepts Cards</span>
                  <p className="font-medium">{acceptsCards === true ? "Yes" : acceptsCards === false ? "Not yet" : "—"}</p>
                </div>
                {merchantId && (
                  <div>
                    <span className="text-muted-foreground text-xs">Merchant ID</span>
                    <p className="font-medium">{merchantId}</p>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground text-xs">How Heard</span>
                  <p className="font-medium">{howHeard || "—"}</p>
                </div>
                {charityInterest && (
                  <div>
                    <span className="text-muted-foreground text-xs">Charity Interest</span>
                    <p className="font-medium">{charityInterest}</p>
                  </div>
                )}
              </div>
              {additionalInfo && (
                <div>
                  <span className="text-muted-foreground text-xs">Additional Info</span>
                  <p className="font-medium">{additionalInfo}</p>
                </div>
              )}
            </div>

            <div className="rounded-lg bg-pink-500/5 border border-pink-500/20 p-4 text-sm">
              <p className="font-medium text-pink-700 dark:text-pink-400 mb-1">📋 What happens next?</p>
              <p className="text-muted-foreground">
                Your application will be reviewed by a Charity Swipes administrator. Once approved,
                you'll get full access to the community, including member-only channels, support
                tickets, and charity voting.
              </p>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        {step > 1 && (
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              className="flex-1"
            >
              <ArrowLeft className="size-4" /> Back
            </Button>
            {step < totalSteps ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="flex-1"
              >
                Next <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading || !canProceed()}
                className="flex-1"
              >
                {loading && <Loader2 className="size-4 animate-spin" />}
                {loading ? "Submitting..." : "Submit Application"}
              </Button>
            )}
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2 text-center">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
