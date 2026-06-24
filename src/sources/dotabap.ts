import { config } from "../config.js";
import type { DateRange, RawItem } from "../types.js";
import { fetchJson } from "../util/http.js";
import { isWithin } from "../util/dates.js";
import { log } from "../util/log.js";

interface DotabapRepo {
    full_name: string;
    html_url: string;
    description: string | null;
    pushed_at: string;
    updated_at: string;
    stargazers_count: number;
    topics?: string[];
}

interface DotabapEntry {
    repo?: DotabapRepo;
}

type DotabapData = Record<string, DotabapEntry>;

/**
 * Collects ABAP projects from dotabap that had a push in the given week.
 */
export async function collectDotabap(range: DateRange): Promise<RawItem[]> {
    log.step("Collecting dotabap ABAP projects");
    const data = await fetchJson<DotabapData>(config.sources.dotabap);

    const items: RawItem[] = [];
    for (const entry of Object.values(data)) {
        const repo = entry.repo;
        if (!repo?.pushed_at) continue;
        const pushedAt = new Date(repo.pushed_at).toISOString();
        if (!isWithin(pushedAt, range)) continue;

        items.push({
            source: "dotabap",
            title: repo.full_name,
            url: repo.html_url,
            publishedAt: pushedAt,
            summary: repo.description ?? undefined,
            tags: repo.topics ?? [],
            repo: repo.full_name,
        });
    }

    log.ok(`dotabap: ${items.length} repos active in week`);
    return items;
}
