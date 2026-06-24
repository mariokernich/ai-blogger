import { describe, it, expect } from "vitest";
import { getPreviousWeek, isWithin } from "../src/util/dates.js";

describe("getPreviousWeek", () => {
    const berlin = (iso: string) =>
        new Date(iso).toLocaleString("en-GB", { timeZone: "Europe/Berlin" });

    it("returns Monday→Sunday of the previous week for a Monday run", () => {
        // Monday 2026-06-22 08:00 Berlin (06:00 UTC, CEST = UTC+2)
        const now = new Date("2026-06-22T06:00:00.000Z");
        const range = getPreviousWeek(now);

        // Previous week = Mon 2026-06-15 00:00 Berlin .. end of Sun 2026-06-21 Berlin
        expect(berlin(range.start)).toContain("15/06/2026");
        expect(berlin(range.start)).toContain("00:00:00");
        // end is ~Sunday 23:59:59 Berlin (stored boundary)
        expect(new Date(range.end).getTime()).toBeGreaterThan(
            new Date(range.start).getTime(),
        );
        expect(range.label).toBe("2026-W25");
    });

    it("spans (just under) 7 days", () => {
        const range = getPreviousWeek(new Date("2026-06-22T06:00:00.000Z"));
        const days =
            (new Date(range.end).getTime() - new Date(range.start).getTime()) /
            86400000;
        expect(days).toBeGreaterThan(6.9);
        expect(days).toBeLessThan(7.1);
    });

    it("start is strictly before end", () => {
        const range = getPreviousWeek(new Date("2026-03-04T07:00:00.000Z"));
        expect(new Date(range.start).getTime()).toBeLessThan(
            new Date(range.end).getTime(),
        );
    });

    it("produces an ISO week label", () => {
        const range = getPreviousWeek(new Date("2026-01-12T07:00:00.000Z"));
        expect(range.label).toMatch(/^\d{4}-W\d{2}$/);
    });
});

describe("isWithin", () => {
    const range = getPreviousWeek(new Date("2026-06-22T06:00:00.000Z"));

    it("returns true for a timestamp inside the week", () => {
        expect(isWithin("2026-06-17T10:00:00.000Z", range)).toBe(true);
    });

    it("returns false for a timestamp before the week", () => {
        expect(isWithin("2026-06-10T10:00:00.000Z", range)).toBe(false);
    });

    it("returns false for a timestamp after the week", () => {
        expect(isWithin("2026-06-25T10:00:00.000Z", range)).toBe(false);
    });

    it("returns false for an invalid date", () => {
        expect(isWithin("not-a-date", range)).toBe(false);
    });
});
