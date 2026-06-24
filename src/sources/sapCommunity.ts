import { config } from "../config.js";
import type { DateRange, RawItem } from "../types.js";
import { fetchText } from "../util/http.js";
import { isWithin } from "../util/dates.js";
import { log } from "../util/log.js";

interface SitemapEntry {
    loc: string;
    lastmod?: string;
}

/** Only crawl blog-board child sitemaps (these hold blog posts). */
const BLOG_BOARD_RE = /blog-board\.xml(?:\.gz)?$/i;

/** Safety cap so we never fan out to hundreds of child sitemaps. */
const MAX_CHILD_SITEMAPS = 60;

/**
 * Collects SAP Community blog posts from the threads sitemap.
 *
 * The RSS feed only exposes the ~20 most recent posts, which on a busy day
 * doesn't even reach back a full week. The sitemap index instead lists every
 * board's sitemap with a `lastmod`, so we can drill into the blog boards that
 * changed within the target window and pull the individual thread URLs.
 *
 * Titles are derived from the URL slug; the article body/author are fetched
 * later during enrichment (see enrich/article.ts).
 */
export async function collectSapCommunity(
    range: DateRange,
): Promise<RawItem[]> {
    log.step("Collecting SAP Community sitemap");

    const indexXml = await fetchText(config.sources.sapCommunitySitemap);
    const children = parseEntries(indexXml, "sitemap");

    // Keep blog boards whose sitemap changed on/after the window start.
    const start = new Date(range.start).getTime();
    const candidates = children
        .filter((c) => BLOG_BOARD_RE.test(c.loc))
        .filter((c) => {
            if (!c.lastmod) return true;
            return new Date(c.lastmod).getTime() >= start;
        });

    log.info(
        `SAP Community: ${candidates.length} blog boards touched since window start`,
    );

    const capped = candidates.slice(0, MAX_CHILD_SITEMAPS);
    if (candidates.length > capped.length) {
        log.warn(
            `SAP Community: capping at ${MAX_CHILD_SITEMAPS} blog boards (had ${candidates.length})`,
        );
    }

    const results = await Promise.allSettled(
        capped.map((c) => collectFromChild(c.loc, range)),
    );

    const items: RawItem[] = [];
    const seen = new Set<string>();
    for (const r of results) {
        if (r.status !== "fulfilled") {
            log.warn(`SAP Community child failed: ${r.reason}`);
            continue;
        }
        for (const it of r.value) {
            if (seen.has(it.url)) continue;
            seen.add(it.url);
            items.push(it);
        }
    }

    log.ok(`SAP Community: ${items.length} posts in week`);
    return items;
}

/** Fetch one board sitemap and return the thread URLs published in range. */
async function collectFromChild(
    url: string,
    range: DateRange,
): Promise<RawItem[]> {
    const xml = await fetchText(url);
    const urls = parseEntries(xml, "url");

    const items: RawItem[] = [];
    for (const entry of urls) {
        if (!entry.lastmod) continue;
        const publishedAt = new Date(entry.lastmod).toISOString();
        if (!isWithin(publishedAt, range)) continue;

        items.push({
            source: "sap-community",
            title: titleFromUrl(entry.loc),
            url: entry.loc,
            publishedAt,
        });
    }
    return items;
}

/** Extract <loc>/<lastmod> pairs from <sitemap> or <url> blocks. */
function parseEntries(xml: string, tag: "sitemap" | "url"): SitemapEntry[] {
    const blockRe = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "g");
    const entries: SitemapEntry[] = [];
    for (const m of xml.matchAll(blockRe)) {
        const block = m[1];
        const loc = block.match(/<loc>(.*?)<\/loc>/)?.[1]?.trim();
        if (!loc) continue;
        const lastmod = block.match(/<lastmod>(.*?)<\/lastmod>/)?.[1]?.trim();
        entries.push({ loc, lastmod });
    }
    return entries;
}

/**
 * Turns a community thread URL into a human-readable title from its slug.
 * Example:
 *   .../t5/technology-blog-posts/sap-cap-certification/ba-p/14425239
 *   -> "Sap Cap Certification"
 */
function titleFromUrl(url: string): string {
    try {
        const path = new URL(url).pathname.split("/").filter(Boolean);
        const baIdx = path.findIndex((p) => p === "ba-p" || p === "td-p");
        const slug = baIdx > 0 ? path[baIdx - 1] : path[path.length - 1];
        const title = slug
            .replace(/[-_]+/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .replace(/\b\w/g, (c) => c.toUpperCase());
        return title || url;
    } catch {
        return url;
    }
}
