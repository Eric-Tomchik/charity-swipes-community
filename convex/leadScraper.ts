import { action, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

// ===== Scrape Jobs table is tracked in-memory via leads metadata =====

// Google Places Text Search — uses Places API (New) endpoints
// Docs: https://developers.google.com/maps/documentation/places/web-service/text-search
async function searchGooglePlaces(
  apiKey: string,
  query: string,
  pageToken?: string,
): Promise<{
  results: Array<{
    businessName: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    website?: string;
    types?: string[];
    rating?: number;
    totalRatings?: number;
    placeId?: string;
    email?: string;
  }>;
  nextPageToken?: string;
}> {
  const url = "https://places.googleapis.com/v1/places:searchText";

  const body: any = {
    textQuery: query,
    pageSize: 20,
    languageCode: "en",
  };
  if (pageToken) {
    body.pageToken = pageToken;
  }

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.types,places.rating,places.userRatingCount,places.addressComponents,nextPageToken",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errBody = await resp.text();
    throw new Error(`Google Places API (New) error ${resp.status}: ${errBody}`);
  }

  const data = await resp.json();

  const results = (data.places || []).map((place: any) => {
    // Extract city and state from addressComponents
    let city = "";
    let state = "";
    if (place.addressComponents) {
      for (const comp of place.addressComponents) {
        if (comp.types?.includes("locality")) city = comp.longText || comp.shortText || "";
        if (comp.types?.includes("administrative_area_level_1")) state = comp.shortText || "";
      }
    }
    // Fallback: parse from formattedAddress
    if (!city || !state) {
      const parts = (place.formattedAddress || "").split(",").map((s: string) => s.trim());
      if (!city && parts.length >= 3) city = parts[parts.length - 3];
      if (!state) {
        const stateZip = parts.length >= 2 ? parts[parts.length - 2] : "";
        const m = stateZip.match(/^([A-Z]{2})\s/);
        if (m) state = m[1];
      }
    }

    return {
      businessName: place.displayName?.text || "",
      phone: place.nationalPhoneNumber || place.internationalPhoneNumber || undefined,
      address: place.formattedAddress,
      city,
      state,
      website: place.websiteUri || undefined,
      types: place.types,
      rating: place.rating,
      totalRatings: place.userRatingCount,
      placeId: place.id,
    };
  });

  return {
    results,
    nextPageToken: data.nextPageToken,
  };
}

// Get place details using Places API (New) — for phone/website enrichment
async function getPlaceDetails(
  apiKey: string,
  placeId: string,
): Promise<{ phone?: string; website?: string; ownerName?: string }> {
  const url = `https://places.googleapis.com/v1/places/${placeId}`;
  const resp = await fetch(url, {
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "nationalPhoneNumber,internationalPhoneNumber,websiteUri,displayName",
    },
  });
  if (!resp.ok) return {};
  const data = await resp.json();
  return {
    phone: data.nationalPhoneNumber || data.internationalPhoneNumber,
    website: data.websiteUri,
  };
}

