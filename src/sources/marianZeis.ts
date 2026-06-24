import { config } from "../config.js";
import type { DateRange, RawItem } from "../types.js";
import { collectRss } from "./rss.js";

/**
 * Collects blog posts from Marian Zeis' blog (https://blog.zeis.de) and keeps
 * only the ones published in the given week.
 */
export async function collectMarianZeis(range: DateRange): Promise<RawItem[]> {
    return collectRss(range, {
        name: "Marian Zeis Blog",
        url: config.sources.marianZeisRss,
        source: "marian-zeis",
        defaultAuthor: "Marian Zeis",
    });
}
