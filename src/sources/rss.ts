import { XMLParser } from "fast-xml-parser";
import type { DateRange, RawItem } from "../types.js";
import { fetchText } from "../util/http.js";
import { isWithin } from "../util/dates.js";
import { log } from "../util/log.js";

interface RssItem {
    title?: string;
    link?: string;
    pubDate?: string;
    published?: string;
    updated?: string;
    "dc:creator"?: string;
    author?: string | { name?: string };
    category?: string | string[];
    description?: string;
}

export interface RssSourceOptions {
    /** Human-readable name for logging. */
    name: string;
    /** Feed URL. */
    url: string;
    /** Source tag stored on each RawItem. */
    source: RawItem["source"];
    /** Fallback author when the feed has none (e.g. a single-author blog). */
    defaultAuthor?: string;
}

/**
 * Generic RSS/Atom collector: fetches a feed, parses items and keeps only the
 * ones published within the given week.
 */
export async function collectRss(
    range: DateRange,
    opts: RssSourceOptions,
): Promise<RawItem[]> {
    log.step(`Collecting ${opts.name} RSS`);
    const xml = await fetchText(opts.url);

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
        const pub = it.pubDate ?? it.published ?? it.updated;
        if (!pub) continue;
        const publishedAt = new Date(pub).toISOString();
        if (!isWithin(publishedAt, range)) continue;

        items.push({
            source: opts.source,
            title: cleanText(it.title ?? "Untitled"),
            url: extractLink(it.link),
            publishedAt,
            author: extractAuthor(it) ?? opts.defaultAuthor,
            summary: cleanText(stripHtml(it.description ?? "")).slice(0, 400),
        });
    }

    log.ok(`${opts.name}: ${items.length} posts in week`);
    return items;
}

function extractLink(link: RssItem["link"]): string {
    if (typeof link === "string") return link;
    // Atom <link href="..."/>
    const anyLink = link as { "@_href"?: string } | undefined;
    return anyLink?.["@_href"] ?? String(link ?? "");
}

function extractAuthor(it: RssItem): string | undefined {
    if (it["dc:creator"]) return it["dc:creator"];
    if (typeof it.author === "string") return it.author;
    if (it.author && typeof it.author === "object") return it.author.name;
    return undefined;
}

function toArray<T>(value: T | T[] | undefined): T[] {
    if (value === undefined || value === null) return [];
    return Array.isArray(value) ? value : [value];
}

function stripHtml(html: string): string {
    // Feeds may be entity-encoded (e.g. &lt;p&gt;). Decode the structural
    // entities first so tags can be stripped, then drop remaining markup.
    return decodeEntities(html).replace(/<[^>]+>/g, " ");
}

function decodeEntities(s: string): string {
    return s
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#34;/g, '"')
        .replace(/&#39;|&apos;/g, "'")
        .replace(/&#x?[0-9a-fA-F]+;/g, " ")
        .replace(/&[a-z]+;/gi, " ")
        .replace(/&amp;/g, "&");
}

function cleanText(s: string): string {
    return s.replace(/\s+/g, " ").trim();
}
