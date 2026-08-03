import { useMutation, useQuery } from "convex/react";
import {
  Building2,
  CreditCard,
  DollarSign,
  Heart,
  Lock,
  Monitor,
  Percent,
  Receipt,
  Search,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

type Tab = "portfolio" | "transactions" | "residuals" | "devices" | "boarding";

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "portfolio", label: "Merchants" },
  { id: "transactions", label: "Transactions" },
  { id: "residuals", label: "Residuals & Commissions" },
  { id: "devices", label: "Devices" },
  { id: "boarding", label: "Boarding" },
];

function money(value: number | undefined, digits = 0): string {
  if (value === undefined) return "—";
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function shortDate(ts: number | undefined): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-600",
  pending: "bg-yellow-500/10 text-yellow-600",
  onboarding: "bg-blue-500/10 text-blue-600",
  at_risk: "bg-orange-500/10 text-orange-600",
  prospect: "bg-slate-500/10 text-slate-500",
  underwriting: "bg-yellow-500/10 text-yellow-600",
  closed: "bg-red-500/10 text-red-500",
  churned: "bg-red-500/10 text-red-500",
  settled: "bg-emerald-500/10 text-emerald-600",
  refund: "bg-orange-500/10 text-orange-600",
  deployed: "bg-emerald-500/10 text-emerald-600",
  in_stock: "bg-blue-500/10 text-blue-600",
  lead: "bg-slate-500/10 text-slate-500",
  approved: "bg-emerald-500/10 text-emerald-600",
  submitted: "bg-blue-500/10 text-blue-600",
};

function StatusBadge({ status }: { status: string | undefined }) {
  if (!status) return <span className="text-muted-foreground">—</span>;
  const cls = STATUS_STYLES[status] ?? "bg-muted text-muted-foreground";
  return (
    <Badge className={`${cls} border-0 font-medium capitalize`}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}

function StatCard({
  label,
  value,
  subtitle,
  icon,
}: {
  label: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
          {icon}
        </div>
      </div>
    </div>
  );
}

/** Renders a PII value, or an honest "encrypted" marker when unreadable. */
function Pii({ value }: { value: string | null | undefined }) {
  if (value) return <>{value}</>;
  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground text-xs">
      <Lock className="size-3" /> encrypted
    </span>
  );
}

function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="py-8 text-center text-sm text-muted-foreground"
      >
        {label}
      </td>
    </tr>
  );
}

