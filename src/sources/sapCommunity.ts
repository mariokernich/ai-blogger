import { XMLParser } from "fast-xml-parser";
import { config } from "../config.js";
import type { DateRange, RawItem } from "../types.js";
import { fetchText } from "../util/http.js";
import { isWithin } from "../util/dates.js";
import { log } from "../util/log.js";

interface RssItem {
    title?: string;
    link?: string;
    pubDate?: string;
    "dc:creator"?: string;
    category?: string | string[];
    description?: string;
}

/**
 * Collects SAP Community blog posts from the RSS feed and keeps only the
 * ones published in the given week.
 */
export async function collectSapCommunity(
    range: DateRange,
): Promise<RawItem[]> {
    log.step("Collecting SAP Community RSS blogs");
    const xml = await fetchText(config.sources.sapCommunityRss);

    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
        processEntities: false,
        htmlEntities: false,
    });
    const parsed = parser.parse(xml);

    const channel = parsed?.rss?.channel ?? parsed?.feed ?? {};
    const rawItems: RssItem[] = toArray(channel.item ?? channel.entry);

    const items: RawItem[] = [];
    for (const it of rawItems) {
        const pub = it.pubDate;
        if (!pub) continue;
        const publishedAt = new Date(pub).toISOString();
        if (!isWithin(publishedAt, range)) continue;

        items.push({
            source: "sap-community",
            title: cleanText(it.title ?? "Untitled"),
            url: typeof it.link === "string" ? it.link : String(it.link ?? ""),
            publishedAt,
            author: it["dc:creator"],
            tags: toArray(it.category).map(String),
            summary: cleanText(stripHtml(it.description ?? "")).slice(0, 400),
        });
    }

    log.ok(`SAP Community: ${items.length} blogs in week`);
    return items;
}

function toArray<T>(value: T | T[] | undefined): T[] {
    if (value === undefined || value === null) return [];
    return Array.isArray(value) ? value : [value];
}

function stripHtml(html: string): string {
    return html.replace(/<[^>]+>/g, " ");
}

function cleanText(s: string): string {
    return s.replace(/\s+/g, " ").trim();
}
