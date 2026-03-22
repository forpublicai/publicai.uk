import { tool } from "ai";
import { XMLParser } from "fast-xml-parser";
import { z } from "zod";

const xmlParser = new XMLParser({ ignoreAttributes: false });

// ─── BBC News Search ──────────────────────────────────────────────────────────

export const bbcNewsSearch = tool({
  description:
    "Search BBC News for current articles on a topic. Returns titles, summaries, publication dates, and URLs from the BBC RSS feeds.",
  parameters: z.object({
    query: z.string().describe("The topic or search terms to look up on BBC News"),
  }),
  execute: async ({ query }) => {
    try {
      // BBC News doesn't have a search API — we fetch the top news feed and
      // filter by relevance. For specific topics we try the topic feeds too.
      const feedUrl = `https://feeds.bbci.co.uk/news/rss.xml`;
      const res = await fetch(feedUrl, {
        headers: { "User-Agent": "PublicAI-Demo/1.0 (publicai.uk)" },
        next: { revalidate: 300 },
      });
      if (!res.ok) throw new Error(`BBC RSS returned ${res.status}`);
      const xml = await res.text();
      const parsed = xmlParser.parse(xml);
      const items: Array<{ title: string; link: string; description: string; pubDate: string }> =
        parsed?.rss?.channel?.item ?? [];

      const queryLower = query.toLowerCase();
      const keywords = queryLower.split(/\s+/).filter((w) => w.length > 3);

      const scored = items.map((item) => {
        const haystack = `${item.title} ${item.description}`.toLowerCase();
        const score = keywords.reduce((s, kw) => s + (haystack.includes(kw) ? 1 : 0), 0);
        return { ...item, score };
      });

      const results = scored
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(({ title, link, description, pubDate }) => ({
          title,
          url: link,
          summary: description?.slice(0, 200) ?? "",
          published: pubDate,
          source: "BBC News",
        }));

      return {
        query,
        results,
        source: "BBC News RSS (feeds.bbci.co.uk)",
        resultCount: results.length,
      };
    } catch (err) {
      return {
        query,
        results: [],
        source: "BBC News RSS",
        resultCount: 0,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  },
});

// ─── GOV.UK Guidance Search ──────────────────────────────────────────────────

export const govGuidanceSearch = tool({
  description:
    "Search GOV.UK for official government guidance, policies, and public information. Returns titles, descriptions, and URLs from the GOV.UK search API.",
  parameters: z.object({
    query: z.string().describe("The topic to search for on GOV.UK"),
  }),
  execute: async ({ query }) => {
    try {
      const url = `https://www.gov.uk/api/search.json?q=${encodeURIComponent(query)}&count=5`;
      const res = await fetch(url, {
        headers: { "User-Agent": "PublicAI-Demo/1.0 (publicai.uk)" },
        next: { revalidate: 300 },
      });
      if (!res.ok) throw new Error(`GOV.UK API returned ${res.status}`);
      const data = await res.json();

      const results = (data.results ?? []).slice(0, 5).map(
        (r: { title?: string; link?: string; description_with_highlighting?: string; public_timestamp?: string }) => ({
          title: r.title ?? "",
          url: `https://www.gov.uk${r.link ?? ""}`,
          summary: r.description_with_highlighting?.replace(/<[^>]+>/g, "").slice(0, 200) ?? "",
          published: r.public_timestamp ?? "",
          source: "GOV.UK",
        })
      );

      return {
        query,
        results,
        source: "GOV.UK Search API (gov.uk/api/search.json)",
        resultCount: results.length,
      };
    } catch (err) {
      return {
        query,
        results: [],
        source: "GOV.UK Search API",
        resultCount: 0,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  },
});

// ─── Legislation Search ──────────────────────────────────────────────────────

export const legislationSearch = tool({
  description:
    "Search legislation.gov.uk for UK Acts of Parliament, statutory instruments, and regulations. Use for questions about legal rights, statutes, and legislation.",
  parameters: z.object({
    query: z.string().describe("The legal topic or statute to search for"),
  }),
  execute: async ({ query }) => {
    try {
      const url = `https://www.legislation.gov.uk/search?text=${encodeURIComponent(query)}&format=json&limit=5`;
      const res = await fetch(url, {
        headers: {
          "User-Agent": "PublicAI-Demo/1.0 (publicai.uk)",
          Accept: "application/json",
        },
        next: { revalidate: 3600 },
      });

      if (!res.ok) throw new Error(`legislation.gov.uk returned ${res.status}`);
      const data = await res.json();

      // legislation.gov.uk returns feed items in various formats; normalise them
      const feed = data?.feed?.entry ?? data?.results ?? [];
      const results = feed.slice(0, 5).map(
        (r: {
          title?: string | { "#text"?: string };
          link?: string | { "@_href"?: string };
          summary?: string | { "#text"?: string };
          updated?: string;
        }) => {
          const title =
            typeof r.title === "string" ? r.title : r.title?.["#text"] ?? "";
          const link =
            typeof r.link === "string" ? r.link : r.link?.["@_href"] ?? "";
          const summary =
            typeof r.summary === "string"
              ? r.summary
              : r.summary?.["#text"] ?? "";
          return {
            title: title.slice(0, 120),
            url: link,
            summary: summary.replace(/<[^>]+>/g, "").slice(0, 200),
            published: r.updated ?? "",
            source: "legislation.gov.uk",
          };
        }
      );

      return {
        query,
        results,
        source: "legislation.gov.uk API",
        resultCount: results.length,
      };
    } catch (err) {
      return {
        query,
        results: [],
        source: "legislation.gov.uk",
        resultCount: 0,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  },
});

// ─── Planning Search ─────────────────────────────────────────────────────────

export const planningSearch = tool({
  description:
    "Search GOV.UK for planning guidance, permitted development rules, and planning policy. Use for questions about planning applications, objections, appeals, and development rights.",
  parameters: z.object({
    query: z.string().describe("The planning topic to look up"),
  }),
  execute: async ({ query }) => {
    try {
      // The Planning Portal doesn't have a public API; use GOV.UK search
      // scoped to planning topics for richer planning-specific results
      const planningQuery = `${query} planning`;
      const url = `https://www.gov.uk/api/search.json?q=${encodeURIComponent(planningQuery)}&filter_organisations[]=planning-inspectorate&count=5`;
      const fallbackUrl = `https://www.gov.uk/api/search.json?q=${encodeURIComponent(planningQuery)}&count=5`;

      let res = await fetch(url, {
        headers: { "User-Agent": "PublicAI-Demo/1.0 (publicai.uk)" },
        next: { revalidate: 300 },
      });
      if (!res.ok) res = await fetch(fallbackUrl, { headers: { "User-Agent": "PublicAI-Demo/1.0 (publicai.uk)" } });
      if (!res.ok) throw new Error(`Planning search returned ${res.status}`);

      const data = await res.json();
      const results = (data.results ?? []).slice(0, 5).map(
        (r: { title?: string; link?: string; description_with_highlighting?: string; public_timestamp?: string }) => ({
          title: r.title ?? "",
          url: `https://www.gov.uk${r.link ?? ""}`,
          summary: r.description_with_highlighting?.replace(/<[^>]+>/g, "").slice(0, 200) ?? "",
          published: r.public_timestamp ?? "",
          source: "Planning Portal / GOV.UK",
        })
      );

      return {
        query,
        results,
        source: "GOV.UK Planning Guidance",
        resultCount: results.length,
      };
    } catch (err) {
      return {
        query,
        results: [],
        source: "GOV.UK Planning Guidance",
        resultCount: 0,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  },
});
