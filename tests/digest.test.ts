import { describe, it, expect } from "vitest";
import { buildDigest } from "../src/ai/digest.js";
import type { EnrichedItem } from "../src/types.js";

const base = {
    publishedAt: "2026-06-17T00:00:00.000Z",
};

describe("buildDigest", () => {
    it("returns an empty string for no items", () => {
        expect(buildDigest([])).toBe("");
    });

    it("groups items under the correct source sections", () => {
        const items: EnrichedItem[] = [
            {
                ...base,
                source: "sap-community",
                title: "UI5 Tips",
                url: "https://community.sap.com/post/1",
                content: "Some content about UI5.",
                author: "Jane",
            },
            {
                ...base,
                source: "dotabap",
                title: "foo/abap-tool",
                url: "https://github.com/foo/abap-tool",
                repo: "foo/abap-tool",
                commits: ["Add feature"],
            },
            {
                ...base,
                source: "bestofui5",
                title: "ui5-cool-lib",
                url: "https://github.com/bar/ui5-cool-lib",
                repo: "bar/ui5-cool-lib",
            },
            {
                ...base,
                source: "bestofcap",
                title: "cap-cool-plugin",
                url: "https://github.com/baz/cap-cool-plugin",
                repo: "baz/cap-cool-plugin",
                commits: ["Fix bug"],
                releases: ["v1.2.0"],
            },
        ];

        const digest = buildDigest(items);

        expect(digest).toContain("## SAP Community Blog Posts");
        expect(digest).toContain("## ABAP Projects (dotabap)");
        expect(digest).toContain("## UI5 Projects (bestofui5)");
        expect(digest).toContain("## CAP Projects (bestofcap)");
        expect(digest).toContain("UI5 Tips");
        expect(digest).toContain("Author: Jane");
        expect(digest).toContain("Add feature");
        expect(digest).toContain("Releases this week:");
        expect(digest).toContain("v1.2.0");
    });

    it("shows a placeholder when a repo has no commits", () => {
        const items: EnrichedItem[] = [
            {
                ...base,
                source: "dotabap",
                title: "foo/empty",
                url: "https://github.com/foo/empty",
                repo: "foo/empty",
                commits: [],
            },
        ];
        expect(buildDigest(items)).toContain("(no commits in window)");
    });

    it("drops trivial commits but keeps notable ones", () => {
        const items: EnrichedItem[] = [
            {
                ...base,
                source: "dotabap",
                title: "foo/lib",
                url: "https://github.com/foo/lib",
                repo: "foo/lib",
                commits: [
                    "Add streaming export API",
                    "chore: update sap-package metadata",
                    "build(deps): update dependency glob to v10.3.10",
                    "Merge pull request #5 from foo/bar",
                ],
            },
        ];
        const digest = buildDigest(items);
        expect(digest).toContain("Add streaming export API");
        expect(digest).not.toContain("update sap-package metadata");
        expect(digest).not.toContain("update dependency glob");
        expect(digest).toContain("minor/maintenance commits omitted");
    });

    it("collapses repos that only had trivial changes", () => {
        const items: EnrichedItem[] = [
            {
                ...base,
                source: "dotabap",
                title: "foo/chores",
                url: "https://github.com/foo/chores",
                repo: "foo/chores",
                commits: [
                    "chore: bump version to 1.2.3",
                    "docs: fix typo in README",
                ],
            },
        ];
        expect(buildDigest(items)).toContain(
            "(only minor/maintenance changes this week)",
        );
    });
});
