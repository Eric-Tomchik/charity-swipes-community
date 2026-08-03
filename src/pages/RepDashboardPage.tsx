import { useQuery, useMutation } from "convex/react";
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  Database,
  Download,
  Eye,
  ExternalLink,
  Globe,
  Link2,
  Lock,
  Mail,
  Maximize2,
  MessageSquare,
  Minus,
  Phone,
  QrCode,
  Search,
  TrendingUp,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { api } from "../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { STATE_LIST } from "@/data/locations";
import { INDUSTRIES } from "@/data/industries";

// Generate a real QR code image URL using the QR Server API
function getQRCodeUrl(data: string, size: number = 200): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}&margin=8&format=png`;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  clicked: { icon: <Eye className="size-3.5" />, color: "bg-blue-500/10 text-blue-600", label: "Clicked" },
  signed_up: { icon: <UserPlus className="size-3.5" />, color: "bg-yellow-500/10 text-yellow-600", label: "Signed Up" },
  converted: { icon: <CheckCircle2 className="size-3.5" />, color: "bg-emerald-500/10 text-emerald-600", label: "Converted" },
};

function FunnelBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{value}</span>
      </div>
      <div className="h-3 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.max(pct, value > 0 ? 4 : 0)}%` }}
        />
      </div>
    </div>
  );
}

