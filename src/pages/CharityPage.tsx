import { useMutation, useQuery } from "convex/react";
import {
  CreditCard,
  DollarSign,
  Heart,
  TrendingUp,
  Users,
} from "lucide-react";
import { api } from "../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function CharityPage() {
  const stats = useQuery(api.charity.getStats);
  const charities = useQuery(api.charity.listCharities);
  const userVotes = useQuery(api.charity.getUserVotes);
  const vote = useMutation(api.charity.vote);

  const handleVote = async (charityId: string) => {
    try {
      await vote({ charityId: charityId as any });
      toast.success("Vote recorded! 💖");
    } catch (e: any) {
      if (e.message?.includes("Already voted")) {
        toast.info("You've already voted for this charity");
      } else {
        toast.error("Failed to vote");
      }
    }
  };

  const maxVotes = charities?.[0]?.totalVotes ?? 100;

  const statCards = [
    {
      label: "Total Donated",
      value: stats ? `$${stats.totalDonated.toLocaleString()}` : "$0",
      sub: "+$3,200 this month",
      icon: DollarSign,
      color: "text-pink-500",
      bgColor: "bg-pink-500/10",
    },
    {
      label: "Card Swipes",
      value: stats ? stats.totalTransactions.toLocaleString() : "0",
      sub: "Total transactions processed",
      icon: CreditCard,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Merchants Contributing",
      value: "2",
      sub: "Active Charity Swipes merchants",
      icon: Users,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      label: "Charities Supported",
      value: stats?.activeCharities?.toString() ?? "6",
      sub: "Non-profit organizations",
      icon: Heart,
      color: "text-rose-500",
      bgColor: "bg-rose-500/10",
    },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Heart className="size-6 text-primary" />
          Charity Impact Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Every card swipe generates a donation. See the collective impact of the Charity Swipes community.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border bg-card p-5 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground font-medium">{stat.label}</span>
              <div className={`size-8 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`size-4 ${stat.color}`} />
              </div>
            </div>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="flex items-center gap-1 mt-1">
              {stat.sub.startsWith("+") && <TrendingUp className="size-3 text-emerald-500" />}
              <p className="text-xs text-muted-foreground">{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            ☑️ Vote for Next Quarter's Charities
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Select the charities you'd like to support next
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {charities?.map((charity) => {
            const hasVoted = userVotes?.includes(charity._id);
            const votePercent = maxVotes > 0 ? (charity.totalVotes / maxVotes) * 100 : 0;

            return (
              <div
                key={charity._id}
                className="rounded-xl border bg-card p-5 space-y-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="size-12 rounded-lg bg-muted flex items-center justify-center text-2xl shrink-0">
                    {charity.imageEmoji}
                  </div>
                  <div>
                    <h3 className="font-semibold leading-tight">{charity.name}</h3>
                    <Badge variant="secondary" className="mt-1 text-[10px]">
                      {charity.category}
                    </Badge>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  {charity.description}
                </p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {charity.totalVotes} votes
                    </span>
                    <span className="font-medium text-primary">
                      ${charity.totalDonated.toLocaleString()} donated
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all"
                      style={{ width: `${votePercent}%` }}
                    />
                  </div>
                </div>

                <Button
                  onClick={() => handleVote(charity._id)}
                  disabled={hasVoted}
                  className="w-full"
                  variant={hasVoted ? "secondary" : "default"}
                >
                  <Heart className={`size-4 ${hasVoted ? "fill-current" : ""}`} />
                  {hasVoted ? "Voted" : "Vote"}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
