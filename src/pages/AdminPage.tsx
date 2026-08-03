import { useMutation, useQuery } from "convex/react";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Clock,
  Copy,
  DollarSign,
  ExternalLink,
  FileSearch,
  FileText,
  Globe,
  Hash,
  Heart,
  Home,
  Key,
  MessageSquare,
  Plus,
  Save,
  Settings,
  Settings2,
  Shield,
  TicketCheck,
  ToggleLeft,
  ToggleRight,
  Trash2,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

type AdminTab = "dashboard" | "members" | "applications" | "questions" | "channels" | "tickets" | "charities" | "integrations" | "settings" | "reps" | "statements";

const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", icon: <BarChart3 className="size-4" /> },
  { id: "members", label: "Members", icon: <Users className="size-4" /> },
  { id: "reps", label: "Sales Reps", icon: <UserPlus className="size-4" /> },
  { id: "applications", label: "Applications", icon: <FileText className="size-4" /> },
  { id: "questions", label: "Questions", icon: <MessageSquare className="size-4" /> },
  { id: "channels", label: "Channels", icon: <Hash className="size-4" /> },
  { id: "statements", label: "Statements", icon: <FileSearch className="size-4" /> },
  { id: "tickets", label: "Tickets", icon: <TicketCheck className="size-4" /> },
  { id: "charities", label: "Charities", icon: <Heart className="size-4" /> },
  { id: "integrations", label: "Integrations", icon: <Globe className="size-4" /> },
  { id: "settings", label: "Settings", icon: <Settings2 className="size-4" /> },
];

/* ===== Dashboard ===== */
function AdminDashboard() {
  const members = useQuery(api.userProfiles.listAll);
  const tickets = useQuery(api.tickets.list);
  const applications = useQuery(api.applications.list);
  const stats = useQuery(api.charity.getStats);

  const admins = members?.filter((m) => m.role === "admin").length ?? 0;
  const customers = members?.filter((m) => m.role === "customer").length ?? 0;
  const prospects = members?.filter((m) => m.role === "prospect").length ?? 0;
  const reps = members?.filter((m) => m.role === "sales_rep").length ?? 0;
  const openTickets = tickets?.filter((t) => t.status === "open").length ?? 0;
  const inProgressTickets = tickets?.filter((t) => t.status === "in_progress").length ?? 0;
  const resolvedTickets = tickets?.filter((t) => t.status === "resolved").length ?? 0;
  const pendingApps = applications?.filter((a) => a.status === "pending").length ?? 0;
  const approvedApps = applications?.filter((a) => a.status === "approved").length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BarChart3 className="size-5" /> Dashboard
        </h2>
        <p className="text-sm text-muted-foreground">Community overview and key metrics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Total Members</span>
            <Users className="size-5 text-blue-500" />
          </div>
          <div className="text-3xl font-bold">{members?.length ?? 0}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {admins} admin · {customers} customer · {prospects} prospect · {reps} rep
          </p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Pending Applications</span>
            <FileText className="size-5 text-yellow-500" />
          </div>
          <div className="text-3xl font-bold flex items-center gap-2">
            {pendingApps}
            {pendingApps > 0 && <Clock className="size-5 text-yellow-500" />}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {applications?.length ?? 0} total · {approvedApps} approved
          </p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Open Tickets</span>
            <MessageSquare className="size-5 text-orange-500" />
          </div>
          <div className="text-3xl font-bold">{openTickets + inProgressTickets}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {openTickets} open · {inProgressTickets} in progress · {resolvedTickets} resolved
          </p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Charity Impact</span>
            <Heart className="size-5 text-pink-500" />
          </div>
          <div className="text-3xl font-bold">
            ${stats ? (stats.totalDonated / 1000).toFixed(1) : "0"}K
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats?.activeCharities ?? 0} charities supported
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-5">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Clock className="size-4 text-yellow-500" /> Recent Activity
          </h3>
          <ul className="space-y-2 text-sm">
            {pendingApps > 0 && (
              <li className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-yellow-500" />
                {pendingApps} application{pendingApps > 1 ? "s" : ""} awaiting review
              </li>
            )}
            {openTickets > 0 && (
              <li className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-orange-500" />
                {openTickets} support ticket{openTickets > 1 ? "s" : ""} need attention
              </li>
            )}
            {!pendingApps && !openTickets && (
              <li className="text-muted-foreground">All clear — no pending items</li>
            )}
          </ul>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Users className="size-4 text-blue-500" /> Member Breakdown
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="flex items-center gap-2"><span className="size-2 rounded-full bg-pink-500" /> Admins</span><span>{admins}</span></div>
            <div className="flex justify-between"><span className="flex items-center gap-2"><span className="size-2 rounded-full bg-emerald-500" /> Customers</span><span>{customers}</span></div>
            <div className="flex justify-between"><span className="flex items-center gap-2"><span className="size-2 rounded-full bg-purple-500" /> Prospects</span><span>{prospects}</span></div>
            <div className="flex justify-between"><span className="flex items-center gap-2"><span className="size-2 rounded-full bg-blue-500" /> Sales Reps</span><span>{reps}</span></div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Heart className="size-4 text-pink-500" /> Charity Stats
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Total Donated</span><span className="font-medium">${stats?.totalDonated?.toLocaleString() ?? 0}</span></div>
            <div className="flex justify-between"><span>Active Charities</span><span className="font-medium">{stats?.activeCharities ?? 0}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== Members ===== */
