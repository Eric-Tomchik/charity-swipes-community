import { useQuery } from "convex/react";
import {
  ArrowRight,
  CreditCard,
  DollarSign,
  Heart,
  MessageSquare,
  TicketCheck,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function DashboardPage() {
  const profile = useQuery(api.userProfiles.get);
  const channels = useQuery(api.channels.list);
  const stats = useQuery(api.charity.getStats);
  const tickets = useQuery(api.tickets.list);
  const members = useQuery(api.userProfiles.listAll);

  const publicChannels = channels?.filter((c) => c.category === "public") ?? [];
  const memberChannels = channels?.filter((c) => c.category === "member") ?? [];

  const openTickets = tickets?.filter((t) => t.status === "open").length ?? 0;
  const inProgress = tickets?.filter((t) => t.status === "in_progress").length ?? 0;
  const resolved = tickets?.filter((t) => t.status === "resolved").length ?? 0;

  const statCards = [
    {
      label: "Charity Impact",
      value: stats ? `$${stats.totalDonated.toLocaleString()}` : "$0",
      sub: "Total donated to charities",
      icon: Heart,
      color: "text-pink-500",
      bgColor: "bg-pink-500/10",
    },
    {
      label: "Transactions",
      value: stats ? stats.totalTransactions.toLocaleString() : "0",
      sub: "Total card swipes processed",
      icon: CreditCard,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Community",
      value: members?.length?.toString() ?? "0",
      sub: "Active community members",
      icon: Users,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      label: "Charities Supported",
      value: stats?.activeCharities?.toString() ?? "6",
      sub: "Non-profits receiving funds",
      icon: DollarSign,
      color: "text-rose-500",
      bgColor: "bg-rose-500/10",
    },
  ];

  const allChannels = [...publicChannels, ...memberChannels.slice(0, 2)];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          Welcome, {profile?.email || profile?.name || "Member"}
          {profile?.role && (
            <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-medium capitalize">
              {profile.role === "sales_rep" ? "Sales Rep" : profile.role}
            </Badge>
          )}
        </h1>
        <p className="text-muted-foreground mt-1">
          Your hub for discussions, support, and making a difference together
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border bg-card p-5 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground font-medium">
                {stat.label}
              </span>
              <div
                className={`size-8 rounded-lg ${stat.bgColor} flex items-center justify-center`}
              >
                <stat.icon className={`size-4 ${stat.color}`} />
              </div>
            </div>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Two-column layout: Channels + Support */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Community Channels */}
        <div className="lg:col-span-3 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="size-5" /> Community Channels
          </h2>
          <p className="text-sm text-muted-foreground -mt-3">
            Jump into a conversation
          </p>
          <div className="space-y-1">
            {allChannels.map((ch) => (
              <Link
                key={ch._id}
                to={`/channel/${ch.slug}`}
                className="flex items-center gap-3 rounded-lg px-4 py-3 hover:bg-accent transition-colors border-b last:border-b-0"
              >
                <span className="text-lg">{ch.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{ch.name}</div>
                  <p className="text-xs text-muted-foreground truncate">
                    {ch.description}
                  </p>
                </div>
                {ch.category === "member" && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] shrink-0"
                  >
                    Members
                  </Badge>
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* Support Center */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <TicketCheck className="size-5 text-teal-500" /> Support Center
            </h2>
            <p className="text-sm text-muted-foreground -mt-2">
              24/7/365 support for Charity Swipes customers
            </p>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-xl font-bold text-emerald-600">
                  {openTickets}
                </div>
                <div className="text-xs text-muted-foreground">Open</div>
              </div>
              <div>
                <div className="text-xl font-bold text-amber-600">
                  {inProgress}
                </div>
                <div className="text-xs text-muted-foreground">In Progress</div>
              </div>
              <div>
                <div className="text-xl font-bold text-blue-600">
                  {resolved}
                </div>
                <div className="text-xs text-muted-foreground">Resolved</div>
              </div>
            </div>

            <Button className="w-full" asChild>
              <Link to="/tickets">View Support Tickets</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Charity Give-Back Banner — matches original */}
      <div className="rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-lg">Charity Give-Back Program</h3>
          <p className="text-sm opacity-90 mt-1">
            Every card swipe generates a donation to the charities you choose.
            See the impact and vote on where funds go next.
          </p>
        </div>
        <Button
          variant="secondary"
          className="bg-white/10 text-white border border-white/20 hover:bg-white/20 shrink-0"
          asChild
        >
          <Link to="/charity">
            View Charity Impact
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
