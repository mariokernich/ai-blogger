import { config } from "../config.js";
import type { DateRange, RawItem } from "../types.js";
import { fetchJson } from "../util/http.js";
import { isWithin } from "../util/dates.js";
import { log } from "../util/log.js";

interface BestOfUi5Package {
    name: string;
    description?: string;
    gitHubOwner?: string;
    gitHubRepo?: string;
    githublink?: string;
    updatedAt?: string;
    stars?: number;
    tags?: string[];
    type?: string;
}

interface BestOfUi5Data {
    packages: BestOfUi5Package[];
}

/**
 * Collects UI5 community projects from bestofui5 that were updated in the week.
 */
export async function collectBestOfUi5(range: DateRange): Promise<RawItem[]> {
    log.step("Collecting bestofui5 UI5 projects");
    const data = await fetchJson<BestOfUi5Data>(config.sources.bestOfUi5);

    const items: RawItem[] = [];
    for (const pkg of data.packages ?? []) {
        if (!pkg.updatedAt) continue;
        const updatedAt = new Date(pkg.updatedAt).toISOString();
        if (!isWithin(updatedAt, range)) continue;

        const repo =
            pkg.gitHubOwner && pkg.gitHubRepo
                ? `${pkg.gitHubOwner}/${pkg.gitHubRepo}`
                : undefined;

        items.push({
            source: "bestofui5",
            title: pkg.name,
            url: pkg.githublink ?? (repo ? `https://github.com/${repo}` : ""),
            publishedAt: updatedAt,
            summary: pkg.description,
            tags: pkg.tags ?? (pkg.type ? [pkg.type] : []),
            repo,
        });
    }

    log.ok(`bestofui5: ${items.length} packages updated in week`);
    return items;
}
