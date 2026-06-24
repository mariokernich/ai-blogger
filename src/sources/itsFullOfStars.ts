import { config } from "../config.js";
import type { DateRange, RawItem } from "../types.js";
import { collectRss } from "./rss.js";

/**
 * Collects blog posts from the "It's full of stars" blog
 * (https://www.itsfullofstars.de) and keeps only the ones published in the
 * given week. It's a SAP-focused developer blog (BTP, ABAP, security, APIs).
 */
export async function collectItsFullOfStars(
    range: DateRange,
): Promise<RawItem[]> {
    return collectRss(range, {
        name: "It's full of stars",
        url: config.sources.itsFullOfStarsRss,
        source: "its-full-of-stars",
        defaultAuthor: "Gregor Wolf",
    });
}