function AdminMembers() {
  const members = useQuery(api.userProfiles.listAll);
  const updateRole = useMutation(api.userProfiles.updateRole);
  const setAccountStatus = useMutation(api.userProfiles.setAccountStatus);
  const createRep = useMutation(api.salesReps.create);

  const [actionModal, setActionModal] = useState<{
    member: any;
    action: "suspend" | "probation" | "remove" | "activate";
  } | null>(null);
  const [reason, setReason] = useState("");
  const [probationDays, setProbationDays] = useState(30);

  const roleColors: Record<string, string> = {
    admin: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
    customer: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    prospect: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
    sales_rep: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  };

  const statusColors: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    suspended: "bg-red-500/10 text-red-700 dark:text-red-400",
    probation: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    removed: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
  };

  const handleRoleChange = async (profileId: string, userId: string, name: string, email: string, newRole: string) => {
    try {
      await updateRole({ profileId: profileId as any, role: newRole as any });
      if (newRole === "sales_rep") {
        try {
          await createRep({ userId, name, email });
          toast.success(`${name} promoted to Sales Rep with unique UID!`);
        } catch {
          toast.success("Role updated!");
        }
      } else {
        toast.success("Role updated!");
      }
    } catch {
      toast.error("Failed to update role");
    }
  };

  const handleStatusAction = async () => {
    if (!actionModal) return;
    try {
      const statusMap = {
        suspend: "suspended" as const,
        probation: "probation" as const,
        remove: "removed" as const,
        activate: "active" as const,
      };
      await setAccountStatus({
        profileId: actionModal.member._id,
        status: statusMap[actionModal.action],
        reason: reason || undefined,
        probationDays: actionModal.action === "probation" ? probationDays : undefined,
      });
      toast.success(
        actionModal.action === "activate"
          ? `${actionModal.member.name}'s account reactivated`
          : `${actionModal.member.name}'s account ${actionModal.action === "suspend" ? "suspended" : actionModal.action === "probation" ? "placed on probation" : "removed"}`
      );
      setActionModal(null);
      setReason("");
    } catch {
      toast.error("Failed to update account status");
    }
  };

  const acctStatus = (m: any) => m.accountStatus || "active";

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Users className="size-5" /> Members ({members?.length ?? 0})
      </h2>
      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">Name</th>
              <th className="text-left p-3 font-medium hidden md:table-cell">Email</th>
              <th className="text-left p-3 font-medium">Role</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-left p-3 font-medium hidden md:table-cell">Joined</th>
              <th className="text-left p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members?.map((m) => (
              <tr key={m._id} className={`border-t ${acctStatus(m) === "removed" ? "opacity-50" : ""}`}>
                <td className="p-3 font-medium">
                  <div className="flex items-center gap-2">
                    {m.profileImageUrl ? (
                      <img src={m.profileImageUrl} alt="" className="size-7 rounded-full object-cover" />
                    ) : (
                      <div className="size-7 rounded-full bg-pink-500/10 flex items-center justify-center text-xs font-bold text-pink-600">
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div>{m.name}</div>
                      <div className="text-xs text-muted-foreground md:hidden">{m.email}</div>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-muted-foreground hidden md:table-cell">{m.email}</td>
                <td className="p-3">
                  <Badge className={roleColors[m.role]}>{m.role === "sales_rep" ? "Sales Rep" : m.role}</Badge>
                </td>
                <td className="p-3">
                  <Badge className={statusColors[acctStatus(m)]}>
                    {acctStatus(m) === "probation" && m.probationUntil
                      ? `Probation (until ${new Date(m.probationUntil).toLocaleDateString()})`
                      : acctStatus(m)}
                  </Badge>
                </td>
                <td className="p-3 text-muted-foreground hidden md:table-cell">{new Date(m.joinedAt).toLocaleDateString()}</td>
                <td className="p-3">
                  <div className="flex flex-col gap-1">
                    <select
                      className="text-xs border rounded px-2 py-1 bg-background"
                      value={m.role}
                      onChange={(e) => handleRoleChange(m._id, m.userId, m.name, m.email, e.target.value)}
                    >
                      <option value="prospect">Prospect</option>
                      <option value="customer">Customer</option>
                      <option value="admin">Admin</option>
                      <option value="sales_rep">Sales Rep</option>
                    </select>
                    {m.role !== "admin" && (
                      <div className="flex gap-1 flex-wrap">
                        {acctStatus(m) !== "suspended" && acctStatus(m) !== "removed" && (
                          <button
                            className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 hover:bg-red-500/20"
                            onClick={() => { setActionModal({ member: m, action: "suspend" }); setReason(""); }}
                          >
                            Suspend
                          </button>
                        )}
                        {acctStatus(m) !== "probation" && acctStatus(m) !== "removed" && (
                          <button
                            className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 hover:bg-amber-500/20"
                            onClick={() => { setActionModal({ member: m, action: "probation" }); setReason(""); setProbationDays(30); }}
                          >
                            Probation
                          </button>
                        )}
                        {acctStatus(m) !== "removed" && (
                          <button
                            className="text-[10px] px-1.5 py-0.5 rounded bg-gray-500/10 text-gray-600 dark:text-gray-400 hover:bg-gray-500/20"
                            onClick={() => { setActionModal({ member: m, action: "remove" }); setReason(""); }}
                          >
                            Remove
                          </button>
                        )}
                        {(acctStatus(m) === "suspended" || acctStatus(m) === "probation" || acctStatus(m) === "removed") && (
                          <button
                            className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                            onClick={() => setActionModal({ member: m, action: "activate" })}
                          >
                            Reactivate
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Status Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold">
              {actionModal.action === "activate" && "Reactivate Account"}
              {actionModal.action === "suspend" && "⛔ Suspend Account"}
              {actionModal.action === "probation" && "⚠️ Place on Probation"}
              {actionModal.action === "remove" && "🚫 Remove Account"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {actionModal.action === "activate"
                ? `Reactivate ${actionModal.member.name}'s account?`
                : `${actionModal.action === "suspend" ? "Suspend" : actionModal.action === "probation" ? "Place on probation" : "Remove"} the account for ${actionModal.member.name} (${actionModal.member.email})?`}
            </p>

            {actionModal.action !== "activate" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Reason</label>
                <textarea
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background resize-none"
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason for this action..."
                />
              </div>
            )}

            {actionModal.action === "probation" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Probation Duration (days)</label>
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                  value={probationDays}
                  onChange={(e) => setProbationDays(Number(e.target.value))}
                >
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                  <option value={60}>60 days</option>
                  <option value={90}>90 days</option>
                </select>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setActionModal(null)}
              >
                Cancel
              </Button>
              <Button
                className={`flex-1 ${actionModal.action === "activate" ? "" : "bg-red-600 hover:bg-red-700 text-white"}`}
                onClick={handleStatusAction}
              >
                {actionModal.action === "activate" ? "Reactivate" : "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== Applications ===== */
function AdminApplications() {
  const applications = useQuery(api.applications.list);
  const updateStatus = useMutation(api.applications.updateStatus);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState("");

  const handleUpdate = async (id: string, status: "approved" | "rejected") => {
    try {
      await updateStatus({
        applicationId: id as any,
        status,
        reviewNote: reviewNote.trim() || undefined,
      });
      toast.success(`Application ${status}!`);
      setReviewNote("");
    } catch {
      toast.error("Failed to update");
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <FileText className="size-5" /> Applications
      </h2>
      <div className="space-y-3">
        {applications?.map((app) => (
          <div key={app._id} className="rounded-xl border bg-card overflow-hidden">
            {/* Header row */}
            <button
              type="button"
              className="w-full text-left p-5 flex items-start justify-between hover:bg-muted/30 transition-colors"
              onClick={() => setExpanded(expanded === app._id ? null : app._id)}
            >
              <div>
                <div className="font-semibold">{app.businessName}</div>
                <div className="text-sm text-muted-foreground">{app.userName} · {app.userEmail}</div>
                {app.accountType && (
                  <Badge className="mt-1 bg-purple-500/10 text-purple-700 dark:text-purple-400 text-[10px]">
                    {app.accountType === "merchant" ? "Verified Merchant" : app.accountType === "prospect" ? "Potential Merchant" : "Sales Rep"}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge className={app.status === "pending" ? "bg-yellow-500/10 text-yellow-700" : app.status === "approved" ? "bg-emerald-500/10 text-emerald-700" : "bg-red-500/10 text-red-700"}>
                  {app.status}
                </Badge>
                <svg className={`size-4 text-muted-foreground transition-transform ${expanded === app._id ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Expanded qualifying details */}
            {expanded === app._id && (
              <div className="border-t px-5 pb-5 pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {app.businessType && (
                    <div>
                      <span className="text-xs text-muted-foreground">Business Type</span>
                      <p className="font-medium">{app.businessType}</p>
                    </div>
                  )}
                  {app.businessAddress && (
                    <div>
                      <span className="text-xs text-muted-foreground">Location</span>
                      <p className="font-medium">{app.businessAddress}</p>
                    </div>
                  )}
                  {app.currentProcessor && (
                    <div>
                      <span className="text-xs text-muted-foreground">Current Processor</span>
                      <p className="font-medium">{app.currentProcessor}</p>
                    </div>
                  )}
                  {app.monthlyVolume && (
                    <div>
                      <span className="text-xs text-muted-foreground">Monthly Volume</span>
                      <p className="font-medium">{app.monthlyVolume}</p>
                    </div>
                  )}
                  {app.acceptsCards !== undefined && (
                    <div>
                      <span className="text-xs text-muted-foreground">Accepts Cards</span>
                      <p className="font-medium">{app.acceptsCards ? "Yes" : "Not yet"}</p>
                    </div>
                  )}
                  {app.merchantId && (
                    <div>
                      <span className="text-xs text-muted-foreground">Merchant ID</span>
                      <p className="font-medium">{app.merchantId}</p>
                    </div>
                  )}
                  {app.howHeard && (
                    <div>
                      <span className="text-xs text-muted-foreground">How Heard</span>
                      <p className="font-medium">{app.howHeard}</p>
                    </div>
                  )}
                  {app.charityInterest && (
                    <div>
                      <span className="text-xs text-muted-foreground">Charity Interest</span>
                      <p className="font-medium">{app.charityInterest}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-xs text-muted-foreground">Applied</span>
                    <p className="font-medium">{new Date(app.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {app.message && (
                  <div className="text-sm">
                    <span className="text-xs text-muted-foreground">Additional Notes</span>
                    <p className="mt-0.5">{app.message}</p>
                  </div>
                )}

                {app.reviewNote && (
                  <div className="text-sm bg-muted/50 rounded-lg p-3">
                    <span className="text-xs text-muted-foreground font-medium">Admin Note:</span>
                    <p className="mt-0.5">{app.reviewNote}</p>
                  </div>
                )}

                {app.status === "pending" && (
                  <div className="space-y-3 pt-2 border-t">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Review Note (optional)</label>
                      <textarea
                        className="w-full border rounded-lg px-3 py-2 text-sm bg-background resize-none"
                        rows={2}
                        value={expanded === app._id ? reviewNote : ""}
                        onChange={(e) => setReviewNote(e.target.value)}
                        placeholder="Internal review note..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleUpdate(app._id, "approved")}>
                        <CheckCircle2 className="size-4" /> Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleUpdate(app._id, "rejected")}>
                        <XCircle className="size-4" /> Reject
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {applications?.length === 0 && (
          <p className="text-muted-foreground text-center py-8">No applications yet</p>
        )}
      </div>
    </div>
  );
}

/* ===== Sales Reps Management ===== */
function AdminReps() {
  const reps = useQuery(api.salesReps.list);
  const allReferrals = useQuery(api.salesReps.getAllReferrals);
  const members = useQuery(api.userProfiles.listAll);
  const createRep = useMutation(api.salesReps.create);
  const updateRole = useMutation(api.userProfiles.updateRole);
  const toggleActive = useMutation(api.salesReps.toggleActive);
  const removeRep = useMutation(api.salesReps.remove);

  const [showAdd, setShowAdd] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");

  // Members who aren't already reps
  const repUserIds = new Set(reps?.map((r) => r.userId) ?? []);
  const eligibleMembers = members?.filter(
    (m) => !repUserIds.has(m.userId) && m.role !== "admin"
  ) ?? [];

  const handleAssignRep = async () => {
    const member = members?.find((m) => m.userId === selectedUserId);
    if (!member) return;
    try {
      await createRep({ userId: member.userId, name: member.name, email: member.email });
      await updateRole({ profileId: member._id as any, role: "sales_rep" as any });
      toast.success(`${member.name} is now a Sales Rep!`);
      setShowAdd(false);
      setSelectedUserId("");
    } catch {
      toast.error("Failed to assign rep");
    }
  };

  const handleToggle = async (repId: string, isActive: boolean) => {
    try {
      await toggleActive({ repId: repId as any, isActive });
      toast.success(isActive ? "Rep activated" : "Rep deactivated");
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleRemove = async (repId: string, name: string) => {
    if (!confirm(`Remove ${name} as a Sales Rep? Their role will revert to Customer.`)) return;
    try {
      await removeRep({ repId: repId as any });
      toast.success(`${name} removed as Sales Rep`);
    } catch {
      toast.error("Failed to remove");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <UserPlus className="size-5" /> Sales Reps ({reps?.length ?? 0})
        </h2>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="size-4" /> Assign New Rep
        </Button>
      </div>

      {/* Assign new rep panel */}
      {showAdd && (
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <h3 className="font-semibold text-sm">Assign a member as Sales Rep</h3>
          <p className="text-xs text-muted-foreground">
            This will change their role to Sales Rep and generate a unique UID/QR code for referral tracking.
          </p>
          <div className="flex gap-3">
            <select
              className="flex-1 border rounded-lg px-3 py-2 text-sm bg-background"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              <option value="">Select a member...</option>
              {eligibleMembers.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.name} — {m.email} ({m.role})
                </option>
              ))}
            </select>
            <Button onClick={handleAssignRep} disabled={!selectedUserId}>
              <UserPlus className="size-4" /> Assign
            </Button>
          </div>
        </div>
      )}

      {/* Rep list */}
      <div className="space-y-3">
        {reps?.map((rep) => {
          const repReferrals = allReferrals?.filter((r: any) => r.repUid === rep.repUid) ?? [];
          const converted = repReferrals.filter((r: any) => r.status === "converted").length;
          const signedUp = repReferrals.filter((r: any) => r.status === "signed_up").length;
          const clicked = repReferrals.filter((r: any) => r.status === "clicked").length;
          const convRate = repReferrals.length > 0 ? ((converted / repReferrals.length) * 100).toFixed(1) : "0";

          return (
            <div key={rep._id} className="rounded-xl border bg-card p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold">{rep.name}</div>
                    <Badge className={rep.isActive ? "bg-emerald-500/10 text-emerald-700" : "bg-red-500/10 text-red-700"}>
                      {rep.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">{rep.email}</div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">{rep.repUid}</Badge>
                    <span className="text-xs text-muted-foreground">
                      Joined {new Date(rep.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Clicks:</span>{" "}
                    <span className="font-medium">{clicked}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Signups:</span>{" "}
                    <span className="font-medium">{signedUp}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Conversions:</span>{" "}
                    <span className="font-medium text-emerald-600">{converted}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{convRate}% conversion</div>
                </div>
              </div>
              <div className="flex gap-2 mt-4 pt-3 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggle(rep._id, !rep.isActive)}
                >
                  {rep.isActive ? (
                    <><ToggleLeft className="size-4" /> Deactivate</>
                  ) : (
                    <><ToggleRight className="size-4" /> Activate</>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleRemove(rep._id, rep.name)}
                >
                  <Trash2 className="size-4" /> Remove
                </Button>
              </div>
            </div>
          );
        })}
        {reps?.length === 0 && (
          <p className="text-muted-foreground text-center py-8">
            No sales reps yet. Use "Assign New Rep" to promote a community member.
          </p>
        )}
      </div>
    </div>
  );
}

/* ===== Admin Statements Review ===== */
function AdminStatements() {
  const statements = useQuery(api.statements.listAll, { statusFilter: "all" });
  const stmtStats = useQuery(api.statements.stats);
  const updateStatus = useMutation(api.statements.updateStatus);
  const saveAnalysis = useMutation(api.statements.saveAnalysis);
  const [selected, setSelected] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  // Analysis form state
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  const filtered = statements?.filter((s) =>
    statusFilter === "all" ? true : s.status === statusFilter,
  );

  const loadForm = (s: any) => {
    setForm({
      currentProcessor: s.currentProcessor || "",
      monthlyVolume: s.monthlyVolume || "",
      monthlyTransactions: s.monthlyTransactions || "",
      effectiveRate: s.effectiveRate || "",
      monthlyFees: s.monthlyFees || "",
      interchangeFees: s.interchangeFees || "",
      assessmentFees: s.assessmentFees || "",
      processorMarkup: s.processorMarkup || "",
      monthlyServiceFee: s.monthlyServiceFee || "",
      pciFee: s.pciFee || "",
      statementFee: s.statementFee || "",
      batchFee: s.batchFee || "",
      otherFees: s.otherFees || "",
      csEffectiveRate: s.csEffectiveRate || "",
      csMonthlyFees: s.csMonthlyFees || "",
      csDonationMonthly: s.csDonationMonthly || "",
      adminNotes: s.adminNotes || "",
    });
  };

  // Auto-calculate savings
  const monthlyFees = parseFloat(form.monthlyFees) || 0;
  const csFees = parseFloat(form.csMonthlyFees) || 0;
  const monthlySavings = monthlyFees > 0 && csFees >= 0 ? monthlyFees - csFees : 0;
  const annualSavings = monthlySavings * 12;

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const numOrUndef = (v: any) => {
        const n = parseFloat(v);
        return isNaN(n) ? undefined : n;
      };
      await saveAnalysis({
        statementId: selected as any,
        currentProcessor: form.currentProcessor || undefined,
        monthlyVolume: numOrUndef(form.monthlyVolume),
        monthlyTransactions: numOrUndef(form.monthlyTransactions),
        effectiveRate: numOrUndef(form.effectiveRate),
        monthlyFees: numOrUndef(form.monthlyFees),
        interchangeFees: numOrUndef(form.interchangeFees),
        assessmentFees: numOrUndef(form.assessmentFees),
        processorMarkup: numOrUndef(form.processorMarkup),
        monthlyServiceFee: numOrUndef(form.monthlyServiceFee),
        pciFee: numOrUndef(form.pciFee),
        statementFee: numOrUndef(form.statementFee),
        batchFee: numOrUndef(form.batchFee),
        otherFees: numOrUndef(form.otherFees),
        csSavingsMonthly: monthlySavings > 0 ? monthlySavings : undefined,
        csSavingsAnnual: annualSavings > 0 ? annualSavings : undefined,
        csEffectiveRate: numOrUndef(form.csEffectiveRate),
        csMonthlyFees: numOrUndef(form.csMonthlyFees),
        csDonationMonthly: numOrUndef(form.csDonationMonthly),
        adminNotes: form.adminNotes || undefined,
      });
      toast.success("Analysis saved and merchant notified!");
      setSelected(null);
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    }
    setSaving(false);
  };

  const STATUS_COLORS: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
    reviewing: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    analyzed: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    rejected: "bg-red-500/10 text-red-700 dark:text-red-400",
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <FileSearch className="size-5" /> Statement Review & Analysis
      </h2>

      {/* Stats */}
      {stmtStats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { label: "Total", count: stmtStats.total, color: "" },
            { label: "Pending", count: stmtStats.pending, color: "text-yellow-600 dark:text-yellow-400" },
            { label: "Reviewing", count: stmtStats.reviewing, color: "text-blue-600 dark:text-blue-400" },
            { label: "Analyzed", count: stmtStats.analyzed, color: "text-emerald-600 dark:text-emerald-400" },
            { label: "Rejected", count: stmtStats.rejected, color: "text-red-600 dark:text-red-400" },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border bg-card p-3 text-center">
              <div className={`text-xl font-bold ${s.color}`}>{s.count}</div>
              <div className="text-[10px] text-muted-foreground uppercase">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        {["all", "pending", "reviewing", "analyzed", "rejected"].map((f) => (
          <button
            key={f}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
              statusFilter === f ? "border-pink-500 ring-1 ring-pink-500 font-medium" : "hover:border-pink-300"
            }`}
            onClick={() => setStatusFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered?.map((s) => (
          <div
            key={s._id}
            className={`rounded-xl border bg-card p-4 cursor-pointer hover:border-pink-300 transition-all ${
              selected === s._id ? "ring-2 ring-pink-500" : ""
            }`}
            onClick={() => {
              setSelected(selected === s._id ? null : s._id);
              if (selected !== s._id) loadForm(s);
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-pink-500/10 flex items-center justify-center">
                  <FileSearch className="size-5 text-pink-500" />
                </div>
                <div>
                  <div className="font-medium text-sm">{s.businessName || s.userName}</div>
                  <div className="text-xs text-muted-foreground">
                    {s.userEmail} · {s.fileName} · {new Date(s.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={STATUS_COLORS[s.status] ?? ""}>{s.status}</Badge>
                {s.fileUrl && (
                  <a
                    href={s.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-pink-600 hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="size-3" /> View
                  </a>
                )}
              </div>
            </div>

            {/* Expanded analysis form */}
            {selected === s._id && (
              <div className="mt-4 pt-4 border-t space-y-4" onClick={(e) => e.stopPropagation()}>
                {/* Status actions */}
                <div className="flex gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground self-center mr-1">Set status:</span>
                  {(["pending", "reviewing", "analyzed", "rejected"] as const).map((st) => (
                    <button
                      key={st}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                        s.status === st ? "ring-2 ring-pink-500 font-semibold " : "hover:border-pink-300 "
                      }${STATUS_COLORS[st]}`}
                      onClick={async () => {
                        await updateStatus({ statementId: s._id, status: st });
                        toast.success(`Status set to ${st}`);
                      }}
                    >
                      {st.charAt(0).toUpperCase() + st.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Current processor data */}
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                    <DollarSign className="size-4 text-red-500" /> Current Processor Data
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    <AnalysisInput label="Processor Name" value={form.currentProcessor} onChange={(v) => setForm({ ...form, currentProcessor: v })} />
                    <AnalysisInput label="Monthly Volume ($)" value={form.monthlyVolume} onChange={(v) => setForm({ ...form, monthlyVolume: v })} type="number" />
                    <AnalysisInput label="Monthly Transactions" value={form.monthlyTransactions} onChange={(v) => setForm({ ...form, monthlyTransactions: v })} type="number" />
                    <AnalysisInput label="Effective Rate (%)" value={form.effectiveRate} onChange={(v) => setForm({ ...form, effectiveRate: v })} type="number" />
                    <AnalysisInput label="Total Monthly Fees ($)" value={form.monthlyFees} onChange={(v) => setForm({ ...form, monthlyFees: v })} type="number" />
                  </div>
                </div>

                {/* Fee breakdown */}
                <div>
                  <h4 className="font-semibold text-sm mb-2">Fee Breakdown</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <AnalysisInput label="Interchange ($)" value={form.interchangeFees} onChange={(v) => setForm({ ...form, interchangeFees: v })} type="number" />
                    <AnalysisInput label="Assessments ($)" value={form.assessmentFees} onChange={(v) => setForm({ ...form, assessmentFees: v })} type="number" />
                    <AnalysisInput label="Processor Markup ($)" value={form.processorMarkup} onChange={(v) => setForm({ ...form, processorMarkup: v })} type="number" />
                    <AnalysisInput label="Monthly Service ($)" value={form.monthlyServiceFee} onChange={(v) => setForm({ ...form, monthlyServiceFee: v })} type="number" />
                    <AnalysisInput label="PCI Fee ($)" value={form.pciFee} onChange={(v) => setForm({ ...form, pciFee: v })} type="number" />
                    <AnalysisInput label="Statement Fee ($)" value={form.statementFee} onChange={(v) => setForm({ ...form, statementFee: v })} type="number" />
                    <AnalysisInput label="Batch Fee ($)" value={form.batchFee} onChange={(v) => setForm({ ...form, batchFee: v })} type="number" />
                    <AnalysisInput label="Other Fees ($)" value={form.otherFees} onChange={(v) => setForm({ ...form, otherFees: v })} type="number" />
                  </div>
                </div>

                {/* CS comparison */}
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                    <Heart className="size-4 text-pink-500" /> Charity Swipes Comparison
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    <AnalysisInput label="CS Effective Rate (%)" value={form.csEffectiveRate} onChange={(v) => setForm({ ...form, csEffectiveRate: v })} type="number" />
                    <AnalysisInput label="CS Monthly Fees ($)" value={form.csMonthlyFees} onChange={(v) => setForm({ ...form, csMonthlyFees: v })} type="number" />
                    <AnalysisInput label="Charity Donation/mo ($)" value={form.csDonationMonthly} onChange={(v) => setForm({ ...form, csDonationMonthly: v })} type="number" />
                  </div>
                  {/* Auto-calculated savings */}
                  {monthlySavings > 0 && (
                    <div className="mt-2 rounded-lg bg-emerald-500/10 p-3 flex items-center gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Monthly Savings: </span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          ${monthlySavings.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Annual Savings: </span>
                        <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
                          ${annualSavings.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Admin Notes</label>
                  <textarea
                    className="w-full mt-1 border rounded-lg px-3 py-2 text-sm bg-background resize-none"
                    rows={2}
                    value={form.adminNotes}
                    onChange={(e) => setForm({ ...form, adminNotes: e.target.value })}
                    placeholder="Notes about this analysis..."
                  />
                </div>

                {/* Save */}
                <div className="flex justify-end">
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? <Clock className="size-4 animate-spin" /> : <Save className="size-4" />}
                    {saving ? "Saving..." : "Save Analysis & Notify Merchant"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
        {filtered?.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No statements {statusFilter !== "all" ? `with status "${statusFilter}"` : "uploaded yet"}
          </div>
        )}
      </div>
    </div>
  );
}

function AnalysisInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: any;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="text-[11px] text-muted-foreground">{label}</label>
      <input
        type={type}
        className="w-full border rounded-lg px-2.5 py-1.5 text-sm bg-background"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        step={type === "number" ? "0.01" : undefined}
      />
    </div>
  );
}

/* ===== Admin Integrations (Slack + Discord) ===== */
function AdminIntegrations() {
  const convexUrl = "https://tough-parakeet-450.convex.site";
  const [copied, setCopied] = useState<string | null>(null);

  const copyUrl = (label: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const endpoints = [
    {
      label: "Slack Events URL",
      url: `${convexUrl}/api/slack/events`,
      help: "Add to Slack App → Event Subscriptions → Request URL",
    },
    {
      label: "Discord Interactions URL",
      url: `${convexUrl}/api/discord/interactions`,
      help: "Add to Discord App → Interactions Endpoint URL",
    },
    {
      label: "Discord Message Relay",
      url: `${convexUrl}/api/discord/message`,
      help: "Used by the Discord bot relay service (POST with X-Webhook-Secret header)",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Integrations</h2>
        <p className="text-sm text-muted-foreground">
          Connect Slack and Discord to sync community channels across platforms
        </p>
      </div>

      {/* Connection cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-[#4A154B] flex items-center justify-center text-white font-bold text-lg">#</div>
              <div>
                <div className="font-semibold">Slack</div>
                <div className="text-xs text-muted-foreground">Mirror community channels to your Slack workspace</div>
              </div>
            </div>
            <Settings className="size-5 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-3 text-xs">
            <Badge variant="outline" className="gap-1">
              <span className="size-1.5 rounded-full bg-muted-foreground" /> Not Connected
            </Badge>
            <span className="text-muted-foreground">■ 0 channels mapped</span>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-[#5865F2] flex items-center justify-center text-white font-bold text-lg">🎮</div>
              <div>
                <div className="font-semibold">Discord</div>
                <div className="text-xs text-muted-foreground">Bridge community channels to your Discord server</div>
              </div>
            </div>
            <Settings className="size-5 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-3 text-xs">
            <Badge variant="outline" className="gap-1">
              <span className="size-1.5 rounded-full bg-muted-foreground" /> Not Connected
            </Badge>
            <span className="text-muted-foreground">■ 0 channels mapped</span>
          </div>
        </div>
      </div>

      {/* Webhook Endpoints */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Settings className="size-4" />
          <h3 className="font-semibold">Webhook Endpoints</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Configure these URLs in your Slack App and Discord Bot settings
        </p>

        {endpoints.map((ep) => (
          <div key={ep.label} className="border rounded-lg p-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">{ep.label}</span>
              <button
                onClick={() => copyUrl(ep.label, ep.url)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Copy className="size-3.5" />
                {copied === ep.label ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className="bg-muted/50 rounded px-3 py-2 text-xs font-mono text-muted-foreground break-all">
              {ep.url}
            </div>
            <p className="text-xs text-muted-foreground">{ep.help}</p>
          </div>
        ))}
      </div>

      {/* Setup Guide */}
      <div className="rounded-xl border bg-card p-5 space-y-5">
        <div className="flex items-center gap-2">
          <FileText className="size-4" />
          <h3 className="font-semibold">Setup Guide</h3>
        </div>

        {/* Slack Setup */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">#</span>
            <h4 className="font-semibold text-sm">Slack Setup</h4>
          </div>
          <ol className="text-sm text-muted-foreground space-y-1.5 ml-6 list-decimal">
            <li>Go to <a href="https://api.slack.com/apps" target="_blank" rel="noopener noreferrer" className="text-primary underline">api.slack.com/apps</a> → Create New App</li>
            <li>Choose "From scratch", name it "Charity Swipes Community"</li>
            <li>Under OAuth & Permissions, add scopes: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">chat:write</code>, <code className="bg-muted px-1.5 py-0.5 rounded text-xs">channels:read</code>, <code className="bg-muted px-1.5 py-0.5 rounded text-xs">channels:manage</code>, <code className="bg-muted px-1.5 py-0.5 rounded text-xs">users:read</code></li>
            <li>Install to workspace → Copy the <strong>Bot User OAuth Token</strong></li>
            <li>Enable Event Subscriptions → paste the Slack Events URL above</li>
            <li>Subscribe to events: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">message.channels</code></li>
            <li>Paste the Bot Token and Signing Secret into the config below</li>
          </ol>
        </div>

        {/* Discord Setup */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎮</span>
            <h4 className="font-semibold text-sm">Discord Setup</h4>
          </div>
          <ol className="text-sm text-muted-foreground space-y-1.5 ml-6 list-decimal">
            <li>Go to <a href="https://discord.com/developers/applications" target="_blank" rel="noopener noreferrer" className="text-primary underline">discord.com/developers/applications</a> → New Application</li>
            <li>Name it "Charity Swipes Community" → under Bot → Reset Token → Copy</li>
            <li>Enable <strong>Message Content Intent</strong> under Privileged Intents</li>
            <li>Under OAuth2 → URL Generator: scopes = <code className="bg-muted px-1.5 py-0.5 rounded text-xs">bot</code>, permissions = <code className="bg-muted px-1.5 py-0.5 rounded text-xs">Manage Channels</code>, <code className="bg-muted px-1.5 py-0.5 rounded text-xs">Send Messages</code>, <code className="bg-muted px-1.5 py-0.5 rounded text-xs">Read Message History</code></li>
            <li>Invite the bot to your Discord server with the generated URL</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

/* ===== Admin Settings (full) ===== */
function AdminSettings() {
  const settings = useQuery(api.communitySettings.getAll);
  const setBatch = useMutation(api.communitySettings.setBatch);
  const [localSettings, setLocalSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) setLocalSettings({ ...settings });
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const pairs = Object.entries(localSettings).map(([key, value]) => ({ key, value }));
      await setBatch({ settings: pairs });
      toast.success("Settings saved!");
    } catch {
      toast.error("Failed to save settings");
    }
    setSaving(false);
  };

  const update = (key: string, value: string) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (!settings) return <div className="text-muted-foreground text-center py-8">Loading settings...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Settings2 className="size-5" /> Community Settings
          </h2>
          <p className="text-sm text-muted-foreground">Configure community branding, access, and policies</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="size-4" /> {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Branding */}
      <div className="rounded-xl border bg-card p-6 space-y-5">
        <h3 className="font-semibold flex items-center gap-2">
          <Heart className="size-4 text-pink-500" /> Branding
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Community Name</label>
            <Input
              value={localSettings.communityName ?? ""}
              onChange={(e) => update("communityName", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Primary Color</label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={localSettings.primaryColor ?? "#ec4899"}
                onChange={(e) => update("primaryColor", e.target.value)}
                className="size-10 rounded border cursor-pointer"
              />
              <Input
                value={localSettings.primaryColor ?? ""}
                onChange={(e) => update("primaryColor", e.target.value)}
                className="flex-1"
                placeholder="#ec4899"
              />
            </div>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Community Description</label>
          <textarea
            className="w-full border rounded-lg px-3 py-2 text-sm bg-background resize-none"
            rows={2}
            value={localSettings.communityDescription ?? ""}
            onChange={(e) => update("communityDescription", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Welcome Message</label>
          <textarea
            className="w-full border rounded-lg px-3 py-2 text-sm bg-background resize-none"
            rows={2}
            value={localSettings.welcomeMessage ?? ""}
            onChange={(e) => update("welcomeMessage", e.target.value)}
          />
        </div>
      </div>

      {/* Access Control */}
      <div className="rounded-xl border bg-card p-6 space-y-5">
        <h3 className="font-semibold flex items-center gap-2">
          <Shield className="size-4 text-blue-500" /> Access & Registration
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Public Signup</div>
              <div className="text-xs text-muted-foreground">Allow anyone to create an account</div>
            </div>
            <Switch
              checked={localSettings.allowPublicSignup === "true"}
              onCheckedChange={(v) => update("allowPublicSignup", v ? "true" : "false")}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Require Approval</div>
              <div className="text-xs text-muted-foreground">New signups must be approved before accessing member channels</div>
            </div>
            <Switch
              checked={localSettings.requireApproval === "true"}
              onCheckedChange={(v) => update("requireApproval", v ? "true" : "false")}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Prospect Channel Access</div>
              <div className="text-xs text-muted-foreground">Allow prospects to view public channels before approval</div>
            </div>
            <Switch
              checked={localSettings.allowProspectChannelView === "true"}
              onCheckedChange={(v) => update("allowProspectChannelView", v ? "true" : "false")}
            />
          </div>
        </div>
      </div>

      {/* Charity & Financials */}
      <div className="rounded-xl border bg-card p-6 space-y-5">
        <h3 className="font-semibold flex items-center gap-2">
          <Heart className="size-4 text-pink-500" /> Charity Give-Back
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Give-Back Rate (%)</label>
            <Input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={localSettings.charityGiveBackRate ?? "0.5"}
              onChange={(e) => update("charityGiveBackRate", e.target.value)}
              placeholder="0.5"
            />
            <p className="text-xs text-muted-foreground">Percentage of processing fees donated to selected charities</p>
          </div>
        </div>
      </div>

      {/* API Keys */}
      <div className="rounded-xl border bg-card p-6 space-y-5">
        <h3 className="font-semibold flex items-center gap-2">
          <Key className="size-4 text-purple-500" /> API Keys & Integrations
        </h3>
        <p className="text-xs text-muted-foreground">Configure API keys for lead generation and enrichment services. Keys are stored securely.</p>
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Google Places API Key</label>
            <Input
              type="password"
              value={localSettings.googlePlacesApiKey ?? ""}
              onChange={(e) => update("googlePlacesApiKey", e.target.value)}
              placeholder="AIza..."
            />
            <p className="text-xs text-muted-foreground">Used for Google Places lead search. Get one at console.cloud.google.com</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Apollo.io API Key</label>
            <Input
              type="password"
              value={localSettings.apolloApiKey ?? ""}
              onChange={(e) => update("apolloApiKey", e.target.value)}
              placeholder="Enter your Apollo API key..."
            />
            <p className="text-xs text-muted-foreground">Used for lead enrichment (owner name, email, phone, company data). Get one at app.apollo.io → Settings → API Keys</p>
          </div>
        </div>
      </div>

      {/* System */}
      <div className="rounded-xl border bg-card p-6 space-y-5">
        <h3 className="font-semibold flex items-center gap-2">
          <Globe className="size-4 text-orange-500" /> System
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Maintenance Mode</div>
              <div className="text-xs text-muted-foreground">Take the community offline for maintenance</div>
            </div>
            <Switch
              checked={localSettings.maintenanceMode === "true"}
              onCheckedChange={(v) => update("maintenanceMode", v ? "true" : "false")}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Max File Upload Size (MB)</label>
            <Input
              type="number"
              min="1"
              max="50"
              value={localSettings.maxFileUploadMb ?? "5"}
              onChange={(e) => update("maxFileUploadMb", e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== Main Admin Page ===== */
export function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const profile = useQuery(api.userProfiles.get);

  if (profile && profile.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p>Admin access required</p>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard": return <AdminDashboard />;
      case "members": return <AdminMembers />;
      case "applications": return <AdminApplications />;
      case "reps": return <AdminReps />;
      case "questions": return (
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MessageSquare className="size-5" /> Qualifying Questions
          </h2>
          <p className="text-sm text-muted-foreground">Configure the questions shown during member onboarding.</p>
          <div className="rounded-xl border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div><span className="font-medium text-sm">Account type selection</span><p className="text-xs text-muted-foreground">Verified Merchant, Potential Merchant, or Sales Rep</p></div>
              <Badge className="bg-emerald-500/10 text-emerald-700">Active</Badge>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div><span className="font-medium text-sm">Business information</span><p className="text-xs text-muted-foreground">Name, business name, phone number</p></div>
              <Badge className="bg-emerald-500/10 text-emerald-700">Active</Badge>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div><span className="font-medium text-sm">Referral source tracking</span><p className="text-xs text-muted-foreground">Auto-detect referral from QR code / link</p></div>
              <Badge className="bg-emerald-500/10 text-emerald-700">Active</Badge>
            </div>
          </div>
        </div>
      );
      case "statements": return <AdminStatements />;
      case "tickets": return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">View tickets from the <Link to="/tickets" className="text-primary underline">Tickets page</Link></p>
        </div>
      );
      case "channels": return (
        <div className="space-y-3">
          <h2 className="text-xl font-bold">Channels</h2>
          <p className="text-sm text-muted-foreground">Channel management coming soon. Channels are currently managed via seed data.</p>
        </div>
      );
      case "charities": return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">View charities from the <Link to="/charity" className="text-primary underline">Charity Impact page</Link></p>
        </div>
      );
      case "integrations": return <AdminIntegrations />;
      case "settings": return <AdminSettings />;
      default: return null;
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Admin sidebar */}
      <div className="w-56 border-r bg-card shrink-0 p-4 space-y-1 hidden md:block">
        <div className="flex items-center gap-2 px-3 py-2 mb-4">
          <Shield className="size-5 text-primary" />
          <span className="font-bold text-sm">Admin Panel</span>
        </div>
        <Link
          to="/community"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="size-4" />
          Back to Community
        </Link>
        <div className="border-b mb-3" />
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Mobile tab bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t p-2 flex gap-1 overflow-x-auto z-50">
        <Link
          to="/community"
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground"
        >
          <Home className="size-4" />
          Home
        </Link>
        {tabs.slice(0, 5).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-xs ${
              activeTab === tab.id ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 p-6 pb-20 md:pb-6 overflow-y-auto">{renderContent()}</div>
    </div>
  );
}
