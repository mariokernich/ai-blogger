import { describe, it, expect } from "vitest";
import { isRelevant, filterRelevant } from "../src/enrich/filter.js";
import type { RawItem } from "../src/types.js";

function item(partial: Partial<RawItem>): RawItem {
    return {
        source: "sap-community",
        title: "x",
        url: "https://example.com",
        publishedAt: "2026-06-17T00:00:00.000Z",
        ...partial,
    };
}

describe("isRelevant", () => {
    it("always keeps dotabap items", () => {
        expect(
            isRelevant(item({ source: "dotabap", title: "random repo" })),
        ).toBe(true);
    });

    it("always keeps bestofui5 items", () => {
        expect(
            isRelevant(item({ source: "bestofui5", title: "random package" })),
        ).toBe(true);
    });

    it("always keeps bestofcap items", () => {
        expect(
            isRelevant(item({ source: "bestofcap", title: "random package" })),
        ).toBe(true);
    });

    it("always keeps Marian Zeis blog items", () => {
        expect(
            isRelevant(item({ source: "marian-zeis", title: "random post" })),
        ).toBe(true);
    });

    it("keeps SAP Community posts that mention an audience topic in the title", () => {
        expect(
            isRelevant(item({ title: "New features in SAPUI5 1.130" })),
        ).toBe(true);
    });

    it("keeps SAP Community posts that mention a topic in the summary", () => {
        expect(
            isRelevant(
                item({ title: "Tips", summary: "A guide about the RAP model" }),
            ),
        ).toBe(true);
    });

    it("drops off-topic SAP Community posts", () => {
        expect(
            isRelevant(
                item({
                    title: "SuccessFactors payroll update",
                    summary: "HR news",
                }),
            ),
        ).toBe(false);
    });

    it("is case-insensitive", () => {
        expect(isRelevant(item({ title: "fiori ELEMENTS deep dive" }))).toBe(
            true,
        );
    });
});

describe("filterRelevant", () => {
    it("filters a mixed list down to relevant items", () => {
        const items: RawItem[] = [
            item({ source: "dotabap", title: "abc" }),
            item({ title: "Marketing newsletter" }),
            item({ title: "BTP destination service tutorial" }),
        ];
        const result = filterRelevant(items);
        expect(result).toHaveLength(2);
        expect(result.map((r) => r.title)).not.toContain(
            "Marketing newsletter",
        );
    });
});
