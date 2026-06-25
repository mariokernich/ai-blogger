import { promises as fs } from "node:fs";
import path from "node:path";
import { config } from "./config.js";
import type { DateRange, EnrichedItem, RawItem } from "./types.js";
import { getPreviousWeek } from "./util/dates.js";
import { log } from "./util/log.js";

import { collectSapCommunity } from "./sources/sapCommunity.js";
import { collectDotabap } from "./sources/dotabap.js";
import { collectBestOfUi5 } from "./sources/bestOfUi5.js";
import { collectBestOfCap } from "./sources/bestOfCap.js";
import { collectMarianZeis } from "./sources/marianZeis.js";
import { collectItsFullOfStars } from "./sources/itsFullOfStars.js";
import { collectUi5Changelog } from "./sources/ui5Changelog.js";
import { filterRelevant } from "./enrich/filter.js";
import { enrichItems } from "./enrich/index.js";

import { writeArticle, writeLinkedIn } from "./ai/writer.js";
import { generateThumbnails } from "./ai/thumbnail.js";
import { publishToHugo } from "./publish/hugo.js";
import { publishToLinkedIn } from "./publish/linkedin.js";

export interface RunOptions {
  dryRun: boolean;
}

/** Step 1+2: collect from all sources and apply the relevance filter. */
export async function collect(range: DateRange): Promise<RawItem[]> {
  const results = await Promise.allSettled([
    collectSapCommunity(range),
    collectDotabap(range),
    collectBestOfUi5(range),
    collectBestOfCap(range),
    collectMarianZeis(range),
    collectItsFullOfStars(range),
    collectUi5Changelog(range),
  ]);

  const items: RawItem[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") items.push(...r.value);
    else log.error(`Source failed: ${r.reason}`);
  }

  const relevant = filterRelevant(items);
  log.ok(
    `Collected ${items.length} items, ${relevant.length} relevant after filter`,
  );
  return relevant;
}

/** Writes the collected/enriched data to a run folder for traceability. */
async function persistRunData(
  runDir: string,
  range: DateRange,
  enriched: EnrichedItem[],
): Promise<void> {
  await fs.mkdir(runDir, { recursive: true });
  await fs.writeFile(
    path.join(runDir, "data.json"),
    JSON.stringify({ range, items: enriched }, null, 2),
    "utf8",
  );
}

/** Full end-to-end run. */
export async function run(options: RunOptions): Promise<void> {
  const range = getPreviousWeek();
  log.info(`Target week: ${range.label} (${range.start} .. ${range.end})`);
  log.info(`Dry run: ${options.dryRun}`);

  const runDir = path.join("data", "runs", range.label);

  // --- Collect + filter ---
  const relevant = await collect(range);
  if (relevant.length === 0) {
    log.warn("No relevant items this week. Nothing to publish.");
    return;
  }

  // --- Enrich (fetch articles + commits) ---
  const enriched = await enrichItems(relevant, range);
  await persistRunData(runDir, range, enriched);

  // --- Generate article ---
  const article = await writeArticle(enriched, range);

  // --- Thumbnails (consistent style) ---
  const thumbDir = path.join(runDir, "thumbnails");
  const thumbnails = await generateThumbnails(article.imageSubject, thumbDir);

  // --- Publish blog (Hugo) ---
  const published = await publishToHugo(article, thumbnails.blog);
  log.ok(`Blog URL: ${published.url}`);

  // --- LinkedIn post ---
  const linkedIn = await writeLinkedIn(article, published.url);
  const draftPath = path.join(runDir, "linkedin.txt");
  await publishToLinkedIn(
    linkedIn,
    thumbnails.linkedin,
    draftPath,
    options.dryRun,
  );

  log.ok("Pipeline finished 🎉");
}

/** Collect-only mode (no AI), useful for debugging the data layer. */
export async function collectOnly(): Promise<void> {
  const range = getPreviousWeek();
  const relevant = await collect(range);
  const enriched = await enrichItems(relevant, range);
  const runDir = path.join("data", "runs", range.label);
  await persistRunData(runDir, range, enriched);
  log.ok(`Saved collected data -> ${path.join(runDir, "data.json")}`);
}

/** Re-export for the CLI generate step (collect+enrich already done). */
export { writeArticle, writeLinkedIn, generateThumbnails, config };
