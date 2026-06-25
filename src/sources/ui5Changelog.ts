import { config } from "../config.js";
import type { DateRange, RawItem } from "../types.js";
import { collectRss } from "./rss.js";

/**
 * Collects SAPUI5 version changelog entries from the UI5 lib-diff feed
 * (https://ui5-lib-diff.marianzeis.de) and keeps only the ones published in
 * the given week.
 */
export async function collectUi5Changelog(
  range: DateRange,
): Promise<RawItem[]> {
  return collectRss(range, {
    name: "UI5 Changelog (SAPUI5)",
    url: config.sources.ui5ChangelogRss,
    source: "ui5-changelog",
    defaultAuthor: "SAPUI5",
  });
}
