import { collectOnly, run } from "./pipeline.js";
import { log } from "./util/log.js";

async function main(): Promise<void> {
    const [, , command, ...args] = process.argv;
    const dryRun = args.includes("--dry-run");

    switch (command) {
        case "collect":
            await collectOnly();
            break;
        case "run":
        case "generate":
            await run({ dryRun });
            break;
        default:
            console.log(`Usage: tsx src/index.ts <command> [--dry-run]

Commands:
  collect           Collect + enrich data only (no AI), writes data/runs/<week>/data.json
  run               Full pipeline: collect -> AI article -> thumbnails -> publish blog + LinkedIn
  run --dry-run     Full pipeline but does NOT publish to LinkedIn (saves draft only)
  generate          Alias for run
`);
            process.exit(command ? 1 : 0);
    }
}

main().catch((err) => {
    log.error(`Fatal: ${err instanceof Error ? err.stack : String(err)}`);
    process.exit(1);
});
