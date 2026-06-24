import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { config } from "../config.js";
import { getOpenAI } from "./client.js";
import { log } from "../util/log.js";

/**
 * ============================================================
 *  THUMBNAIL STYLE GUIDE  (single source of truth)
 * ------------------------------------------------------------
 *  Keep every generated image visually consistent: same palette,
 *  same composition language, same mood. Only the SUBJECT changes
 *  per week. Edit STYLE here to evolve the brand look.
 * ============================================================
 */
export const THUMBNAIL_STYLE = {
    /** Brand palette – SAP-inspired blues with a clean modern accent. */
    palette:
        "deep navy (#0a2540), SAP blue (#0070f2), cyan accent (#00d2ff), white text",
    /** Consistent art direction shared by blog + linkedin. */
    artDirection: [
        "modern flat vector illustration, clean and minimal",
        "subtle geometric tech background with abstract connected nodes and soft gradients",
        "isometric or flat icons representing SAP development (cloud, code brackets, dashboards, gears)",
        "high contrast, professional, enterprise software aesthetic",
        "no real logos, no copyrighted brand marks, no real photographs of people",
        "no text, no words, no letters in the image",
        "balanced negative space so an overlaid title can be added later",
    ].join("; "),
    mood: "professional, trustworthy, innovative, developer-focused",
} as const;

export interface ThumbnailVariant {
    /** Logical name. */
    name: "blog" | "linkedin";
    /** Output width x height. */
    width: number;
    height: number;
}

export const THUMBNAIL_VARIANTS: ThumbnailVariant[] = [
    { name: "blog", width: 1200, height: 630 }, // OG / cover image
    { name: "linkedin", width: 1200, height: 627 }, // LinkedIn link card
];

function buildPrompt(subject: string, variant: ThumbnailVariant): string {
    const orientation =
        variant.name === "blog"
            ? "wide 16:9 banner composition"
            : "wide social card composition";
    return [
        `A ${orientation} thumbnail for a weekly SAP developer news blog.`,
        `Theme / subject: ${subject}.`,
        `Color palette: ${THUMBNAIL_STYLE.palette}.`,
        `Art direction: ${THUMBNAIL_STYLE.artDirection}.`,
        `Mood: ${THUMBNAIL_STYLE.mood}.`,
    ].join(" ");
}

/**
 * Generates style-consistent thumbnails (blog + linkedin) for the given
 * subject and writes PNG files to outDir. Returns the file paths.
 */
export async function generateThumbnails(
    subject: string,
    outDir: string,
): Promise<Record<ThumbnailVariant["name"], string>> {
    log.step("Generating thumbnails");
    const openai = getOpenAI();
    await fs.mkdir(outDir, { recursive: true });

    const result = {} as Record<ThumbnailVariant["name"], string>;

    for (const variant of THUMBNAIL_VARIANTS) {
        const prompt = buildPrompt(subject, variant);
        log.info(`Image (${variant.name}) prompt: ${prompt.slice(0, 90)}…`);

        const img = await openai.images.generate({
            model: config.openai.imageModel,
            prompt,
            size: "1536x1024",
            n: 1,
        });

        const b64 = img.data?.[0]?.b64_json;
        const url = img.data?.[0]?.url;
        let buffer: Buffer;
        if (b64) {
            buffer = Buffer.from(b64, "base64");
        } else if (url) {
            const res = await fetch(url);
            buffer = Buffer.from(await res.arrayBuffer());
        } else {
            throw new Error("Image API returned no image data");
        }

        const outPath = path.join(outDir, `${variant.name}.png`);
        await sharp(buffer)
            .resize(variant.width, variant.height, {
                fit: "cover",
                position: "center",
            })
            .png({ quality: 90 })
            .toFile(outPath);

        result[variant.name] = outPath;
        log.ok(`Saved ${variant.name} thumbnail -> ${outPath}`);
    }

    return result;
}
