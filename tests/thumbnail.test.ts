import { describe, it, expect } from "vitest";
import { THUMBNAIL_STYLE, THUMBNAIL_VARIANTS } from "../src/ai/thumbnail.js";

describe("thumbnail style guide", () => {
    it("defines a consistent palette and art direction", () => {
        expect(THUMBNAIL_STYLE.palette).toBeTruthy();
        expect(THUMBNAIL_STYLE.artDirection).toContain("no text");
        expect(THUMBNAIL_STYLE.mood).toBeTruthy();
    });

    it("exposes a blog and a linkedin variant with valid sizes", () => {
        const names = THUMBNAIL_VARIANTS.map((v) => v.name).sort();
        expect(names).toEqual(["blog", "linkedin"]);
        for (const v of THUMBNAIL_VARIANTS) {
            expect(v.width).toBeGreaterThan(0);
            expect(v.height).toBeGreaterThan(0);
        }
    });
});