function StatCard({ label, value, subtitle, icon, trend }: { label: string; value: string | number; subtitle?: string; icon: React.ReactNode; trend?: number }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
          {icon}
        </div>
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend > 0 ? "text-emerald-600" : trend < 0 ? "text-red-500" : "text-muted-foreground"}`}>
          {trend > 0 ? <ArrowUp className="size-3" /> : trend < 0 ? <ArrowDown className="size-3" /> : <Minus className="size-3" />}
          {trend > 0 ? "+" : ""}{trend}% vs last month
        </div>
      )}
    </div>
  );
}

function WeeklyChart({ data }: { data: Array<{ label: string; clicks: number; signups: number; conversions: number; total: number }> }) {
  const max = Math.max(...data.map((d) => d.total), 1);
  return (
    <div className="rounded-xl border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <BarChart3 className="size-4 text-primary" /> Weekly Activity
          </h3>
          <p className="text-sm text-muted-foreground">Referral activity over the last 8 weeks</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5"><div className="size-2.5 rounded-full bg-blue-500" /> Clicks</div>
          <div className="flex items-center gap-1.5"><div className="size-2.5 rounded-full bg-yellow-500" /> Signups</div>
          <div className="flex items-center gap-1.5"><div className="size-2.5 rounded-full bg-emerald-500" /> Conversions</div>
        </div>
      </div>
      <div className="flex items-end gap-2 h-40">
        {data.map((week, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex flex-col-reverse gap-0.5" style={{ height: "128px" }}>
              {week.conversions > 0 && (
                <div
                  className="w-full bg-emerald-500 rounded-t-sm min-h-[4px]"
                  style={{ height: `${(week.conversions / max) * 128}px` }}
                />
              )}
              {week.signups > 0 && (
                <div
                  className="w-full bg-yellow-500 rounded-t-sm min-h-[4px]"
                  style={{ height: `${(week.signups / max) * 128}px` }}
                />
              )}
              {week.clicks > 0 && (
                <div
                  className="w-full bg-blue-500 rounded-t-sm min-h-[4px]"
                  style={{ height: `${(week.clicks / max) * 128}px` }}
                />
              )}
            </div>
            <span className="text-[10px] text-muted-foreground text-center truncate w-full">{week.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===== Full-screen QR overlay ===== */
function QRFullScreen({ repUid, url, onClose }: { repUid: string; url: string; onClose: () => void }) {
  const qrUrl = getQRCodeUrl(url, 600);
  return (
    <div
      className="fixed inset-0 z-[100] bg-white dark:bg-gray-950 flex flex-col items-center justify-center p-6"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
        onClick={onClose}
      >
        <X className="size-6 text-gray-700 dark:text-gray-300" />
      </button>
      <div className="flex flex-col items-center gap-6 max-w-sm w-full">
        <img src="/cs-logo.png" alt="Charity Swipes" className="h-12" />
        <img
          src={qrUrl}
          alt={`QR code for rep ${repUid}`}
          className="w-full max-w-[300px] rounded-xl shadow-lg"
        />
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-mono tracking-wider">{repUid}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Scan to join Charity Swipes Community</p>
        </div>
        <img src="/cs-logo.png" alt="" className="h-8 opacity-40 mt-4" />
      </div>
    </div>
  );
}

// ===================== MY LEADS (Personal Rep Database) =====================
const leadStatusColors: Record<string, string> = {
  claimed: "bg-blue-500/10 text-blue-600 border-blue-200",
  attempted: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
  contacted: "bg-purple-500/10 text-purple-600 border-purple-200",
  converted: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  not_interested: "bg-red-500/10 text-red-600 border-red-200",
};
const leadStatusLabels: Record<string, string> = {
  claimed: "Claimed",
  attempted: "Attempted",
  contacted: "Contacted",
  converted: "Converted",
  not_interested: "Not Interested",
};

function MyLeadsSection() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 15;

  const data = useQuery(api.leads.getRepLeads, {
    statusFilter: statusFilter !== "all" ? statusFilter : undefined,
    stateFilter: stateFilter !== "all" ? stateFilter : undefined,
    industryFilter: industryFilter !== "all" ? industryFilter : undefined,
    searchQuery: searchQuery || undefined,
  });

  const updateStatus = useMutation(api.leads.updateContactStatus);

  const leads = data?.leads ?? [];
  const stats = data?.stats ?? { total: 0, claimed: 0, attempted: 0, contacted: 0, converted: 0, notInterested: 0 };
  const totalPages = Math.ceil(leads.length / PAGE_SIZE);
  const paged = leads.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleStatusUpdate = async (leadId: any, status: string) => {
    try {
      await updateStatus({ leadId, status: status as any });
      toast.success(`Status updated to ${leadStatusLabels[status]}`);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Lock className="size-5 text-pink-500" />
        <h2 className="text-lg font-semibold">My Leads</h2>
        <Badge variant="outline" className="ml-2 text-xs">{stats.total} total</Badge>
        <span className="text-xs text-muted-foreground ml-auto">🔒 Only you can see these leads</span>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {[
          { key: "claimed", label: "Claimed", count: stats.claimed, color: "text-blue-600 bg-blue-500/10 dark:text-blue-400" },
          { key: "attempted", label: "Attempted", count: stats.attempted, color: "text-yellow-600 bg-yellow-500/10 dark:text-yellow-400" },
          { key: "contacted", label: "Contacted", count: stats.contacted, color: "text-purple-600 bg-purple-500/10 dark:text-purple-400" },
          { key: "converted", label: "Converted", count: stats.converted, color: "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400" },
          { key: "not_interested", label: "Not Interested", count: stats.notInterested, color: "text-red-600 bg-red-500/10 dark:text-red-400" },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => { setStatusFilter(statusFilter === s.key ? "all" : s.key); setPage(0); }}
            className={`rounded-lg p-2.5 text-center border transition-all ${
              statusFilter === s.key ? "ring-2 ring-pink-500 border-pink-500" : "hover:border-pink-300"
            } ${s.color}`}
          >
            <div className="text-xl font-bold">{s.count}</div>
            <div className="text-xs font-medium">{s.label}</div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
          />
        </div>
        <select className="border rounded-lg px-3 py-2 text-sm bg-background" value={stateFilter} onChange={(e) => { setStateFilter(e.target.value); setPage(0); }}>
          <option value="all">All States</option>
          {STATE_LIST.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
        </select>
        <select className="border rounded-lg px-3 py-2 text-sm bg-background" value={industryFilter} onChange={(e) => { setIndustryFilter(e.target.value); setPage(0); }}>
          <option value="all">All Industries</option>
          {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
        </select>
      </div>

      {/* Lead list */}
      {leads.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground rounded-xl border">
          <Database className="size-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No leads claimed yet</p>
          <p className="text-sm">Claim leads from the Lead Database to add them to your personal pipeline</p>
        </div>
      ) : (
        <div className="space-y-1">
          {paged.map((lead) => {
            const isExpanded = expandedLead === lead._id;
            const sc = leadStatusColors[lead.contactStatus] || leadStatusColors.claimed;
            return (
              <div key={lead._id} className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedLead(isExpanded ? null : lead._id)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors text-left"
                >
                  {isExpanded ? <ChevronDown className="size-4 text-muted-foreground shrink-0" /> : <ChevronRight className="size-4 text-muted-foreground shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{lead.businessName}</span>
                      <Badge className={`text-[10px] px-1.5 py-0 ${sc}`}>{leadStatusLabels[lead.contactStatus] || lead.contactStatus}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-3 mt-0.5">
                      {lead.city && lead.state && <span>{lead.city}, {lead.state}</span>}
                      {lead.industry && <span>{lead.industry}</span>}
                      {lead.claimedAt && <span>Claimed {timeAgo(lead.claimedAt)}</span>}
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t bg-muted/10 p-4 space-y-4">
                    {/* Contact info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {lead.ownerName && (
                        <div className="flex items-center gap-2 text-sm">
                          <Briefcase className="size-3.5 text-muted-foreground" />
                          <span className="font-medium">Owner:</span> {lead.ownerName}
                        </div>
                      )}
                      {lead.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="size-3.5 text-muted-foreground" />
                          <a href={`tel:${lead.phone}`} className="text-pink-600 hover:underline">{lead.phone}</a>
                        </div>
                      )}
                      {lead.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="size-3.5 text-muted-foreground" />
                          <a href={`mailto:${lead.email}`} className="text-pink-600 hover:underline">{lead.email}</a>
                        </div>
                      )}
                      {lead.website && (
                        <div className="flex items-center gap-2 text-sm">
                          <Globe className="size-3.5 text-muted-foreground" />
                          <a href={lead.website} target="_blank" rel="noopener" className="text-pink-600 hover:underline truncate">{lead.website.replace(/^https?:\/\//, "")}</a>
                          <ExternalLink className="size-3 shrink-0" />
                        </div>
                      )}
                      {lead.posSystem && (
                        <div className="text-sm"><span className="font-medium">POS:</span> {lead.posSystem}</div>
                      )}
                      {lead.currentProcessor && (
                        <div className="text-sm"><span className="font-medium">Processor:</span> {lead.currentProcessor}</div>
                      )}
                    </div>

                    {/* Apollo enriched data */}
                    {lead.apolloEnriched && (
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 space-y-1">
                        <div className="text-xs font-semibold text-purple-700 dark:text-purple-300 mb-1">Apollo Enriched Data</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-sm">
                          {lead.ownerTitle && <div><span className="font-medium">Title:</span> {lead.ownerTitle}</div>}
                          {lead.ownerEmail && <div><span className="font-medium">Direct Email:</span> <a href={`mailto:${lead.ownerEmail}`} className="text-purple-600 hover:underline">{lead.ownerEmail}</a></div>}
                          {lead.ownerPhone && <div><span className="font-medium">Direct Phone:</span> <a href={`tel:${lead.ownerPhone}`} className="text-purple-600 hover:underline">{lead.ownerPhone}</a></div>}
                          {lead.ownerLinkedin && <div><a href={lead.ownerLinkedin} target="_blank" rel="noopener" className="text-purple-600 hover:underline">LinkedIn Profile ↗</a></div>}
                          {lead.companySize && <div><span className="font-medium">Company Size:</span> {lead.companySize}</div>}
                          {lead.annualRevenue && <div><span className="font-medium">Revenue:</span> {lead.annualRevenue}</div>}
                          {lead.technologies && <div className="col-span-full"><span className="font-medium">Tech Stack:</span> {lead.technologies}</div>}
                        </div>
                      </div>
                    )}

                    {/* Contact notes */}
                    {lead.contactNotes && (
                      <div className="bg-muted/30 rounded-lg p-3">
                        <div className="text-xs font-medium mb-1 flex items-center gap-1"><MessageSquare className="size-3" /> Notes</div>
                        <p className="text-sm whitespace-pre-wrap">{lead.contactNotes}</p>
                      </div>
                    )}

                    {/* Status update buttons */}
                    <div>
                      <div className="text-xs font-medium mb-2">Update Status:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {["claimed", "attempted", "contacted", "converted", "not_interested"].map((s) => (
                          <button
                            key={s}
                            onClick={() => handleStatusUpdate(lead._id, s)}
                            disabled={lead.contactStatus === s}
                            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                              lead.contactStatus === s
                                ? "ring-2 ring-pink-400 font-bold " + (leadStatusColors[s] || "")
                                : "hover:bg-muted/50"
                            }`}
                          >
                            {leadStatusLabels[s]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Last contacted */}
                    {lead.lastContactedAt && (
                      <div className="text-xs text-muted-foreground">
                        Last contacted: {new Date(lead.lastContactedAt).toLocaleDateString()} at{" "}
                        {new Date(lead.lastContactedAt).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-muted-foreground">
                Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, leads.length)} of {leads.length}
              </span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 0}>Prev</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page >= totalPages - 1}>Next</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function RepDashboardPage() {
  const analytics = useQuery(api.salesReps.getAnalytics);
  const referrals = useQuery(api.salesReps.getReferrals, {});
  const qrRef = useRef<HTMLDivElement>(null);
  const [showQRFullScreen, setShowQRFullScreen] = useState(false);

  const repProfile = analytics?.repProfile;
  const isAdmin = analytics?.isAdmin ?? false;

  const referralUrl = repProfile
    ? `${window.location.origin}/signup?ref=${repProfile.repUid}`
    : "";

  const qrCodeUrl = referralUrl ? getQRCodeUrl(referralUrl, 200) : "";
  const qrCodeDownloadUrl = referralUrl ? getQRCodeUrl(referralUrl, 600) : "";

  const copyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    toast.success("Referral link copied!");
  };

  // Loading state
  if (analytics === undefined) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="animate-spin size-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Not a rep and not admin
  if (!repProfile && !isAdmin) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <QrCode className="size-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Sales Rep access required</p>
          <p className="text-sm">Contact an admin to set up your rep profile</p>
        </div>
      </div>
    );
  }

  // At this point analytics is guaranteed non-null (we returned above for loading/null cases)
  const funnel = analytics!.funnel;
  const periods = analytics!.periods;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <QrCode className="size-6 text-primary" /> Rep Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          {isAdmin ? "Track all sales rep referrals, analytics, and conversions" : "Track referrals, share your QR code, and manage your leads"}
        </p>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Referrals"
          value={funnel.total}
          subtitle="All-time leads"
          icon={<Users className="size-5" />}
          trend={periods.monthOverMonth}
        />
        <StatCard
          label="Signups"
          value={funnel.signups}
          subtitle={`${funnel.clickToSignup}% of clicks`}
          icon={<UserPlus className="size-5" />}
        />
        <StatCard
          label="Conversions"
          value={funnel.converted}
          subtitle={`${funnel.overallConversion}% overall rate`}
          icon={<CheckCircle2 className="size-5" />}
        />
        <StatCard
          label="This Month"
          value={periods.thisMonthTotal}
          subtitle={`${periods.thisWeekTotal} this week`}
          icon={<TrendingUp className="size-5" />}
          trend={periods.monthOverMonth}
        />
      </div>

      {/* Conversion Funnel + Weekly Chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Funnel */}
        <div className="rounded-xl border bg-card p-6 space-y-5">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <TrendingUp className="size-4 text-primary" /> Conversion Funnel
            </h3>
            <p className="text-sm text-muted-foreground">Click → Signup → Conversion pipeline</p>
          </div>
          <div className="space-y-4">
            <FunnelBar label="Link Clicks" value={funnel.clicks} total={funnel.total} color="bg-blue-500" />
            <FunnelBar label="Signups" value={funnel.signups} total={funnel.total} color="bg-yellow-500" />
            <FunnelBar label="Conversions" value={funnel.converted} total={funnel.total} color="bg-emerald-500" />
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="text-xl font-bold text-primary">{funnel.clickToSignup}%</div>
              <div className="text-xs text-muted-foreground">Click → Signup</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="text-xl font-bold text-emerald-600">{funnel.signupToConvert}%</div>
              <div className="text-xs text-muted-foreground">Signup → Convert</div>
            </div>
          </div>
        </div>

        {/* Weekly Chart */}
        <WeeklyChart data={analytics!.weeklyData} />
      </div>

      {/* QR Code + Referral Link (for reps) */}
      {repProfile && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border bg-card p-6 space-y-4">
            <div>
              <h2 className="font-semibold text-lg">{repProfile.name}</h2>
              <p className="text-sm text-muted-foreground">{repProfile.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="font-mono">{repProfile.repUid}</Badge>
                <Badge className={repProfile.isActive ? "bg-emerald-500/10 text-emerald-700" : "bg-red-500/10 text-red-700"}>
                  {repProfile.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Your Referral Link</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-muted px-3 py-2 rounded-lg truncate">
                  {referralUrl}
                </code>
                <Button size="sm" variant="outline" onClick={copyLink}>
                  <Copy className="size-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6 flex flex-col items-center justify-center space-y-4">
            <h3 className="font-semibold">Your QR Code</h3>
            <p className="text-sm text-muted-foreground text-center">
              Have prospects scan this to join with your referral tracking
            </p>
            <div
              ref={qrRef}
              className="p-4 bg-white dark:bg-white rounded-xl shadow-sm"
            >
              <img
                src={qrCodeUrl}
                alt={`QR code for rep ${repProfile.repUid}`}
                width={200}
                height={200}
                className="rounded"
              />
            </div>
            <div className="text-center">
              <p className="font-mono text-sm font-bold text-primary">{repProfile.repUid}</p>
              <p className="text-xs text-muted-foreground">Rep ID</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <Button
                size="sm"
                onClick={() => setShowQRFullScreen(true)}
                className="w-full sm:w-auto"
              >
                <Maximize2 className="size-4" /> Display QR Code
              </Button>
              <a
                href={qrCodeDownloadUrl}
                download={`charity-swipes-qr-${repProfile.repUid}.png`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <Download className="size-3.5" /> Download (high-res)
              </a>
            </div>
          </div>

          {/* Full-screen QR overlay */}
          {showQRFullScreen && (
            <QRFullScreen
              repUid={repProfile.repUid}
              url={referralUrl}
              onClose={() => setShowQRFullScreen(false)}
            />
          )}
        </div>
      )}

      {/* Admin: Rep Performance Breakdown */}
      {isAdmin && analytics!.repBreakdown.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="size-5" /> Sales Rep Performance
          </h2>

          {/* Mobile: Card layout */}
          <div className="md:hidden space-y-3">
            {analytics!.repBreakdown.map((rep) => (
              <div key={rep.repId} className="rounded-xl border bg-card p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold">{rep.name}</div>
                    <div className="text-xs text-muted-foreground">{rep.email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-[10px]">{rep.repUid}</Badge>
                    <span className={`inline-flex size-2.5 rounded-full ${rep.isActive ? "bg-emerald-500" : "bg-red-400"}`} />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="rounded-lg bg-blue-500/10 p-2">
                    <div className="text-lg font-bold text-blue-600">{rep.clicks}</div>
                    <div className="text-[10px] text-muted-foreground">Clicks</div>
                  </div>
                  <div className="rounded-lg bg-yellow-500/10 p-2">
                    <div className="text-lg font-bold text-yellow-600">{rep.signups}</div>
                    <div className="text-[10px] text-muted-foreground">Signups</div>
                  </div>
                  <div className="rounded-lg bg-emerald-500/10 p-2">
                    <div className="text-lg font-bold text-emerald-600">{rep.conversions}</div>
                    <div className="text-[10px] text-muted-foreground">Converts</div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2">
                    <div className="text-lg font-bold">{rep.conversionRate.toFixed(1)}%</div>
                    <div className="text-[10px] text-muted-foreground">Rate</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: Scrollable table */}
          <div className="hidden md:block rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Rep</th>
                    <th className="text-center p-3 font-medium">UID</th>
                    <th className="text-center p-3 font-medium">Clicks</th>
                    <th className="text-center p-3 font-medium">Signups</th>
                    <th className="text-center p-3 font-medium">Conversions</th>
                    <th className="text-center p-3 font-medium">Rate</th>
                    <th className="text-center p-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics!.repBreakdown.map((rep) => (
                    <tr key={rep.repId} className="border-t hover:bg-muted/30">
                      <td className="p-3">
                        <div className="font-medium">{rep.name}</div>
                        <div className="text-xs text-muted-foreground">{rep.email}</div>
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant="outline" className="font-mono text-xs">{rep.repUid}</Badge>
                      </td>
                      <td className="p-3 text-center font-medium text-blue-600">{rep.clicks}</td>
                      <td className="p-3 text-center font-medium text-yellow-600">{rep.signups}</td>
                      <td className="p-3 text-center font-medium text-emerald-600">{rep.conversions}</td>
                      <td className="p-3 text-center">
                        <Badge className={rep.conversionRate > 20 ? "bg-emerald-500/10 text-emerald-700" : rep.conversionRate > 0 ? "bg-yellow-500/10 text-yellow-700" : "bg-muted text-muted-foreground"}>
                          {rep.conversionRate.toFixed(1)}%
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex size-2 rounded-full ${rep.isActive ? "bg-emerald-500" : "bg-red-400"}`} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* My Personal Lead Database */}
      {repProfile && (
        <div className="rounded-xl border bg-card p-5">
          <MyLeadsSection />
        </div>
      )}

      {/* Referrals Table */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Link2 className="size-5" /> {isAdmin && !repProfile ? "All Referrals" : "Your Referrals"}
        </h2>
        {referrals && referrals.length > 0 ? (
          <div className="rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[480px]">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Prospect</th>
                    <th className="text-left p-3 font-medium">Business</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals
                    .sort((a, b) => b.createdAt - a.createdAt)
                    .map((ref) => {
                      const sc = statusConfig[ref.status] ?? statusConfig.clicked;
                      return (
                        <tr key={ref._id} className="border-t hover:bg-muted/30">
                          <td className="p-3">
                            <div className="font-medium">{ref.prospectName ?? "Anonymous"}</div>
                            {ref.prospectEmail && (
                              <div className="text-xs text-muted-foreground">{ref.prospectEmail}</div>
                            )}
                          </td>
                          <td className="p-3 text-muted-foreground">{ref.businessName ?? "—"}</td>
                          <td className="p-3">
                            <Badge className={sc.color}>
                              {sc.icon} <span className="ml-1">{sc.label}</span>
                            </Badge>
                          </td>
                          <td className="p-3 text-muted-foreground">{timeAgo(ref.createdAt)}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground rounded-xl border">
            <Link2 className="size-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No referrals yet</p>
            <p className="text-sm">Share your QR code or link with prospects to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
