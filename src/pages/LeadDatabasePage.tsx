import { useAction, useMutation, useQuery } from "convex/react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Database,
  Loader2,
  Phone,
  Mail,
  Plus,
  Search,
  Sparkles,
  Upload,
  UserCheck,
  UserPlus,
  Linkedin,

} from "lucide-react";
import { useRef, useState } from "react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { INDUSTRIES } from "@/data/industries";
import { STATE_LIST, getCitiesForState } from "@/data/locations";
import { toast } from "sonner";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  unclaimed: { label: "Unclaimed", color: "bg-gray-500/10 text-gray-600 dark:text-gray-400" },
  claimed: { label: "Claimed", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400" },
  attempted: { label: "Attempted", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  contacted: { label: "Contacted", color: "bg-purple-500/10 text-purple-700 dark:text-purple-400" },
  converted: { label: "Converted", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  not_interested: { label: "Not Interested", color: "bg-red-500/10 text-red-700 dark:text-red-400" },
};

export function LeadDatabasePage() {
  const profile = useQuery(api.userProfiles.get);
  const stats = useQuery(api.leads.getStats);


  const [statusFilter, setStatusFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [myClaimsOnly, setMyClaimsOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 25;

  const leads = useQuery(api.leads.list, {
    statusFilter: statusFilter !== "all" ? statusFilter : undefined,
    stateFilter: stateFilter !== "all" ? stateFilter : undefined,
    industryFilter: industryFilter !== "all" ? industryFilter : undefined,
    myClaimsOnly: myClaimsOnly || undefined,
  });

  // Client-side search
  const filtered = leads?.filter((l) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      l.businessName.toLowerCase().includes(q) ||
      l.ownerName?.toLowerCase().includes(q) ||
      l.email?.toLowerCase().includes(q) ||
      l.phone?.includes(q) ||
      l.city?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil((filtered?.length ?? 0) / PAGE_SIZE);
  const paged = filtered?.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const isAdmin = profile?.role === "admin";
  const isRep = profile?.role === "sales_rep" || isAdmin;

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Database className="size-6 text-pink-600" /> Lead Database
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {stats?.total ?? 0} total leads • {stats?.unclaimed ?? 0} unclaimed
            {stats && stats.myLeads > 0 && ` • ${stats.myLeads} claimed by you`}
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Button variant="outline" size="sm" onClick={() => setShowImportModal(true)}>
              <Upload className="size-4" /> Import CSV
            </Button>
          )}
          {isRep && (
            <Button size="sm" onClick={() => setShowAddModal(true)}>
              <Plus className="size-4" /> Add Lead
            </Button>
          )}
        </div>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {(Object.entries(STATUS_LABELS) as [string, { label: string; color: string }][]).map(
            ([key, { label }]) => (
              <button
                key={key}
                onClick={() => { setStatusFilter(statusFilter === key ? "all" : key); setPage(0); }}
                className={`rounded-lg border p-3 text-center transition-all ${
                  statusFilter === key ? "ring-2 ring-pink-500 border-pink-500" : "hover:border-pink-300"
                }`}
              >
                <div className="text-lg font-bold">{(stats as any)[key === "not_interested" ? "notInterested" : key] ?? 0}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</div>
              </button>
            ),
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name, owner, email, phone, city..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
          />
        </div>
        <select
          className="border rounded-lg px-3 py-2 text-sm bg-background"
          value={stateFilter}
          onChange={(e) => { setStateFilter(e.target.value); setPage(0); }}
        >
          <option value="all">All States</option>
          {STATE_LIST.map((s) => (
            <option key={s.code} value={s.code}>{s.name}</option>
          ))}
        </select>
        <select
          className="border rounded-lg px-3 py-2 text-sm bg-background"
          value={industryFilter}
          onChange={(e) => { setIndustryFilter(e.target.value); setPage(0); }}
        >
          <option value="all">All Industries</option>
          {INDUSTRIES.map((i) => (
            <option key={i} value={i}>{i}</option>
          ))}
        </select>
        {isRep && (
          <Button
            variant={myClaimsOnly ? "default" : "outline"}
            size="sm"
            onClick={() => { setMyClaimsOnly(!myClaimsOnly); setPage(0); }}
          >
            <UserCheck className="size-4" /> My Leads
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">Business</th>
                <th className="text-left p-3 font-medium hidden lg:table-cell">Owner/DM</th>
                <th className="text-left p-3 font-medium hidden md:table-cell">Contact</th>
                <th className="text-left p-3 font-medium hidden xl:table-cell">Location</th>
                <th className="text-left p-3 font-medium hidden xl:table-cell">POS / Processor</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Claimed By</th>
                <th className="text-left p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged?.map((lead) => (
                <LeadRow
                  key={lead._id}
                  lead={lead}
                  isRep={isRep}
                  isAdmin={isAdmin}
                  isExpanded={expandedLead === lead._id}
                  onToggle={() => setExpandedLead(expandedLead === lead._id ? null : lead._id)}
                  
                />
              ))}
              {paged?.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    {searchQuery ? "No leads match your search" : "No leads yet — add one or import a CSV"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered?.length ?? 0)} of {filtered?.length ?? 0}
          </span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
              Prev
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      {showAddModal && <AddLeadModal onClose={() => setShowAddModal(false)} />}
      {showImportModal && <ImportCSVModal onClose={() => setShowImportModal(false)} />}
    </div>
  );
}

/* ===== Apollo Enrich Button ===== */
function EnrichButton({ leadId }: { leadId: any }) {
  const enrichWithApollo = useAction(api.leadScraper.enrichWithApollo);
  const [enriching, setEnriching] = useState(false);

  const handleEnrich = async () => {
    setEnriching(true);
    try {
      const result = await enrichWithApollo({ leadId });
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (e: any) {
      toast.error(e.message || "Enrichment failed");
    }
    setEnriching(false);
  };

  return (
    <button
      className="mt-2 inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 transition-all dark:bg-purple-900/30 dark:border-purple-700 dark:text-purple-300"
      onClick={handleEnrich}
      disabled={enriching}
    >
      {enriching ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
      {enriching ? "Enriching..." : "Enrich with Apollo"}
    </button>
  );
}

/* ===== Lead Row ===== */
function LeadRow({
  lead,
  isRep,
  isAdmin,
  isExpanded,
  onToggle,
}: {
  lead: any;
  isRep: boolean;
  isAdmin: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const claimLead = useMutation(api.leads.claim);
  const updateStatus = useMutation(api.leads.updateContactStatus);
  const unclaimLead = useMutation(api.leads.unclaim);
  const [notes, setNotes] = useState(lead.contactNotes || "");
  const [updating, setUpdating] = useState(false);

  const handleClaim = async () => {
    try {
      await claimLead({ leadId: lead._id });
      toast.success("Lead claimed!");
    } catch (e: any) {
      toast.error(e.message || "Failed to claim");
    }
  };

  const handleStatusUpdate = async (status: string) => {
    setUpdating(true);
    try {
      await updateStatus({
        leadId: lead._id,
        status: status as any,
        notes: notes.trim() || undefined,
      });
      toast.success("Status updated!");
    } catch (e: any) {
      toast.error(e.message || "Failed to update");
    }
    setUpdating(false);
  };

  const s = STATUS_LABELS[lead.contactStatus] || STATUS_LABELS.unclaimed;

  return (
    <>
      <tr className="border-t hover:bg-muted/30 cursor-pointer" onClick={onToggle}>
        <td className="p-3">
          <div className="font-medium">{lead.businessName}</div>
          <div className="text-xs text-muted-foreground">{lead.industry || "—"}</div>
        </td>
        <td className="p-3 hidden lg:table-cell">{lead.ownerName || "—"}</td>
        <td className="p-3 hidden md:table-cell">
          <div className="space-y-0.5">
            {lead.phone && (
              <div className="flex items-center gap-1 text-xs">
                <Phone className="size-3" /> {lead.phone}
              </div>
            )}
            {lead.email && (
              <div className="flex items-center gap-1 text-xs">
                <Mail className="size-3" /> {lead.email}
              </div>
            )}
          </div>
        </td>
        <td className="p-3 hidden xl:table-cell text-muted-foreground">
          {[lead.city, lead.state].filter(Boolean).join(", ") || "—"}
        </td>
        <td className="p-3 hidden xl:table-cell text-muted-foreground text-xs">
          <div>{lead.posSystem || "—"}</div>
          <div>{lead.currentProcessor || ""}</div>
        </td>
        <td className="p-3">
          <Badge className={s.color}>{s.label}</Badge>
        </td>
        <td className="p-3 text-xs text-muted-foreground">{lead.claimedByRepName || "—"}</td>
        <td className="p-3" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1">
            {lead.contactStatus === "unclaimed" && isRep && (
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleClaim}>
                <UserPlus className="size-3" /> Claim
              </Button>
            )}
            <button className="p-1 hover:bg-muted rounded" onClick={onToggle}>
              {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </button>
          </div>
        </td>
      </tr>

      {/* Expanded details */}
      {isExpanded && (
        <tr className="border-t bg-muted/20">
          <td colSpan={8} className="p-4">
            <div className="grid md:grid-cols-3 gap-4">
              {/* Details column */}
              <div className="space-y-2 text-sm">
                <h4 className="font-semibold">Lead Details</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {lead.entityType && <div><span className="text-muted-foreground">Entity:</span> {lead.entityType}</div>}
                  {lead.ownerName && <div><span className="text-muted-foreground">Owner/DM:</span> {lead.ownerName}</div>}
                  {lead.phone && <div><span className="text-muted-foreground">Phone:</span> {lead.phone}</div>}
                  {lead.email && <div><span className="text-muted-foreground">Email:</span> {lead.email}</div>}
                  {lead.website && <div><span className="text-muted-foreground">Website:</span> <a href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener" className="text-pink-600 hover:underline">{lead.website}</a></div>}
                  {lead.posSystem && <div><span className="text-muted-foreground">POS:</span> {lead.posSystem}</div>}
                  {lead.currentProcessor && <div><span className="text-muted-foreground">Processor:</span> {lead.currentProcessor}</div>}
                  <div><span className="text-muted-foreground">Cash Discount:</span> {lead.cashDiscountProgram || "Unknown"}</div>
                  <div><span className="text-muted-foreground">Looking for POS:</span> {lead.lookingForNewPOS || "Unknown"}</div>
                  {lead.source && <div><span className="text-muted-foreground">Source:</span> {lead.source}</div>}
                  <div><span className="text-muted-foreground">Added:</span> {new Date(lead.createdAt).toLocaleDateString()}</div>
                  {lead.lastContactedAt && <div><span className="text-muted-foreground">Last Contact:</span> {new Date(lead.lastContactedAt).toLocaleDateString()}</div>}
                </div>
                {/* Apollo enrichment data */}
                {lead.apolloEnriched && (
                  <div className="mt-3 pt-3 border-t border-dashed space-y-1">
                    <div className="flex items-center gap-1 text-xs font-semibold text-purple-600">
                      <Sparkles className="size-3" /> Apollo Enriched
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {lead.ownerTitle && <div><span className="text-muted-foreground">Title:</span> {lead.ownerTitle}</div>}
                      {lead.ownerEmail && <div><span className="text-muted-foreground">Email (direct):</span> {lead.ownerEmail}</div>}
                      {lead.ownerPhone && <div><span className="text-muted-foreground">Phone (direct):</span> {lead.ownerPhone}</div>}
                      {lead.companySize && <div><span className="text-muted-foreground">Employees:</span> {lead.companySize}</div>}
                      {lead.annualRevenue && <div><span className="text-muted-foreground">Revenue:</span> {lead.annualRevenue}</div>}
                      {lead.technologies && <div className="col-span-2"><span className="text-muted-foreground">Tech Stack:</span> {lead.technologies}</div>}
                      {lead.ownerLinkedin && (
                        <div className="col-span-2">
                          <a href={lead.ownerLinkedin} target="_blank" rel="noopener" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                            <Linkedin className="size-3" /> LinkedIn Profile
                          </a>
                        </div>
                      )}
                    </div>
                    {lead.apolloEnrichedAt && <div className="text-[10px] text-muted-foreground mt-1">Enriched {new Date(lead.apolloEnrichedAt).toLocaleDateString()}</div>}
                  </div>
                )}
                {/* Enrich button */}
                {!lead.apolloEnriched && <EnrichButton leadId={lead._id} />}
              </div>

              {/* Status update column (only for claiming rep or admin) */}
              {(lead.claimedByRepId || isAdmin) && (
                <div className="space-y-2 text-sm">
                  <h4 className="font-semibold">Update Status</h4>
                  <div className="flex flex-wrap gap-1">
                    {(["claimed", "attempted", "contacted", "converted", "not_interested"] as const).map((st) => {
                      const stInfo = STATUS_LABELS[st];
                      return (
                        <button
                          key={st}
                          className={`text-[11px] px-2 py-1 rounded-lg border transition-all ${
                            lead.contactStatus === st
                              ? "ring-2 ring-pink-500 font-semibold " + stInfo.color
                              : "hover:border-pink-300 " + stInfo.color
                          }`}
                          onClick={() => handleStatusUpdate(st)}
                          disabled={updating}
                        >
                          {stInfo.label}
                        </button>
                      );
                    })}
                  </div>
                  {isAdmin && lead.claimedByRepId && (
                    <button
                      className="text-[11px] text-red-600 hover:underline"
                      onClick={async () => {
                        await unclaimLead({ leadId: lead._id });
                        toast.success("Lead unclaimed");
                      }}
                    >
                      Release / Unclaim
                    </button>
                  )}
                </div>
              )}

              {/* Notes column */}
              <div className="space-y-2 text-sm">
                <h4 className="font-semibold">Contact Notes</h4>
                <textarea
                  className="w-full border rounded-lg px-3 py-2 text-xs bg-background resize-none"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes from contact attempts..."
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => handleStatusUpdate(lead.contactStatus === "unclaimed" ? "claimed" : lead.contactStatus)}
                  disabled={updating}
                >
                  {updating ? <Loader2 className="size-3 animate-spin" /> : null}
                  Save Notes
                </Button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* ===== Add Lead Modal ===== */
function AddLeadModal({ onClose }: { onClose: () => void }) {
  const createLead = useMutation(api.leads.create);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    businessName: "",
    entityType: "",
    ownerName: "",
    phone: "",
    email: "",
    website: "",
    industry: "",
    city: "",
    state: "",
    posSystem: "",
    currentProcessor: "",
    cashDiscountProgram: "unknown" as "yes" | "no" | "unknown",
    lookingForNewPOS: "unknown" as "yes" | "no" | "unknown",
    source: "Manual Entry",
  });

  const handleSubmit = async () => {
    if (!form.businessName.trim()) { toast.error("Business name required"); return; }
    setLoading(true);
    try {
      await createLead({
        businessName: form.businessName.trim(),
        entityType: form.entityType || undefined,
        ownerName: form.ownerName || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        website: form.website || undefined,
        industry: form.industry || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        posSystem: form.posSystem || undefined,
        currentProcessor: form.currentProcessor || undefined,
        cashDiscountProgram: form.cashDiscountProgram,
        lookingForNewPOS: form.lookingForNewPOS,
        source: form.source || undefined,
      });
      toast.success("Lead added!");
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Failed to add lead");
    }
    setLoading(false);
  };

  const cities = form.state ? getCitiesForState(form.state) : [];
  const update = (field: string, value: string) => setForm({ ...form, [field]: value });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Plus className="size-5 text-pink-600" /> Add New Lead
        </h2>

        <div className="grid md:grid-cols-2 gap-3 text-sm">
          <div className="space-y-1">
            <label className="text-xs font-medium">Business Name *</label>
            <Input value={form.businessName} onChange={(e) => update("businessName", e.target.value)} placeholder="Business name" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Entity Type</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm bg-background" value={form.entityType} onChange={(e) => update("entityType", e.target.value)}>
              <option value="">Select...</option>
              <option>LLC</option><option>Corporation</option><option>Sole Proprietorship</option><option>Partnership</option><option>S-Corp</option><option>C-Corp</option><option>Franchise</option><option>Other</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Owner / Decision Maker</label>
            <Input value={form.ownerName} onChange={(e) => update("ownerName", e.target.value)} placeholder="Full name" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Phone</label>
            <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="(555) 123-4567" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Email</label>
            <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="email@business.com" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Website</label>
            <Input value={form.website} onChange={(e) => update("website", e.target.value)} placeholder="www.business.com" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Industry</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm bg-background" value={form.industry} onChange={(e) => update("industry", e.target.value)}>
              <option value="">Select industry...</option>
              {INDUSTRIES.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">State</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm bg-background" value={form.state} onChange={(e) => { setForm({ ...form, state: e.target.value, city: "" }); }}>
              <option value="">Select state...</option>
              {STATE_LIST.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">City</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm bg-background" value={form.city} onChange={(e) => update("city", e.target.value)} disabled={!form.state}>
              <option value="">{form.state ? "Select city..." : "Select state first"}</option>
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">POS System</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm bg-background" value={form.posSystem} onChange={(e) => update("posSystem", e.target.value)}>
              <option value="">Unknown</option><option>Clover</option><option>Square</option><option>Toast</option><option>Aloha</option><option>Micros</option><option>SpotOn</option><option>Lightspeed</option><option>Revel</option><option>TouchBistro</option><option>Shopify POS</option><option>Other</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Current Processor</label>
            <Input value={form.currentProcessor} onChange={(e) => update("currentProcessor", e.target.value)} placeholder="e.g. Heartland, First Data" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Cash Discount Program?</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm bg-background" value={form.cashDiscountProgram} onChange={(e) => update("cashDiscountProgram", e.target.value)}>
              <option value="unknown">Unknown</option><option value="yes">Yes</option><option value="no">No</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Looking for New POS?</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm bg-background" value={form.lookingForNewPOS} onChange={(e) => update("lookingForNewPOS", e.target.value)}>
              <option value="unknown">Unknown</option><option value="yes">Yes</option><option value="no">No</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            Add Lead
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ===== CSV Import Modal ===== */
function ImportCSVModal({ onClose }: { onClose: () => void }) {
  const bulkImport = useMutation(api.leads.bulkImport);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any[] | null>(null);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const parseCSV = (text: string) => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_"));
    const rows: any[] = [];

    // Map common CSV column names to our schema
    const fieldMap: Record<string, string> = {
      business_name: "businessName", business: "businessName", name: "businessName", company: "businessName",
      entity_type: "entityType", entity: "entityType", type: "entityType",
      owner: "ownerName", owner_name: "ownerName", decision_maker: "ownerName", contact: "ownerName", contact_name: "ownerName",
      phone: "phone", phone_number: "phone", telephone: "phone",
      email: "email", email_address: "email",
      website: "website", url: "website", web: "website",
      industry: "industry", category: "industry", business_type: "industry",
      city: "city",
      state: "state", st: "state",
      pos: "posSystem", pos_system: "posSystem", point_of_sale: "posSystem",
      processor: "currentProcessor", current_processor: "currentProcessor", payment_processor: "currentProcessor",
      cash_discount: "cashDiscountProgram", cash_discount_program: "cashDiscountProgram",
      looking_for_pos: "lookingForNewPOS", looking_for_new_pos: "lookingForNewPOS",
      source: "source",
    };

    for (let i = 1; i < lines.length; i++) {
      // Simple CSV parsing (handles quoted fields)
      const values: string[] = [];
      let current = "";
      let inQuotes = false;
      for (const char of lines[i]) {
        if (char === '"') { inQuotes = !inQuotes; continue; }
        if (char === "," && !inQuotes) { values.push(current.trim()); current = ""; continue; }
        current += char;
      }
      values.push(current.trim());

      const row: any = {};
      headers.forEach((h, idx) => {
        const field = fieldMap[h] || h;
        if (values[idx]) row[field] = values[idx];
      });

      // Normalize cash discount / looking for POS to yes/no/unknown
      if (row.cashDiscountProgram) {
        const v = row.cashDiscountProgram.toLowerCase();
        row.cashDiscountProgram = v === "yes" || v === "true" || v === "1" ? "yes" : v === "no" || v === "false" || v === "0" ? "no" : "unknown";
      }
      if (row.lookingForNewPOS) {
        const v = row.lookingForNewPOS.toLowerCase();
        row.lookingForNewPOS = v === "yes" || v === "true" || v === "1" ? "yes" : v === "no" || v === "false" || v === "0" ? "no" : "unknown";
      }

      if (row.businessName) rows.push(row);
    }
    return rows;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text);
      setPreview(rows);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!preview) return;
    setLoading(true);

    // Import in batches of 40
    let totalImported = 0;
    let totalSkipped = 0;
    for (let i = 0; i < preview.length; i += 40) {
      const batch = preview.slice(i, i + 40);
      try {
        const r = await bulkImport({ leads: batch });
        totalImported += r.imported;
        totalSkipped += r.skipped;
      } catch (e: any) {
        toast.error(`Batch error: ${e.message}`);
      }
    }
    setResult({ imported: totalImported, skipped: totalSkipped });
    toast.success(`Imported ${totalImported} leads, ${totalSkipped} duplicates skipped`);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Upload className="size-5 text-pink-600" /> Import Leads from CSV
        </h2>

        {!preview && !result && (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-4 text-sm space-y-2">
              <p className="font-medium">Expected CSV columns (flexible naming):</p>
              <p className="text-muted-foreground text-xs">
                Business Name, Entity Type, Owner/Contact Name, Phone, Email, Website,
                Industry, City, State, POS System, Current Processor, Cash Discount,
                Looking for POS, Source
              </p>
              <p className="text-xs text-muted-foreground">
                At minimum, each row needs a <strong>Business Name</strong>. Duplicates are auto-detected by name + phone/email.
              </p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFileChange}
              className="text-sm"
            />
          </div>
        )}

        {preview && !result && (
          <div className="space-y-3">
            <p className="text-sm">
              Found <strong>{preview.length}</strong> leads to import. Preview:
            </p>
            <div className="rounded-lg border max-h-60 overflow-y-auto text-xs">
              <table className="w-full">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="text-left p-2">Business</th>
                    <th className="text-left p-2">Owner</th>
                    <th className="text-left p-2">Phone</th>
                    <th className="text-left p-2">State</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 20).map((r, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2">{r.businessName}</td>
                      <td className="p-2">{r.ownerName || "—"}</td>
                      <td className="p-2">{r.phone || "—"}</td>
                      <td className="p-2">{r.state || "—"}</td>
                    </tr>
                  ))}
                  {preview.length > 20 && (
                    <tr className="border-t">
                      <td colSpan={4} className="p-2 text-center text-muted-foreground">
                        ...and {preview.length - 20} more
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Button onClick={handleImport} disabled={loading} className="w-full">
              {loading && <Loader2 className="size-4 animate-spin" />}
              Import {preview.length} Leads
            </Button>
          </div>
        )}

        {result && (
          <div className="text-center space-y-3 py-4">
            <CheckCircle2 className="size-12 text-emerald-500 mx-auto" />
            <div>
              <p className="text-lg font-bold">{result.imported} leads imported</p>
              {result.skipped > 0 && (
                <p className="text-sm text-muted-foreground">{result.skipped} duplicates skipped</p>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            {result ? "Done" : "Cancel"}
          </Button>
        </div>
      </div>
    </div>
  );
}