// The main scraper action
export const runScrape = action({
  args: {
    industry: v.string(),
    state: v.string(),
    city: v.string(),
    keyword: v.optional(v.string()),
    maxResults: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<{ imported: number; skipped: number; errors: string[] }> => {
    // Get API key from Convex environment variables
    const apiKey = await ctx.runQuery(internal.communitySettings.internalGet, { key: "googlePlacesApiKey" }) ?? "";
    if (!apiKey) {
      throw new Error(
        "Google Places API key not configured. Go to Admin → Settings → Integrations to add your API key.",
      );
    }

    const maxResults = args.maxResults ?? 60; // Google gives 20 per page, max 3 pages = 60
    const errors: string[] = [];

    // Build search query
    const queryParts = [args.industry];
    if (args.keyword) queryParts.push(args.keyword);
    queryParts.push("in", args.city, args.state);
    const searchQuery = queryParts.join(" ");

    let allResults: any[] = [];
    let pageToken: string | undefined;
    let pages = 0;
    const maxPages = Math.ceil(maxResults / 20);

    // Fetch pages of results
    while (pages < maxPages) {
      try {
        if (pageToken && pages > 0) {
          // Google requires a short delay before using nextPageToken
          await new Promise((r) => setTimeout(r, 2000));
        }
        const page = await searchGooglePlaces(apiKey, searchQuery, pageToken);
        allResults = allResults.concat(page.results);
        pageToken = page.nextPageToken;
        pages++;

        if (!pageToken) break; // No more pages
        if (allResults.length >= maxResults) break;
      } catch (e: any) {
        errors.push(`Search page ${pages + 1}: ${e.message}`);
        break;
      }
    }

    // Places API (New) returns phone + website in text search.
    // Only enrich the few that are still missing details.
    let enrichCount = 0;
    const enrichLimit = 20;
    for (let i = 0; i < allResults.length && enrichCount < enrichLimit; i++) {
      if (allResults[i].placeId && (!allResults[i].phone || !allResults[i].website)) {
        try {
          const details = await getPlaceDetails(apiKey, allResults[i].placeId);
          if (details.phone) allResults[i].phone = details.phone;
          if (details.website) allResults[i].website = details.website;
          enrichCount++;
        } catch {
          // Skip enrichment errors silently
        }
      }
    }

    // Import results into leads table via internal mutation (batched)
    let imported = 0;
    let skipped = 0;

    const leadsToImport = allResults.slice(0, maxResults).map((r) => ({
      businessName: r.businessName,
      phone: r.phone || undefined,
      email: r.email || undefined,
      website: r.website || undefined,
      city: r.city || args.city,
      state: r.state || args.state,
      industry: args.industry,
      source: `Google Places (New) - "${searchQuery}"`,
    }));

    // Batch import in groups of 30
    for (let i = 0; i < leadsToImport.length; i += 30) {
      const batch = leadsToImport.slice(i, i + 30);
      try {
        const result = await ctx.runMutation(internal.leadScraper.importBatch, {
          leads: batch,
        });
        imported += result.imported;
        skipped += result.skipped;
      } catch (e: any) {
        errors.push(`Import batch ${Math.floor(i / 30) + 1}: ${e.message}`);
      }
    }

    return { imported, skipped, errors };
  },
});

// Internal mutation to import a batch of scraped leads
export const importBatch = internalMutation({
  args: {
    leads: v.array(
      v.object({
        businessName: v.string(),
        phone: v.optional(v.string()),
        email: v.optional(v.string()),
        website: v.optional(v.string()),
        city: v.optional(v.string()),
        state: v.optional(v.string()),
        industry: v.optional(v.string()),
        source: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, { leads }) => {
    // Get all existing for dedup
    const existing = await ctx.db.query("leads").collect();
    const existingNames = new Set(
      existing.map((e) => `${e.businessName.toLowerCase()}|${(e.phone || "").replace(/\D/g, "")}`),
    );

    let imported = 0;
    let skipped = 0;

    for (const lead of leads) {
      const key = `${lead.businessName.toLowerCase()}|${(lead.phone || "").replace(/\D/g, "")}`;
      if (existingNames.has(key)) {
        skipped++;
        continue;
      }
      existingNames.add(key);

      await ctx.db.insert("leads", {
        businessName: lead.businessName,
        phone: lead.phone,
        email: lead.email,
        website: lead.website,
        city: lead.city,
        state: lead.state,
        industry: lead.industry,
        source: lead.source,
        contactStatus: "unclaimed",
        createdAt: Date.now(),
      });
      imported++;
    }

    return { imported, skipped };
  },
});

// Free scraper using OpenStreetMap Overpass API + Nominatim (no API key)
export const runFreeScrape = action({
  args: {
    industry: v.string(),
    state: v.string(),
    city: v.string(),
    keyword: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ imported: number; skipped: number; errors: string[] }> => {
    const errors: string[] = [];
    const location = `${args.city}, ${args.state}`;

    let allResults: Array<{
      businessName: string;
      phone?: string;
      email?: string;
      website?: string;
      city?: string;
      state?: string;
      industry?: string;
    }> = [];

    // Map industry categories to OSM tags
    const industryToOSM: Record<string, string[]> = {
      // Food & Beverage
      "restaurant": ["amenity=restaurant"],
      "fast food": ["amenity=fast_food"],
      "café": ["amenity=cafe"],
      "coffee": ["amenity=cafe"],
      "bakery": ["shop=bakery"],
      "bar": ["amenity=bar", "amenity=pub"],
      "food truck": ["amenity=fast_food"],
      "pizzeria": ["amenity=restaurant"],
      "deli": ["amenity=fast_food", "shop=deli"],
      "ice cream": ["amenity=ice_cream"],
      "brewery": ["craft=brewery", "amenity=pub"],
      "grocery": ["shop=supermarket", "shop=convenience"],
      "convenience": ["shop=convenience"],
      "liquor": ["shop=alcohol"],
      // Retail
      "retail": ["shop=yes"],
      "clothing": ["shop=clothes"],
      "electronics": ["shop=electronics"],
      "furniture": ["shop=furniture"],
      "jewelry": ["shop=jewelry"],
      "florist": ["shop=florist"],
      "hardware": ["shop=hardware", "shop=doityourself"],
      "pet": ["shop=pet"],
      // Beauty & Personal Care
      "salon": ["shop=hairdresser"],
      "hair": ["shop=hairdresser"],
      "barber": ["shop=hairdresser"],
      "nail": ["shop=beauty"],
      "spa": ["leisure=spa", "shop=beauty"],
      "tattoo": ["shop=tattoo"],
      // Health
      "medical": ["amenity=clinic", "amenity=doctors"],
      "dental": ["amenity=dentist"],
      "pharmacy": ["amenity=pharmacy"],
      "veterinary": ["amenity=veterinary"],
      "gym": ["leisure=fitness_centre"],
      "fitness": ["leisure=fitness_centre"],
      "chiropractic": ["amenity=clinic"],
      "optometry": ["shop=optician"],
      // Automotive
      "auto repair": ["shop=car_repair"],
      "car wash": ["amenity=car_wash"],
      "car dealer": ["shop=car"],
      "tire": ["shop=tyres"],
      "auto parts": ["shop=car_parts"],
      // Home Services
      "laundry": ["shop=laundry"],
      "dry clean": ["shop=dry_cleaning"],
      // Professional
      "accounting": ["office=accountant"],
      "law": ["office=lawyer"],
      "insurance": ["office=insurance"],
      "real estate": ["office=estate_agent"],
      // Hospitality
      "hotel": ["tourism=hotel"],
      "lodging": ["tourism=hotel", "tourism=motel"],
    };

    // Find matching OSM tags for this industry
    const industryLower = args.industry.toLowerCase();
    let osmTags: string[] = [];
    for (const [key, tags] of Object.entries(industryToOSM)) {
      if (industryLower.includes(key)) {
        osmTags = tags;
        break;
      }
    }

    // Default: search for shops and amenities broadly
    if (osmTags.length === 0) {
      osmTags = ["shop=yes", "amenity=restaurant", "amenity=cafe", "office=yes"];
    }

    try {
      // Use Overpass area-based query (more accurate than radius - searches within city boundaries)
      // Sanitize city name for Overpass area lookup
      const cityClean = args.city.replace(/[^a-zA-Z0-9 .'-]/g, "");

      // Add keyword name filter if provided
      const nameFilter = args.keyword
        ? `["name"~"${args.keyword.replace(/[^a-zA-Z0-9 ]/g, "")}", i]`
        : "";

      // Build area-based Overpass query (like: area["name"="Miami"]->searchArea)
      const overpassQuery = `[out:json][timeout:60];
area["name"="${cityClean}"]->.searchArea;
(
  ${osmTags
    .map((tag) => {
      const [k, v] = tag.split("=");
      const vFilter = v === "yes" ? `["${k}"]` : `["${k}"="${v}"]`;
      return `node${vFilter}["name"]${nameFilter}(area.searchArea);\nway${vFilter}["name"]${nameFilter}(area.searchArea);`;
    })
    .join("\n")}
);
out center 500;`;

      const overpassResp = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: `data=${encodeURIComponent(overpassQuery)}`,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      if (!overpassResp.ok) {
        throw new Error(`Overpass API error: HTTP ${overpassResp.status}`);
      }

      const overpassData = await overpassResp.json();
      const elements = overpassData.elements || [];

      for (const el of elements) {
        const tags = el.tags || {};
        if (!tags.name) continue;

        allResults.push({
          businessName: tags.name,
          phone: tags.phone || tags["contact:phone"] || tags["phone:main"] || undefined,
          email: tags.email || tags["contact:email"] || undefined,
          website: tags.website || tags["contact:website"] || undefined,
          city: tags["addr:city"] || args.city,
          state: tags["addr:state"] || args.state,
          industry: args.industry,
        });
      }
    } catch (e: any) {
      errors.push(`Search error: ${e.message}`);
    }

    // Import results
    let imported = 0;
    let skipped = 0;

    if (allResults.length > 0) {
      const leadsToImport = allResults.map((r) => ({
        businessName: r.businessName,
        phone: r.phone,
        email: r.email,
        website: r.website,
        city: r.city,
        state: r.state,
        industry: r.industry,
        source: `Web Search (OSM) - "${args.industry}" in ${location}`,
      }));

      for (let i = 0; i < leadsToImport.length; i += 30) {
        const batch = leadsToImport.slice(i, i + 30);
        try {
          const result = await ctx.runMutation(internal.leadScraper.importBatch, {
            leads: batch,
          });
          imported += result.imported;
          skipped += result.skipped;
        } catch (e: any) {
          errors.push(`Import: ${e.message}`);
        }
      }
    }

    if (allResults.length === 0 && errors.length === 0) {
      errors.push(
        "No results found in public map data. Try a larger city, broader industry, or use Google Places search for more comprehensive results.",
      );
    }

    return { imported, skipped, errors };
  },
});

// ===== Apollo.io Integration =====

// Enrich a single lead with Apollo People/Org data
export const enrichWithApollo = action({
  args: { leadId: v.id("leads") },
  handler: async (ctx, args): Promise<{ success: boolean; message: string }> => {
    const apiKey = await ctx.runQuery(internal.communitySettings.internalGet, { key: "apolloApiKey" }) ?? "";
    if (!apiKey) {
      return { success: false, message: "Apollo API key not configured. Go to Admin → Settings to add it." };
    }

    // Get the lead
    const lead = await ctx.runQuery(internal.leadScraper.getLead, { leadId: args.leadId });
    if (!lead) {
      return { success: false, message: "Lead not found." };
    }

    let enrichedData: Record<string, any> = {};

    // Step 1: Try Organization Enrichment via domain (if we have a website)
    if (lead.website) {
      try {
        const domain = lead.website.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];

        const orgResp = await fetch(`https://api.apollo.io/api/v1/organizations/enrich?domain=${encodeURIComponent(domain)}`, {
          method: "GET",
          headers: {
            "Cache-Control": "no-cache",
            "Content-Type": "application/json",
            "x-api-key": apiKey,
          },
        });

        if (orgResp.ok) {
          const orgData = await orgResp.json();
          const org = orgData.organization;
          if (org) {
            if (org.estimated_num_employees) enrichedData.companySize = String(org.estimated_num_employees);
            if (org.annual_revenue_printed) enrichedData.annualRevenue = org.annual_revenue_printed;
            if (org.current_technologies && org.current_technologies.length > 0) {
              enrichedData.technologies = org.current_technologies.slice(0, 10).map((t: any) => t.name || t).join(", ");
            }
            if (org.phone) enrichedData.phone = org.phone;
            if (org.primary_domain) enrichedData.website = `https://${org.primary_domain}`;
            if (org.industry) enrichedData.industry = org.industry;
          }
        }
      } catch (e: any) {
        // Continue even if org enrichment fails
      }
    }

    // Step 2: Try People Enrichment (find owner/decision maker)
    try {
      const searchBody: Record<string, any> = {};
      
      // Search by domain if available
      if (lead.website) {
        const domain = lead.website.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
        searchBody.q_organization_domains = domain;
        searchBody.person_seniorities = ["owner", "founder", "c_suite", "partner", "vp", "director"];
        searchBody.per_page = 1;
        searchBody.page = 1;
      } else if (lead.email) {
        // Enrich by email directly
        const peopleResp = await fetch(`https://api.apollo.io/api/v1/people/match`, {
          method: "POST",
          headers: {
            "Cache-Control": "no-cache",
            "Content-Type": "application/json",
            "x-api-key": apiKey,
          },
          body: JSON.stringify({
            email: lead.email,
            reveal_personal_emails: true,
            reveal_phone_number: true,
          }),
        });

        if (peopleResp.ok) {
          const personData = await peopleResp.json();
          const person = personData.person;
          if (person) {
            if (person.name) enrichedData.ownerName = person.name;
            if (person.title) enrichedData.ownerTitle = person.title;
            if (person.linkedin_url) enrichedData.ownerLinkedin = person.linkedin_url;
            if (person.email) enrichedData.ownerEmail = person.email;
            if (person.phone_numbers?.length > 0) {
              enrichedData.ownerPhone = person.phone_numbers[0].sanitized_number || person.phone_numbers[0].raw_number;
            }
            if (person.organization?.name) enrichedData.businessName = person.organization.name;
          }
        }
      }

      // If we have a domain, search for decision maker
      if (searchBody.q_organization_domains) {
        const searchResp = await fetch("https://api.apollo.io/api/v1/mixed_people/search", {
          method: "POST",
          headers: {
            "Cache-Control": "no-cache",
            "Content-Type": "application/json",
            "x-api-key": apiKey,
          },
          body: JSON.stringify(searchBody),
        });

        if (searchResp.ok) {
          const searchData = await searchResp.json();
          const people = searchData.people || [];
          if (people.length > 0) {
            const person = people[0];
            if (person.name) enrichedData.ownerName = person.name;
            if (person.title) enrichedData.ownerTitle = person.title;
            if (person.linkedin_url) enrichedData.ownerLinkedin = person.linkedin_url;
            if (person.email) enrichedData.ownerEmail = person.email;
            if (person.phone_numbers?.length > 0) {
              enrichedData.ownerPhone = person.phone_numbers[0].sanitized_number || person.phone_numbers[0].raw_number;
            }
          }
        }
      }
    } catch (e: any) {
      // Continue even if people search fails
    }

    // Step 3: Save enriched data to lead
    if (Object.keys(enrichedData).length > 0) {
      enrichedData.apolloEnriched = true;
      enrichedData.apolloEnrichedAt = Date.now();
      await ctx.runMutation(internal.leadScraper.updateLeadEnrichment, {
        leadId: args.leadId,
        data: enrichedData,
      });
      const fields = Object.keys(enrichedData).filter(k => k !== "apolloEnriched" && k !== "apolloEnrichedAt");
      return { success: true, message: `Enriched with ${fields.length} fields: ${fields.join(", ")}` };
    }

    return { success: false, message: "No enrichment data found. The business may not be in Apollo's database." };
  },
});

// Apollo Organization Search — search Apollo's database directly
export const searchApollo = action({
  args: {
    industry: v.optional(v.string()),
    location: v.optional(v.string()),
    keyword: v.optional(v.string()),
    perPage: v.optional(v.number()),
    page: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<{ imported: number; skipped: number; total: number; errors: string[] }> => {
    const apiKey = await ctx.runQuery(internal.communitySettings.internalGet, { key: "apolloApiKey" }) ?? "";
    if (!apiKey) {
      return { imported: 0, skipped: 0, total: 0, errors: ["Apollo API key not configured. Go to Admin → Settings to add it."] };
    }

    const errors: string[] = [];
    const perPage = args.perPage ?? 25;
    const page = args.page ?? 1;

    const searchBody: Record<string, any> = {
      page,
      per_page: perPage,
    };

    if (args.location) {
      searchBody.organization_locations = [args.location];
    }
    if (args.keyword) {
      searchBody.q_organization_keyword_tags = [args.keyword];
    }
    if (args.industry) {
      searchBody.q_organization_keyword_tags = [
        ...(searchBody.q_organization_keyword_tags || []),
        args.industry,
      ];
    }

    try {
      const resp = await fetch("https://api.apollo.io/api/v1/mixed_companies/search", {
        method: "POST",
        headers: {
          "Cache-Control": "no-cache",
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify(searchBody),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        return { imported: 0, skipped: 0, total: 0, errors: [`Apollo API error: ${resp.status} - ${errText}`] };
      }

      const data = await resp.json();
      const orgs = data.organizations || data.accounts || [];
      const total = data.pagination?.total_entries || orgs.length;

      if (orgs.length === 0) {
        return { imported: 0, skipped: 0, total: 0, errors: ["No organizations found matching your criteria."] };
      }

      // Map to lead format
      const leadsToImport = orgs.map((org: any) => ({
        businessName: org.name || "Unknown",
        phone: org.phone || org.sanitized_phone || undefined,
        email: org.primary_email || undefined,
        website: org.primary_domain ? `https://${org.primary_domain}` : org.website_url || undefined,
        city: org.city || undefined,
        state: org.state || undefined,
        industry: org.industry || args.industry || undefined,
        companySize: org.estimated_num_employees ? String(org.estimated_num_employees) : undefined,
        source: `Apollo Search - "${[args.industry, args.location, args.keyword].filter(Boolean).join(", ")}"`,
      }));

      // Import in batches
      let imported = 0;
      let skipped = 0;
      for (let i = 0; i < leadsToImport.length; i += 30) {
        const batch = leadsToImport.slice(i, i + 30);
        try {
          const result = await ctx.runMutation(internal.leadScraper.importBatch, { leads: batch });
          imported += result.imported;
          skipped += result.skipped;
        } catch (e: any) {
          errors.push(`Import: ${e.message}`);
        }
      }

      return { imported, skipped, total, errors };
    } catch (e: any) {
      return { imported: 0, skipped: 0, total: 0, errors: [`Apollo search error: ${e.message}`] };
    }
  },
});

// Internal: get a lead by ID (for enrichment)
export const getLead = internalQuery({
  args: { leadId: v.id("leads") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.leadId);
  },
});

// Internal: update a lead with enrichment data
export const updateLeadEnrichment = internalMutation({
  args: {
    leadId: v.id("leads"),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.leadId, args.data);
  },
});
