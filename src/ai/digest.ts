import type { EnrichedItem } from "../types.js";

/**
 * Builds a compact, structured text digest of all enriched items that the
 * model uses as grounding context. We keep it token-bounded.
 */
export function buildDigest(items: EnrichedItem[]): string {
    const sections: string[] = [];

    const community = items.filter((i) => i.source === "sap-community");
    const abap = items.filter((i) => i.source === "dotabap");
    const ui5 = items.filter((i) => i.source === "bestofui5");

    if (community.length) {
        sections.push("## SAP Community Blog Posts");
        for (const it of community) {
            sections.push(
                [
                    `### ${it.title}`,
                    `URL: ${it.url}`,
                    it.author ? `Author: ${it.author}` : "",
                    it.tags?.length ? `Tags: ${it.tags.join(", ")}` : "",
                    it.content
                        ? `Content: ${truncate(it.content, 1200)}`
                        : (it.summary ?? ""),
                ]
                    .filter(Boolean)
                    .join("\n"),
            );
        }
    }

    if (abap.length) {
        sections.push("\n## ABAP Projects (dotabap)");
        for (const it of abap) sections.push(repoBlock(it));
    }

    if (ui5.length) {
        sections.push("\n## UI5 Projects (bestofui5)");
        for (const it of ui5) sections.push(repoBlock(it));
    }

    return sections.join("\n\n");
}

function repoBlock(it: EnrichedItem): string {
    const commitLines =
        it.commits && it.commits.length
            ? it.commits.map((c) => `  - ${c.message} (${c.author})`).join("\n")
            : "  - (no commits in window)";
    return [
        `### ${it.title}`,
        `URL: ${it.url}`,
        it.stars !== undefined ? `Stars: ${it.stars}` : "",
        it.summary ? `Description: ${it.summary}` : "",
        it.content ? `README: ${truncate(it.content, 600)}` : "",
        `Commits this week:\n${commitLines}`,
    ]
        .filter(Boolean)
        .join("\n");
}

function truncate(s: string, n: number): string {
    return s.length > n ? s.slice(0, n) + "…" : s;
}
