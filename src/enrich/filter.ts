import { config } from "../config.js";
import type { RawItem } from "../types.js";

/**
 * Keyword-based relevance pre-filter for the target audience
 * (fullstack SAP devs: UI5, RAP, BTP, ABAP, Fiori).
 *
 * dotabap, bestofui5 and the Marian Zeis blog are SAP/ABAP/UI5-focused by
 * definition, so they always pass. SAP Community covers everything (HR,
 * finance, basis, ...) so we require at least one audience keyword.
 */
export function isRelevant(item: RawItem): boolean {
    if (
        item.source === "dotabap" ||
        item.source === "bestofui5" ||
        item.source === "bestofcap" ||
        item.source === "marian-zeis" ||
        item.source === "its-full-of-stars"
    )
        return true;

    const haystack = [item.title, item.summary]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

    return config.audienceTopics.some((kw) => haystack.includes(kw));
}

export function filterRelevant(items: RawItem[]): RawItem[] {
    return items.filter(isRelevant);
}
