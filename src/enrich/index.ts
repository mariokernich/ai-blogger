import type { DateRange, EnrichedItem, RawItem } from "../types.js";
import { fetchArticleText } from "./article.js";
import { fetchCommits, fetchRepoMeta } from "./github.js";
import { log } from "../util/log.js";

/** Limit how many items per source we deeply enrich to keep runtime/cost sane. */
const MAX_PER_SOURCE = 15;

/**
 * Enriches filtered items:
 *  - SAP Community: fetch the blog article text.
 *  - dotabap / bestofui5: fetch repo commits (in week) + stars + README.
 */
export async function enrichItems(
    items: RawItem[],
    range: DateRange,
): Promise<EnrichedItem[]> {
    log.step(`Enriching ${items.length} items`);

    const bySource = groupBySource(items);
    const enriched: EnrichedItem[] = [];

    for (const [source, list] of Object.entries(bySource)) {
        const capped = list.slice(0, MAX_PER_SOURCE);
        log.info(`Enriching ${capped.length}/${list.length} from ${source}`);

        for (const item of capped) {
            if (source === "sap-community") {
                const content = await fetchArticleText(item.url);
                enriched.push({ ...item, content });
            } else if (item.repo) {
                const [commits, meta] = await Promise.all([
                    fetchCommits(item.repo, range),
                    fetchRepoMeta(item.repo),
                ]);
                // Skip repos that turned out to have no commits in the window
                // (their pushed_at/updatedAt may reflect a non-default branch).
                enriched.push({
                    ...item,
                    commits,
                    stars: meta.stars,
                    content: meta.readme,
                });
            } else {
                enriched.push({ ...item });
            }
        }
    }

    log.ok(`Enriched ${enriched.length} items`);
    return enriched;
}

function groupBySource(items: RawItem[]): Record<string, RawItem[]> {
    const map: Record<string, RawItem[]> = {};
    for (const it of items) (map[it.source] ??= []).push(it);
    return map;
}
