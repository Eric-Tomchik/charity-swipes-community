import { useAction, useQuery } from "convex/react";
import {
  AlertCircle,
  CheckCircle2,
  Globe,
  Loader2,
  MapPin,
  Radar,
  Search,
  Sparkles,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { INDUSTRIES } from "@/data/industries";
import { STATE_LIST, getCitiesForState } from "@/data/locations";

export function LeadFinderPage() {
  const profile = useQuery(api.userProfiles.get);
  const stats = useQuery(api.leads.getStats);
  const runScrape = useAction(api.leadScraper.runScrape);
  const runFreeScrape = useAction(api.leadScraper.runFreeScrape);
  const searchApollo = useAction(api.leadScraper.searchApollo);

  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [industry, setIndustry] = useState("");
  const [keyword, setKeyword] = useState("");
  const [scraping, setScraping] = useState(false);
  const [result, setResult] = useState<{
    imported: number;
    skipped: number;
    errors: string[];
  } | null>(null);
  const [scrapeHistory, setScrapeHistory] = useState<
    Array<{ query: string; imported: number; time: string }>
  >([]);

  const cities = state ? getCitiesForState(state) : [];
  const isAdmin = profile?.role === "admin";
  const isRep = profile?.role === "sales_rep" || isAdmin;

  const handleScrape = async (useGoogle: boolean) => {
    if (!state || !city || !industry) {
      toast.error("Please select a state, city, and industry");
      return;
    }

    setScraping(true);
    setResult(null);

    try {
      const r = useGoogle
        ? await runScrape({
            industry,
            state,
            city,
            keyword: keyword || undefined,
          })
        : await runFreeScrape({
            industry,
            state,
            city,
            keyword: keyword || undefined,
          });

      setResult(r);
      setScrapeHistory((prev) => [
        {
          query: `${industry} in ${city}, ${state}${keyword ? ` (${keyword})` : ""}`,
          imported: r.imported,
          time: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);

      if (r.imported > 0) {
        toast.success(`Found and imported ${r.imported} new leads!`);
      } else if (r.skipped > 0) {
        toast.info(`All ${r.skipped} results already in database`);
      } else {
        toast.warning("No new leads found — try different search terms");
      }
    } catch (e: any) {
      const msg = e.message || "Scrape failed";
      if (msg.includes("API key")) {
        toast.error("Google Places API key not set. Use Web Search or add API key in admin settings.");
      } else {
        toast.error(msg);
      }
      setResult({ imported: 0, skipped: 0, errors: [msg] });
    }

    setScraping(false);
  };

  const handleApolloSearch = async () => {
    if (!state && !industry && !keyword) {
      toast.error("Please select at least a state, industry, or keyword");
      return;
    }
    setScraping(true);
    setResult(null);
    try {
      const location = city ? `${city}, ${state}` : state;
      const r = await searchApollo({
        industry: industry || undefined,
        location: location || undefined,
        keyword: keyword || undefined,
        perPage: 25,
      });
      setResult({ imported: r.imported, skipped: r.skipped, errors: r.errors });
      setScrapeHistory((prev) => [
        {
          query: `Apollo: ${[industry, location, keyword].filter(Boolean).join(", ")}`,
          imported: r.imported,
          time: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);
      if (r.imported > 0) {
        toast.success(`Apollo found ${r.total} orgs, imported ${r.imported} new leads!`);
      } else if (r.total > 0) {
        toast.info(`All ${r.total} Apollo results already in database`);
      } else {
        toast.warning("No organizations found — try different criteria");
      }
    } catch (e: any) {
      toast.error(e.message || "Apollo search failed");
      setResult({ imported: 0, skipped: 0, errors: [e.message] });
    }
    setScraping(false);
  };

  if (!isRep) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <Radar className="size-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Sales Rep access required</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Radar className="size-6 text-pink-600" /> Lead Finder
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Search for businesses by industry, location, and keywords. Results are
          automatically imported into the Lead Database with duplicate detection.
        </p>
      </div>

      {/* Search Form */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Search className="size-4" /> Search Parameters
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          {/* State */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              State <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full border rounded-lg px-3 py-2.5 text-sm bg-background"
              value={state}
              onChange={(e) => {
                setState(e.target.value);
                setCity("");
              }}
            >
              <option value="">Select a state...</option>
              {STATE_LIST.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* City */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              City <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full border rounded-lg px-3 py-2.5 text-sm bg-background"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={!state}
            >
              <option value="">{state ? "Select a city..." : "Select a state first"}</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Industry */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Industry <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full border rounded-lg px-3 py-2.5 text-sm bg-background"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            >
              <option value="">Select an industry...</option>
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </div>

          {/* Keyword */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Keyword <span className="text-muted-foreground text-xs">(optional)</span>
            </label>
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder='e.g. "family owned", "downtown", "24 hour"'
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            onClick={() => handleScrape(true)}
            disabled={scraping || !state || !city || !industry}
            className="flex-1"
          >
            {scraping ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Globe className="size-4" />
            )}
            {scraping ? "Searching..." : "Search with Google Places"}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleScrape(false)}
            disabled={scraping || !state || !city || !industry}
            className="flex-1"
          >
            {scraping ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <MapPin className="size-4" />
            )}
            {scraping ? "Searching..." : "Free Map Search (No API Key)"}
          </Button>
          <Button
            onClick={handleApolloSearch}
            disabled={scraping || (!state && !industry && !keyword)}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
          >
            {scraping ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            {scraping ? "Searching..." : "Apollo Search (Enriched Data)"}
          </Button>
        </div>

        {scraping && (
          <div className="rounded-lg bg-blue-500/10 p-4 flex items-center gap-3">
            <Loader2 className="size-5 animate-spin text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                Searching for businesses...
              </p>
              <p className="text-xs text-blue-600/70 dark:text-blue-400/70">
                Scraping {industry} businesses in {city}, {state}. This may take
                30–60 seconds.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {result && (
        <div
          className={`rounded-xl border p-6 space-y-3 ${
            result.imported > 0
              ? "bg-emerald-500/5 border-emerald-500/30"
              : result.errors.length > 0
                ? "bg-red-500/5 border-red-500/30"
                : "bg-yellow-500/5 border-yellow-500/30"
          }`}
        >
          <div className="flex items-center gap-3">
            {result.imported > 0 ? (
              <CheckCircle2 className="size-8 text-emerald-600" />
            ) : result.errors.length > 0 ? (
              <AlertCircle className="size-8 text-red-600" />
            ) : (
              <AlertCircle className="size-8 text-yellow-600" />
            )}
            <div>
              <h3 className="font-semibold text-lg">
                {result.imported > 0
                  ? `${result.imported} New Leads Imported!`
                  : result.errors.length > 0
                    ? "Search Issues"
                    : "No New Leads Found"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {result.imported} imported · {result.skipped} duplicates skipped
              </p>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="space-y-1">
              {result.errors.map((err, i) => (
                <p key={i} className="text-sm text-red-600 dark:text-red-400">
                  ⚠ {err}
                </p>
              ))}
            </div>
          )}

          {result.imported > 0 && (
            <div className="pt-2">
              <a
                href="/leads"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
              >
                View in Lead Database →
              </a>
            </div>
          )}
        </div>
      )}

      {/* Tips & Info */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Zap className="size-4 text-pink-600" /> Tips for Better Results
        </h3>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <p className="font-medium">🔍 Search Strategies</p>
            <ul className="text-muted-foreground space-y-1 text-xs">
              <li>• Start with major cities in your target state</li>
              <li>• Use specific industries (e.g. "Pizzeria" vs "Restaurant")</li>
              <li>• Add keywords like "cash only" or "local" for refinement</li>
              <li>• Run multiple searches across different cities</li>
            </ul>
          </div>
          <div className="space-y-2">
            <p className="font-medium">📊 Data Sources</p>
            <ul className="text-muted-foreground space-y-1 text-xs">
              <li>
                • <strong>Google Places</strong> — Most comprehensive, includes
                phone & website. Requires API key in admin settings.
              </li>
              <li>
                • <strong>Free Map Search</strong> — No API key needed. Uses
                OpenStreetMap public data. Best for restaurants, retail, salons,
                and businesses with physical locations.
              </li>
              <li>• All results auto-deduplicate against existing leads</li>
              <li>• Leads start as "Unclaimed" — claim them from the Lead Database</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Current Session History */}
      {scrapeHistory.length > 0 && (
        <div className="rounded-xl border bg-card p-6 space-y-3">
          <h3 className="font-semibold">This Session's Searches</h3>
          <div className="space-y-2">
            {scrapeHistory.map((h, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-sm border-b last:border-0 pb-2 last:pb-0"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="size-3.5 text-muted-foreground" />
                  <span>{h.query}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className={
                      h.imported > 0
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                        : "bg-muted text-muted-foreground"
                    }
                  >
                    {h.imported} imported
                  </Badge>
                  <span className="text-xs text-muted-foreground">{h.time}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="text-sm text-muted-foreground pt-1">
            Total leads in database: <strong>{stats?.total ?? 0}</strong>
          </div>
        </div>
      )}

      {/* API Key Notice */}
      <div className="rounded-lg bg-muted/50 p-4 text-xs text-muted-foreground">
        <p>
          <strong>Google Places API:</strong> For the best results with phone numbers
          and websites, add a Google Places API key in Admin → Settings → Integrations.
          Get one at{" "}
          <a
            href="https://console.cloud.google.com/apis/library/places-backend.googleapis.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-pink-600 hover:underline"
          >
            Google Cloud Console
          </a>
          . The "Web Search" option works without any API key.
        </p>
      </div>
    </div>
  );
}
