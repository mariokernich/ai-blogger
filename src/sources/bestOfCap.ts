import { config } from "../config.js";
import type { DateRange, RawItem } from "../types.js";
import { fetchJson } from "../util/http.js";
import { isWithin } from "../util/dates.js";
import { log } from "../util/log.js";

interface BestOfCapPackage {
    name: string;
    description?: string;
    gitHubOwner?: string;
    gitHubRepo?: string;
    githublink?: string;
    updatedAt?: string;
}

interface BestOfCapData {
    packages: BestOfCapPackage[];
}

/**
 * Collects CAP community projects from bestofcapjs that were updated in the week.
 */
export async function collectBestOfCap(range: DateRange): Promise<RawItem[]> {
    log.step("Collecting bestofcap CAP projects");
    const data = await fetchJson<BestOfCapData>(config.sources.bestOfCap);

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
            source: "bestofcap",
            title: pkg.name,
            url: pkg.githublink ?? (repo ? `https://github.com/${repo}` : ""),
            publishedAt: updatedAt,
            summary: pkg.description,
            repo,
        });
    }

    log.ok(`bestofcap: ${items.length} packages updated in week`);
    return items;
}
