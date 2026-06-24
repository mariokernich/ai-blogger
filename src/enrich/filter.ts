import { config } from "../config.js";
import type { RawItem } from "../types.js";

/**
 * Keyword-based relevance pre-filter for the target audience
 * (fullstack SAP devs: UI5, RAP, BTP, ABAP, Fiori).
 *
 * dotabap and bestofui5 are SAP/ABAP/UI5 ecosystems by definition, so they
 * always pass. SAP Community covers everything (HR, finance, basis, ...) so we
 * require at least one audience keyword in the title/summary/tags.
 */
export function isRelevant(item: RawItem): boolean {
    if (item.source === "dotabap" || item.source === "bestofui5") return true;

    const haystack = [item.title, item.summary, ...(item.tags ?? [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

    return config.audienceTopics.some((kw) => haystack.includes(kw));
}

export function filterRelevant(items: RawItem[]): RawItem[] {
    return items.filter(isRelevant);
}
