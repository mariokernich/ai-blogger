/**
 * Live debug CLI – run each function / request individually against the REAL
 * sources & APIs. Useful for local debugging without running the full pipeline.
 *
 * Usage:
 *   npm run debug -- <command> [args]
 *
 * Commands:
 *   week                         Show the computed previous-week range
 *
 *   source:sap                   Collect SAP Community RSS for the week
 *   source:dotabap               Collect dotabap repos for the week
 *   source:ui5                   Collect bestofui5 packages for the week
 *   source:zeis                  Collect Marian Zeis blog posts for the week
 *   collect                      Collect + filter all sources
 *
 *   article <url>                Fetch + extract a SAP blog article text
 *   commits <owner/repo>         Fetch GitHub commits for the week
 *   repo <owner/repo>            Fetch GitHub repo meta (stars + README)
 *   enrich                       Collect + filter + enrich everything
 *
 *   http:json <url>              Raw fetchJson helper test
 *   http:text <url>              Raw fetchText helper test (first 500 chars)
 *
 *   ai:article                   Generate an article from a saved/collected run
 *   ai:linkedin                  Generate a LinkedIn post from a fake article
 *   ai:thumbnail "<subject>"     Generate thumbnails for a subject
 *
 * Add --json to print full JSON instead of a compact summary.
 */
import "dotenv/config";
import path from "node:path";
import { promises as fs } from "node:fs";

import { getPreviousWeek } from "../util/dates.js";
import { collectSapCommunity } from "../sources/sapCommunity.js";
import { collectDotabap } from "../sources/dotabap.js";
import { collectBestOfUi5 } from "../sources/bestOfUi5.js";
import { collectMarianZeis } from "../sources/marianZeis.js";
import { collect } from "../pipeline.js";
import { enrichItems } from "../enrich/index.js";
import { fetchArticleText } from "../enrich/article.js";
import { fetchCommits, fetchRepoMeta } from "../enrich/github.js";
import { fetchJson, fetchText } from "../util/http.js";
import { writeArticle, writeLinkedIn } from "../ai/writer.js";
import { generateThumbnails } from "../ai/thumbnail.js";
import { log } from "../util/log.js";
import type { EnrichedItem, GeneratedArticle } from "../types.js";

const args = process.argv.slice(2);
const command = args[0];
const wantJson = args.includes("--json");
const positional = args.slice(1).filter((a) => !a.startsWith("--"));

function out(label: string, value: unknown): void {
    if (wantJson) {
        console.log(JSON.stringify(value, null, 2));
    } else {
        console.log(`\n=== ${label} ===`);
        console.dir(value, { depth: 3, maxArrayLength: 20 });
    }
}

async function loadLatestRun(): Promise<{ items: EnrichedItem[] } | null> {
    const range = getPreviousWeek();
    const file = path.join("data", "runs", range.label, "data.json");
    try {
        const raw = await fs.readFile(file, "utf8");
        return JSON.parse(raw) as { items: EnrichedItem[] };
    } catch {
        return null;
    }
}

async function main(): Promise<void> {
    const range = getPreviousWeek();

    switch (command) {
        case "week":
            out("Previous week", range);
            break;

        case "source:sap":
            out("SAP Community", await collectSapCommunity(range));
            break;
        case "source:dotabap":
            out("dotabap", await collectDotabap(range));
            break;
        case "source:ui5":
            out("bestofui5", await collectBestOfUi5(range));
            break;
        case "source:zeis":
            out("Marian Zeis", await collectMarianZeis(range));
            break;
        case "collect":
            out("Collected (filtered)", await collect(range));
            break;

        case "article": {
            const url = positional[0];
            if (!url) throw new Error("Usage: debug article <url>");
            const text = await fetchArticleText(url);
            out("Article text", text?.slice(0, wantJson ? undefined : 800));
            break;
        }
        case "commits": {
            const repo = positional[0];
            if (!repo) throw new Error("Usage: debug commits <owner/repo>");
            out(`Commits ${repo}`, await fetchCommits(repo, range));
            break;
        }
        case "repo": {
            const repo = positional[0];
            if (!repo) throw new Error("Usage: debug repo <owner/repo>");
            out(`Repo meta ${repo}`, await fetchRepoMeta(repo));
            break;
        }
        case "enrich": {
            const items = await collect(range);
            out("Enriched", await enrichItems(items, range));
            break;
        }

        case "http:json": {
            const url = positional[0];
            if (!url) throw new Error("Usage: debug http:json <url>");
            out("JSON", await fetchJson(url));
            break;
        }
        case "http:text": {
            const url = positional[0];
            if (!url) throw new Error("Usage: debug http:text <url>");
            const text = await fetchText(url);
            out("Text (first 500 chars)", text.slice(0, 500));
            break;
        }

        case "ai:article": {
            const run = await loadLatestRun();
            if (!run)
                throw new Error(
                    "No saved run found. Run `npm run collect` first.",
                );
            out("Article", await writeArticle(run.items, range));
            break;
        }
        case "ai:linkedin": {
            const fakeArticle: GeneratedArticle = {
                title: "SAP Dev Weekly – Test",
                slug: "sap-dev-weekly-test",
                description: "A test article for LinkedIn debugging.",
                body: "## Test",
                tags: ["sap", "test"],
                imageSubject: "SAP development weekly recap",
            };
            out(
                "LinkedIn post",
                await writeLinkedIn(
                    fakeArticle,
                    "https://example.com/posts/test/",
                ),
            );
            break;
        }
        case "ai:thumbnail": {
            const subject = positional[0] ?? "SAP development weekly recap";
            const outDir = path.join("data", "debug", "thumbnails");
            out("Thumbnails", await generateThumbnails(subject, outDir));
            break;
        }

        default:
            console.log(
                (await fs.readFile(new URL(import.meta.url), "utf8"))
                    .split("*/")[0]
                    .replace(/^\/\*\*?/, "")
                    .replace(/^ \* ?/gm, ""),
            );
            process.exit(command ? 1 : 0);
    }
}

main().catch((err) => {
    log.error(
        `Debug failed: ${err instanceof Error ? err.stack : String(err)}`,
    );
    process.exit(1);
});
