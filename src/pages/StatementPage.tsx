import { useMutation, useQuery } from "convex/react";
import {
  CheckCircle2,
  Clock,
  FileSearch,
  Heart,
  Loader2,
  TrendingDown,
  Upload,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Pending Review", color: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400", icon: Clock },
  reviewing: { label: "Under Review", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400", icon: FileSearch },
  analyzed: { label: "Analysis Ready", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "bg-red-500/10 text-red-700 dark:text-red-400", icon: X },
};

function fmt(n: number | undefined): string {
  if (n === undefined || n === null) return "—";
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPct(n: number | undefined): string {
  if (n === undefined || n === null) return "—";
  return n.toFixed(2) + "%";
}

export function StatementPage() {
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const submitStatement = useMutation(api.statements.submit);
  const myStatements = useQuery(api.statements.myStatements) ?? [];
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selected: File) => {
    const maxSize = 10 * 1024 * 1024;
    const validTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (!validTypes.includes(selected.type)) {
      toast.error("Please upload a PDF, JPG, or PNG file");
      return;
    }
    if (selected.size > maxSize) {
      toast.error("File must be under 10 MB");
      return;
    }
    setFile(selected);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!result.ok) throw new Error("Upload failed");
      const { storageId } = await result.json();

      await submitStatement({
        fileStorageId: storageId,
        fileName: file.name,
        fileType: file.type,
      });

      setFile(null);
      toast.success("Statement uploaded! Our team will review and get back to you with an analysis.");
    } catch (e: any) {
      toast.error(e.message || "Upload failed — please try again");
    }
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileSelect(dropped);
  };

  const analyzed = myStatements.filter((s) => s.status === "analyzed");
  const pending = myStatements.filter((s) => s.status !== "analyzed" && s.status !== "rejected");

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileSearch className="size-6 text-pink-600" /> Statement Analyzer
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Upload your processing statement and see how much you'd save with the Cash Discount Program
        </p>
      </div>

      {/* Upload area */}
      <div
        className={`rounded-xl border-2 border-dashed bg-card p-8 text-center space-y-4 transition-colors ${
          dragOver
            ? "border-pink-500 bg-pink-500/5"
            : "border-border hover:border-pink-400"
        }`}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
      >
        <div className="mx-auto size-16 rounded-2xl bg-pink-500/10 flex items-center justify-center">
          <Upload className="size-8 text-pink-500" />
        </div>
        <h2 className="text-lg font-semibold">Upload a Processing Statement</h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Drag and drop your merchant processing statement here, or click to browse.
          We'll analyze your rates and compare them to Charity Swipes pricing.
        </p>

        {file && (
          <div className="inline-flex items-center gap-2 bg-muted rounded-lg px-4 py-2 text-sm">
            <span className="font-medium">{file.name}</span>
            <span className="text-muted-foreground">
              ({(file.size / 1024 / 1024).toFixed(1)} MB)
            </span>
            <button onClick={() => setFile(null)} className="ml-1 p-0.5 hover:bg-background rounded">
              <X className="size-4" />
            </button>
          </div>
        )}

        <div className="flex gap-2 justify-center">
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFileSelect(f);
            }}
          />
          {!file && (
            <Button onClick={() => fileRef.current?.click()}>
              <Upload className="size-4" /> Choose File
            </Button>
          )}
          {file && (
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              {uploading ? "Uploading..." : "Upload & Analyze"}
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">PDF, JPG, or PNG · Max 10 MB</p>
      </div>

      {/* Pending submissions */}
      {pending.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Pending Statements
          </h3>
          {pending.map((s) => {
            const st = STATUS_MAP[s.status] ?? STATUS_MAP.pending;
            const Icon = st.icon;
            return (
              <div key={s._id} className="rounded-xl border bg-card p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-lg bg-muted flex items-center justify-center">
                    <Icon className="size-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{s.fileName}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(s.createdAt).toLocaleDateString()} · {s.businessName || s.userName}
                    </div>
                  </div>
                </div>
                <Badge className={st.color}>{st.label}</Badge>
              </div>
            );
          })}
        </div>
      )}

      {/* Analyzed results */}
      {analyzed.map((s) => (
        <div key={s._id} className="rounded-xl border bg-card overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500/10 to-pink-500/10 p-4 border-b flex items-center justify-between">
            <div>
              <h3 className="font-bold flex items-center gap-2">
                <CheckCircle2 className="size-5 text-emerald-500" /> Analysis Complete
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {s.fileName} · {s.businessName || s.userName} · Analyzed {s.reviewedAt ? new Date(s.reviewedAt).toLocaleDateString() : ""}
              </p>
            </div>
            {s.csSavingsMonthly && s.csSavingsMonthly > 0 && (
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Potential Savings</div>
                <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {fmt(s.csSavingsAnnual)}<span className="text-sm font-normal">/yr</span>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 space-y-4">
            {/* Side-by-side comparison */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Current processor */}
              <div className="rounded-lg border bg-red-500/5 dark:bg-red-500/10 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-red-700 dark:text-red-400">
                  <TrendingDown className="size-4" />
                  Current: {s.currentProcessor || "Your Processor"}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground">Monthly Volume</div>
                    <div className="font-semibold">{fmt(s.monthlyVolume)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Transactions</div>
                    <div className="font-semibold">{s.monthlyTransactions?.toLocaleString() ?? "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Effective Rate</div>
                    <div className="font-semibold text-red-600 dark:text-red-400">{fmtPct(s.effectiveRate)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Total Monthly Fees</div>
                    <div className="font-semibold text-red-600 dark:text-red-400">{fmt(s.monthlyFees)}</div>
                  </div>
                </div>
                {/* Fee breakdown */}
                {(s.interchangeFees || s.processorMarkup || s.pciFee) && (
                  <div className="pt-2 border-t border-red-200 dark:border-red-800 space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">Fee Breakdown</div>
                    {s.interchangeFees ? <FeeRow label="Interchange Fees" value={s.interchangeFees} /> : null}
                    {s.assessmentFees ? <FeeRow label="Assessment Fees" value={s.assessmentFees} /> : null}
                    {s.processorMarkup ? <FeeRow label="Processor Markup" value={s.processorMarkup} /> : null}
                    {s.monthlyServiceFee ? <FeeRow label="Monthly Service Fee" value={s.monthlyServiceFee} /> : null}
                    {s.pciFee ? <FeeRow label="PCI Compliance Fee" value={s.pciFee} /> : null}
                    {s.statementFee ? <FeeRow label="Statement Fee" value={s.statementFee} /> : null}
                    {s.batchFee ? <FeeRow label="Batch Fee" value={s.batchFee} /> : null}
                    {s.otherFees ? <FeeRow label="Other Fees" value={s.otherFees} /> : null}
                  </div>
                )}
              </div>

              {/* Charity Swipes comparison */}
              <div className="rounded-lg border bg-emerald-500/5 dark:bg-emerald-500/10 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                  <Heart className="size-4" />
                  Charity Swipes Cash Discount Program
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground">Monthly Volume</div>
                    <div className="font-semibold">{fmt(s.monthlyVolume)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">CC Transaction Fees</div>
                    <div className="font-semibold text-emerald-600 dark:text-emerald-400">$0.00</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Effective Rate</div>
                    <div className="font-semibold text-emerald-600 dark:text-emerald-400">{fmtPct(s.csEffectiveRate)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Total Monthly Fees</div>
                    <div className="font-semibold text-emerald-600 dark:text-emerald-400">{fmt(s.csMonthlyFees)}</div>
                  </div>
                </div>
                {/* Savings highlight */}
                <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Monthly Savings</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{fmt(s.csSavingsMonthly)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Annual Savings</span>
                    <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">{fmt(s.csSavingsAnnual)}</span>
                  </div>
                  {s.csDonationMonthly && s.csDonationMonthly > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1"><Heart className="size-3 text-pink-500" /> Monthly Charity Donation</span>
                      <span className="font-bold text-pink-600 dark:text-pink-400">{fmt(s.csDonationMonthly)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Admin notes */}
            {s.adminNotes && (
              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                <span className="font-medium">Notes: </span>
                <span className="text-muted-foreground">{s.adminNotes}</span>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* How it works */}
      {myStatements.length === 0 && (
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h3 className="font-semibold">How It Works</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <div className="size-8 rounded-lg bg-pink-500/10 text-pink-600 font-bold flex items-center justify-center">1</div>
              <div className="font-medium">Upload</div>
              <p className="text-muted-foreground">Upload your current processor's monthly statement</p>
            </div>
            <div className="space-y-2">
              <div className="size-8 rounded-lg bg-pink-500/10 text-pink-600 font-bold flex items-center justify-center">2</div>
              <div className="font-medium">Analyze</div>
              <p className="text-muted-foreground">We extract your rates, fees, and volume details</p>
            </div>
            <div className="space-y-2">
              <div className="size-8 rounded-lg bg-pink-500/10 text-pink-600 font-bold flex items-center justify-center">3</div>
              <div className="font-medium">Compare</div>
              <p className="text-muted-foreground">See how much you'd save — and how much goes to charity</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FeeRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span>{fmt(value)}</span>
    </div>
  );
}
