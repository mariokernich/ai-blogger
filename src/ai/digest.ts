import type { EnrichedItem } from "../types.js";

/**
 * Builds a compact, structured text digest of all enriched items that the
 * model uses as grounding context. We keep it token-bounded.
 */
export function buildDigest(items: EnrichedItem[]): string {
    const sections: string[] = [];

    const community = items.filter((i) => i.source === "sap-community");
    const zeis = items.filter((i) => i.source === "marian-zeis");
    const ifos = items.filter((i) => i.source === "its-full-of-stars");
    const abap = items.filter((i) => i.source === "dotabap");
    const ui5 = items.filter((i) => i.source === "bestofui5");
    const cap = items.filter((i) => i.source === "bestofcap");

    if (community.length) {
        sections.push("## SAP Community Blog Posts");
        for (const it of community) sections.push(blogBlock(it));
    }

    if (zeis.length) {
        sections.push("\n## Marian Zeis Blog");
        for (const it of zeis) sections.push(blogBlock(it));
    }

    if (ifos.length) {
        sections.push("\n## It's full of stars (Blog)");
        for (const it of ifos) sections.push(blogBlock(it));
    }

    if (abap.length) {
        sections.push("\n## ABAP Projects (dotabap)");
        for (const it of abap) sections.push(repoBlock(it));
    }

    if (ui5.length) {
        sections.push("\n## UI5 Projects (bestofui5)");
        for (const it of ui5) sections.push(repoBlock(it));
    }

    if (cap.length) {
        sections.push("\n## CAP Projects (bestofcap)");
        for (const it of cap) sections.push(repoBlock(it));
    }

    return sections.join("\n\n");
}

/** Renders a blog-style item (community / curated blogs) for the digest. */
function blogBlock(it: EnrichedItem): string {
    return [
        `### ${it.title}`,
        `URL: ${it.url}`,
        it.author ? `Author: ${it.author}` : "",
        it.content
            ? `Content: ${truncate(it.content, 1200)}`
            : (it.summary ?? ""),
    ]
        .filter(Boolean)
        .join("\n");
}

function repoBlock(it: EnrichedItem): string {
    const notable = (it.commits ?? []).filter(isNotableCommit);
    const trivialCount = (it.commits?.length ?? 0) - notable.length;

    let commitLines: string;
    if (notable.length) {
        commitLines = notable.map((m) => `  - ${m}`).join("\n");
        if (trivialCount > 0) {
            commitLines += `\n  - (+${trivialCount} minor/maintenance commits omitted)`;
        }
    } else if ((it.commits?.length ?? 0) > 0) {
        commitLines = "  - (only minor/maintenance changes this week)";
    } else {
        commitLines = "  - (no commits in window)";
    }

    const lines = [
        `### ${it.title}`,
        `URL: ${it.url}`,
        it.summary ? `Description: ${it.summary}` : "",
        it.content ? `README: ${truncate(it.content, 600)}` : "",
        `Commits this week:\n${commitLines}`,
    ];
    if (it.releases && it.releases.length) {
        lines.push(
            `Releases this week:\n${it.releases.map((r) => `  - ${r}`).join("\n")}`,
        );
    }
    return lines.filter(Boolean).join("\n");
}

/**
 * Heuristic to drop low-signal commit messages (dependency bumps, chores,
 * version bumps, formatting, CI, test-only changes, merges, typo/readme tweaks)
 * so the AI focuses on meaningful work.
 */
const TRIVIAL_COMMIT_RE =
    /^(chore|ci|build|test|tests|style|docs?|refactor|revert)(\(.*?\))?:|^(merge\b|bump\b|release\b|v?\d+\.\d+\.\d+)|update dependenc|update .* to v?\d|dependabot|renovate|lint|prettier|format(ting)?|typo|readme|changelog|version bump|^wip\b/i;

function isNotableCommit(message: string): boolean {
    const msg = message.trim();
    if (!msg) return false;
    return !TRIVIAL_COMMIT_RE.test(msg);
}

function truncate(s: string, n: number): string {
    return s.length > n ? s.slice(0, n) + "…" : s;
}