function MerchantDrawer({
  merchantId,
  onClose,
}: {
  merchantId: Id<"crmMerchants">;
  onClose: () => void;
}) {
  const detail = useQuery(api.crm.getMerchant, { merchantId });
  const addNote = useMutation(api.crm.addMerchantNote);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function submitNote() {
    if (!note.trim()) return;
    setSaving(true);
    try {
      await addNote({ merchantId, note: note.trim() });
      setNote("");
      toast.success("Note added");
    } catch {
      toast.error("Could not save the note");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50">
      <div className="w-full max-w-2xl h-full overflow-y-auto bg-background border-l p-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">
              {detail?.merchant.businessName ?? "Loading…"}
            </h2>
            {detail?.merchant.dba && (
              <p className="text-sm text-muted-foreground">
                DBA {detail.merchant.dba}
              </p>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        {detail === undefined && (
          <p className="text-sm text-muted-foreground">Loading merchant…</p>
        )}
        {detail === null && (
          <p className="text-sm text-muted-foreground">Merchant not found.</p>
        )}

        {detail && (
          <>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Status</p>
                <StatusBadge status={detail.merchant.status} />
              </div>
              <div>
                <p className="text-muted-foreground">MID</p>
                <p className="font-mono text-xs">
                  {detail.merchant.mid ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Industry</p>
                <p>{detail.merchant.industry ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Equipment</p>
                <p>{detail.merchant.equipmentType ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Monthly volume</p>
                <p className="font-semibold">
                  {money(detail.merchant.monthlyVolume)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Effective rate</p>
                <p className="font-semibold">
                  {detail.merchant.effectiveRate !== undefined
                    ? `${detail.merchant.effectiveRate}%`
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Donated to charity</p>
                <p className="font-semibold text-primary">
                  {money(detail.merchant.charityDonated)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Contract ends</p>
                <p>{detail.merchant.contractEnd ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Owner</p>
                <p>
                  <Pii value={detail.merchant.ownerName} />
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Assigned rep</p>
                <p>{detail.merchant.assignedRepName || "Unassigned"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Email</p>
                <p>
                  <Pii value={detail.merchant.email} />
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Phone</p>
                <p>
                  <Pii value={detail.merchant.phone} />
                </p>
              </div>
            </div>

            {detail.merchant.piiEncrypted && (
              <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                Contact details for this merchant were encrypted by the previous
                system and cannot be decrypted without the original key.
              </div>
            )}

            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Notes</h3>
              <div className="flex gap-2">
                <Input
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Add a note…"
                />
                <Button onClick={submitNote} disabled={saving}>
                  Add
                </Button>
              </div>
              {detail.merchant.notes ? (
                <pre className="whitespace-pre-wrap text-xs text-muted-foreground bg-muted/40 rounded-lg p-3">
                  {detail.merchant.notes}
                </pre>
              ) : (
                <p className="text-xs text-muted-foreground">No notes yet.</p>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-sm">
                Devices ({detail.devices.length})
              </h3>
              {detail.devices.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No devices linked to this merchant.
                </p>
              ) : (
                <ul className="text-sm space-y-1">
                  {detail.devices.map(d => (
                    <li key={d._id} className="flex justify-between">
                      <span>{d.deviceType?.replace(/_/g, " ")}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {d.serialNumber}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-sm">
                Recent transactions ({detail.transactions.length})
              </h3>
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <tbody>
                    {detail.transactions.slice(0, 15).map(t => (
                      <tr key={t._id} className="border-b last:border-0">
                        <td className="p-2 text-muted-foreground text-xs">
                          {shortDate(t.timestamp)}
                        </td>
                        <td className="p-2">{t.customerName ?? "—"}</td>
                        <td className="p-2 text-xs text-muted-foreground">
                          {t.cardBrand} ••{t.cardLast4}
                        </td>
                        <td
                          className={`p-2 text-right font-semibold ${
                            (t.amount ?? 0) < 0 ? "text-orange-600" : ""
                          }`}
                        >
                          {money(t.amount, 2)}
                        </td>
                      </tr>
                    ))}
                    {detail.transactions.length === 0 && (
                      <EmptyRow colSpan={4} label="No transactions recorded." />
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function CrmPage() {
  const [tab, setTab] = useState<Tab>("portfolio");
  const [search, setSearch] = useState("");
  const [openMerchant, setOpenMerchant] = useState<Id<"crmMerchants"> | null>(
    null,
  );

  const stats = useQuery(api.crm.getPortfolioStats, {});
  const merchants = useQuery(api.crm.listMerchants, {});
  const transactions = useQuery(
    api.crm.listTransactions,
    tab === "transactions" ? { limit: 200 } : "skip",
  );
  const residuals = useQuery(
    api.crm.listResiduals,
    tab === "residuals" ? {} : "skip",
  );
  const commissions = useQuery(
    api.crm.listCommissions,
    tab === "residuals" ? {} : "skip",
  );
  const devices = useQuery(
    api.crm.listDevices,
    tab === "devices" ? {} : "skip",
  );
  const boarding = useQuery(
    api.crm.listBoardingApplications,
    tab === "boarding" ? {} : "skip",
  );

  const filteredMerchants = useMemo(() => {
    if (!merchants) return [];
    const q = search.trim().toLowerCase();
    if (!q) return merchants;
    return merchants.filter(m =>
      [m.businessName, m.dba, m.mid, m.industry]
        .filter(Boolean)
        .some(field => String(field).toLowerCase().includes(q)),
    );
  }, [merchants, search]);

  const accessDenied = merchants === null;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Building2 className="size-6 text-primary" /> Merchant CRM
        </h1>
        <p className="text-sm text-muted-foreground">
          Portfolio, processing activity, residuals and equipment.
        </p>
      </div>

      {accessDenied && (
        <div className="rounded-xl border p-6 text-sm text-muted-foreground">
          The CRM is available to admins and sales reps.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active merchants"
          value={stats ? `${stats.activeCount} / ${stats.merchantCount}` : "…"}
          subtitle="active of total in portfolio"
          icon={<Building2 className="size-5" />}
        />
        <StatCard
          label="Monthly volume"
          value={stats ? money(stats.monthlyVolume) : "…"}
          subtitle={
            stats
              ? `${stats.monthlyTransactions.toLocaleString()} transactions/mo`
              : undefined
          }
          icon={<TrendingUp className="size-5" />}
        />
        <StatCard
          label="Avg effective rate"
          value={stats ? `${stats.avgEffectiveRate}%` : "…"}
          subtitle="volume-weighted"
          icon={<Percent className="size-5" />}
        />
        <StatCard
          label="Donated to charity"
          value={stats ? money(stats.charityDonated) : "…"}
          subtitle="lifetime, all merchants"
          icon={<Heart className="size-5" />}
        />
      </div>

      <div className="flex flex-wrap gap-2 border-b">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "portfolio" && (
        <div className="space-y-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, MID or industry"
              className="pl-9"
            />
          </div>
          <div className="rounded-xl border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="p-3 font-medium">Merchant</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Industry</th>
                  <th className="p-3 font-medium text-right">Monthly volume</th>
                  <th className="p-3 font-medium text-right">Avg ticket</th>
                  <th className="p-3 font-medium text-right">Rate</th>
                  <th className="p-3 font-medium text-right">Donated</th>
                  <th className="p-3 font-medium">Rep</th>
                </tr>
              </thead>
              <tbody>
                {merchants === undefined && (
                  <EmptyRow colSpan={8} label="Loading merchants…" />
                )}
                {merchants && filteredMerchants.length === 0 && (
                  <EmptyRow
                    colSpan={8}
                    label="No merchants match that search."
                  />
                )}
                {filteredMerchants.map(m => (
                  <tr
                    key={m._id}
                    className="border-t hover:bg-muted/40 cursor-pointer"
                    onClick={() => setOpenMerchant(m._id)}
                  >
                    <td className="p-3">
                      <div className="font-medium">{m.businessName}</div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {m.mid ?? "—"}
                      </div>
                    </td>
                    <td className="p-3">
                      <StatusBadge status={m.status} />
                    </td>
                    <td className="p-3">{m.industry ?? "—"}</td>
                    <td className="p-3 text-right font-semibold">
                      {money(m.monthlyVolume)}
                    </td>
                    <td className="p-3 text-right">{money(m.avgTicket, 2)}</td>
                    <td className="p-3 text-right">
                      {m.effectiveRate !== undefined
                        ? `${m.effectiveRate}%`
                        : "—"}
                    </td>
                    <td className="p-3 text-right text-primary font-medium">
                      {money(m.charityDonated)}
                    </td>
                    <td className="p-3 text-xs">
                      {m.assignedRepName || "Unassigned"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "transactions" && (
        <div className="space-y-3">
          {stats && (
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard
                label="Transactions on file"
                value={stats.transactionCount.toLocaleString()}
                icon={<Receipt className="size-5" />}
              />
              <StatCard
                label="Settled volume"
                value={money(stats.settledVolume, 2)}
                icon={<DollarSign className="size-5" />}
              />
              <StatCard
                label="Refunds"
                value={`${stats.refundCount} · ${money(stats.refundTotal, 2)}`}
                icon={<CreditCard className="size-5" />}
              />
            </div>
          )}
          <div className="rounded-xl border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="p-3 font-medium">Date</th>
                  <th className="p-3 font-medium">Merchant</th>
                  <th className="p-3 font-medium">Customer</th>
                  <th className="p-3 font-medium">Card</th>
                  <th className="p-3 font-medium">Type</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions === undefined && (
                  <EmptyRow colSpan={7} label="Loading transactions…" />
                )}
                {transactions?.length === 0 && (
                  <EmptyRow colSpan={7} label="No transactions recorded." />
                )}
                {transactions?.map(t => (
                  <tr key={t._id} className="border-t">
                    <td className="p-3 text-xs text-muted-foreground">
                      {shortDate(t.timestamp)}
                    </td>
                    <td className="p-3">{t.merchantName}</td>
                    <td className="p-3">{t.customerName ?? "—"}</td>
                    <td className="p-3 text-xs">
                      {t.cardBrand} ••{t.cardLast4}
                    </td>
                    <td className="p-3 capitalize">{t.type ?? "—"}</td>
                    <td className="p-3">
                      <StatusBadge status={t.status} />
                    </td>
                    <td
                      className={`p-3 text-right font-semibold ${
                        (t.amount ?? 0) < 0 ? "text-orange-600" : ""
                      }`}
                    >
                      {money(t.amount, 2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "residuals" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <Wallet className="size-4 text-primary" /> Monthly residuals
            </h3>
            <div className="rounded-xl border overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="p-3 font-medium">Month</th>
                    <th className="p-3 font-medium text-right">Gross</th>
                    <th className="p-3 font-medium text-right">Cost</th>
                    <th className="p-3 font-medium text-right">Net</th>
                    <th className="p-3 font-medium text-right">Charity</th>
                  </tr>
                </thead>
                <tbody>
                  {residuals === undefined && (
                    <EmptyRow colSpan={5} label="Loading residuals…" />
                  )}
                  {residuals?.length === 0 && (
                    <EmptyRow colSpan={5} label="No residual statements yet." />
                  )}
                  {residuals?.map(r => (
                    <tr key={r._id} className="border-t">
                      <td className="p-3 font-medium">{r.month}</td>
                      <td className="p-3 text-right">
                        {money(r.grossRevenue)}
                      </td>
                      <td className="p-3 text-right text-muted-foreground">
                        {money(r.processorCost)}
                      </td>
                      <td className="p-3 text-right font-semibold">
                        {money(r.netRevenue)}
                      </td>
                      <td className="p-3 text-right text-primary">
                        {money(r.charityDonation)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <DollarSign className="size-4 text-primary" /> Rep commissions
            </h3>
            <div className="rounded-xl border overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="p-3 font-medium">Month</th>
                    <th className="p-3 font-medium">Rep</th>
                    <th className="p-3 font-medium text-right">Split</th>
                    <th className="p-3 font-medium text-right">Earnings</th>
                    <th className="p-3 font-medium text-right">Payout</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions === undefined && (
                    <EmptyRow colSpan={5} label="Loading commissions…" />
                  )}
                  {commissions?.length === 0 && (
                    <EmptyRow colSpan={5} label="No commissions recorded." />
                  )}
                  {commissions?.map(c => (
                    <tr key={c._id} className="border-t">
                      <td className="p-3 font-medium">{c.month}</td>
                      <td className="p-3">{c.repName ?? "—"}</td>
                      <td className="p-3 text-right">
                        {c.splitPercentage !== undefined
                          ? `${c.splitPercentage}%`
                          : "—"}
                      </td>
                      <td className="p-3 text-right">
                        {money(c.totalEarnings)}
                      </td>
                      <td className="p-3 text-right font-semibold">
                        {money(c.netPayout)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === "devices" && (
        <div className="rounded-xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3 font-medium">Device</th>
                <th className="p-3 font-medium">Serial</th>
                <th className="p-3 font-medium">Terminal ID</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Merchant</th>
                <th className="p-3 font-medium">Added</th>
              </tr>
            </thead>
            <tbody>
              {devices === undefined && (
                <EmptyRow colSpan={6} label="Loading devices…" />
              )}
              {devices?.length === 0 && (
                <EmptyRow colSpan={6} label="No equipment on file." />
              )}
              {devices?.map(d => (
                <tr key={d._id} className="border-t">
                  <td className="p-3 capitalize flex items-center gap-2">
                    <Monitor className="size-4 text-muted-foreground" />
                    {d.deviceType?.replace(/_/g, " ") ?? "—"}
                  </td>
                  <td className="p-3 font-mono text-xs">
                    {d.serialNumber ?? "—"}
                  </td>
                  <td className="p-3 font-mono text-xs">
                    {d.terminalId ?? "—"}
                  </td>
                  <td className="p-3">
                    <StatusBadge status={d.deploymentStatus} />
                  </td>
                  <td className="p-3">{d.merchantName ?? "Unassigned"}</td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {shortDate(d.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "boarding" && (
        <div className="rounded-xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3 font-medium">Business</th>
                <th className="p-3 font-medium">Owner</th>
                <th className="p-3 font-medium">Industry</th>
                <th className="p-3 font-medium">Pricing</th>
                <th className="p-3 font-medium text-right">Est. volume</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {boarding === undefined && (
                <EmptyRow colSpan={7} label="Loading applications…" />
              )}
              {boarding?.length === 0 && (
                <EmptyRow colSpan={7} label="No boarding applications." />
              )}
              {boarding?.map(b => (
                <tr key={b._id} className="border-t">
                  <td className="p-3">
                    <div className="font-medium">
                      {b.legalBusinessName ?? "—"}
                    </div>
                    {b.dba && (
                      <div className="text-xs text-muted-foreground">
                        DBA {b.dba}
                      </div>
                    )}
                  </td>
                  <td className="p-3">
                    <Pii value={b.ownerName} />
                  </td>
                  <td className="p-3">{b.industry ?? "—"}</td>
                  <td className="p-3 capitalize">
                    {b.pricingModel?.replace(/_/g, " ") ?? "—"}
                  </td>
                  <td className="p-3 text-right">
                    {money(b.estimatedMonthlyVolume)}
                  </td>
                  <td className="p-3">
                    <StatusBadge status={b.status} />
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {shortDate(b.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {openMerchant && (
        <MerchantDrawer
          merchantId={openMerchant}
          onClose={() => setOpenMerchant(null)}
        />
      )}
    </div>
  );
}

export default CrmPage;
