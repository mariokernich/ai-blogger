import { config } from "../config.js";
import type { CommitInfo, DateRange } from "../types.js";
import { fetchJson, fetchWithRetry } from "../util/http.js";
import { log } from "../util/log.js";

const API = "https://api.github.com";

function ghHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    };
    if (config.github.token)
        headers.Authorization = `Bearer ${config.github.token}`;
    return headers;
}

interface GhCommit {
    sha: string;
    html_url: string;
    commit: {
        message: string;
        author: { name?: string; date?: string };
    };
}

/** Fetch commits for a repo within the date range. */
export async function fetchCommits(
    repo: string,
    range: DateRange,
): Promise<CommitInfo[]> {
    const url =
        `${API}/repos/${repo}/commits` +
        `?since=${encodeURIComponent(range.start)}&until=${encodeURIComponent(range.end)}&per_page=30`;
    try {
        const commits = await fetchJson<GhCommit[]>(url, {
            headers: ghHeaders(),
        });
        return commits.map((c) => ({
            sha: c.sha.slice(0, 7),
            message: c.commit.message.split("\n")[0].slice(0, 200),
            author: c.commit.author?.name ?? "unknown",
            date: c.commit.author?.date ?? "",
            url: c.html_url,
        }));
    } catch (err) {
        log.warn(
            `Could not fetch commits for ${repo}: ${(err as Error).message}`,
        );
        return [];
    }
}

interface GhRepo {
    stargazers_count: number;
    default_branch: string;
}

/** Fetch star count + README excerpt for a repo. */
export async function fetchRepoMeta(
    repo: string,
): Promise<{ stars?: number; readme?: string }> {
    try {
        const meta = await fetchJson<GhRepo>(`${API}/repos/${repo}`, {
            headers: ghHeaders(),
        });
        const readme = await fetchReadme(repo);
        return { stars: meta.stargazers_count, readme };
    } catch (err) {
        log.warn(
            `Could not fetch repo meta for ${repo}: ${(err as Error).message}`,
        );
        return {};
    }
}

async function fetchReadme(repo: string): Promise<string | undefined> {
    try {
        const res = await fetchWithRetry(`${API}/repos/${repo}/readme`, {
            headers: {
                ...ghHeaders(),
                Accept: "application/vnd.github.raw+json",
            },
        });
        if (!res.ok) return undefined;
        const text = await res.text();
        return stripMarkdownNoise(text).slice(0, 1500);
    } catch {
        return undefined;
    }
}

function stripMarkdownNoise(md: string): string {
    return md
        .replace(/<!--[\s\S]*?-->/g, "")
        .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // images
        .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links -> text
        .replace(/```[\s\S]*?```/g, "") // code fences
        .replace(/[#>*`_]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}
