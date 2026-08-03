import { useConvexAuth } from "convex/react";
import {
  ArrowRight,
  Check,
  Heart,
  MessageSquare,
  Shield,
  Star,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: MessageSquare,
    title: "Discussion Channels",
    description:
      "Connect with other merchants in dedicated channels for POS tips, rate discussions, referrals, and more.",
    gradient: "from-pink-500/10 to-rose-500/10",
    iconColor: "text-pink-500",
    iconBg: "bg-pink-500/10",
  },
  {
    icon: Shield,
    title: "24/7/365 Support",
    description:
      "Submit tickets anytime. AI-powered instant responses with human escalation for complex issues.",
    gradient: "from-purple-500/10 to-violet-500/10",
    iconColor: "text-purple-500",
    iconBg: "bg-purple-500/10",
  },
  {
    icon: Heart,
    title: "Charity Voting",
    description:
      "Choose where the funds go. Vote on which non-profits receive donations from your card swipes.",
    gradient: "from-teal-500/10 to-cyan-500/10",
    iconColor: "text-teal-500",
    iconBg: "bg-teal-500/10",
  },
  {
    icon: Star,
    title: "Role-Based Access",
    description:
      "Prospects can browse public content to see the community in action. Customers unlock full access — posting, support tickets, charity voting, and exclusive member channels.",
    gradient: "from-amber-500/10 to-orange-500/10",
    iconColor: "text-amber-500",
    iconBg: "bg-amber-500/10",
  },
];

const checkmarks = ["24/7 Support", "Charity Voting", "Merchant Network"];

export function LandingPage() {
  const { isAuthenticated } = useConvexAuth();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top header bar — dark magenta matching original */}
      <header className="bg-[#3d1048] text-white">
        <div className="container mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <div className="size-8 flex items-center justify-center">
              <img src="/cs-logo.png" alt="Charity Swipes" className="size-8 object-contain" />
            </div>
            <span className="font-semibold text-sm">Charity Swipes Community</span>
          </div>
          <Button
            size="sm"
            className="bg-pink-600 hover:bg-pink-700 text-white border-0"
            asChild
          >
            <Link to={isAuthenticated ? "/community" : "/signup"}>
              {isAuthenticated ? "Open App" : "Open App"}
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
      </header>

      {/* Hero — matches original */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        <div className="absolute inset-0 bg-gradient-to-b from-pink-100/60 via-pink-50/30 to-transparent" />
        <div className="container mx-auto px-4 sm:px-6 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-pink-500/10 text-pink-600 px-4 py-1.5 text-sm font-medium mb-6">
              <Heart className="size-4 fill-pink-500 text-pink-500" />
              Processing that gives back
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              The Charity Swipes{" "}
              <span className="text-pink-600">Community</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Connect with fellow merchants, get 24/7 support, and see the real
              impact of every card swipe on the charities you choose to support.
            </p>
            <Button
              size="lg"
              className="bg-pink-600 hover:bg-pink-700 text-white"
              asChild
            >
              <Link to={isAuthenticated ? "/community" : "/signup"}>
                Go to Community
                <ArrowRight className="size-5" />
              </Link>
            </Button>

            {/* Checkmarks */}
            <div className="flex items-center justify-center gap-6 mt-6 text-sm text-muted-foreground">
              {checkmarks.map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <Check className="size-4 text-muted-foreground" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="border-t" />

      {/* Features — matches original */}
      <section className="py-20 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="text-sm font-semibold uppercase tracking-wider text-pink-600 mb-3">
              Community Features
            </div>
            <h2 className="text-3xl font-bold mb-3">
              Everything You Need in One Place
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              A hub for Charity Swipes merchants to connect, get support, and
              make a bigger impact together.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border bg-gradient-to-br from-white to-gray-50 dark:from-card dark:to-card p-6 hover:shadow-md transition-shadow"
              >
                <div
                  className={`size-10 rounded-lg ${feature.iconBg} flex items-center justify-center mb-4`}
                >
                  <feature.icon className={`size-5 ${feature.iconColor}`} />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}

            {/* Join Today CTA card */}
            <div className="rounded-xl bg-pink-600 text-white p-6 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2">
                <Users className="size-5" />
                <h3 className="font-semibold text-lg">Join Today</h3>
              </div>
              <p className="text-sm opacity-90 mb-4">
                Be part of a merchant community that gives back with every
                transaction.
              </p>
              <Button
                variant="secondary"
                className="bg-white dark:bg-white text-pink-600 hover:bg-white/90 w-fit"
                asChild
              >
                <Link to={isAuthenticated ? "/community" : "/signup"}>
                  Get Started
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-muted/30 mt-auto">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-md flex items-center justify-center">
                <img src="/cs-logo.png" alt="CS" className="size-7 object-contain" />
              </div>
              <span className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} Charity Swipes · A brand of
                Processing Forward, Inc.
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <a
                href="https://charityswipes.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground transition-colors"
              >
                charityswipes.com
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
