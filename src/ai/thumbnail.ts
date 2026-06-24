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
    await fs.mkdir(outDir, { recursive: true });

    const result = {} as Record<ThumbnailVariant["name"], string>;

    for (const variant of THUMBNAIL_VARIANTS) {
        const outPath = path.join(outDir, `${variant.name}.png`);
        const buffer = await renderThumbnail(subject, variant);

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

/**
 * Returns a raw image buffer for a thumbnail. Tries the AI image model first;
 * if image generation is disabled or fails, falls back to a branded SVG
 * placeholder so the pipeline can always complete.
 */
async function renderThumbnail(
    subject: string,
    variant: ThumbnailVariant,
): Promise<Buffer> {
    if (!config.openai.imageEnabled) {
        log.warn(
            `Image generation disabled (OPENAI_IMAGE_ENABLED=false): using placeholder for ${variant.name}.`,
        );
        return renderPlaceholder(subject, variant);
    }

    try {
        const openai = getOpenAI();
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
        if (b64) return Buffer.from(b64, "base64");
        if (url) {
            const res = await fetch(url);
            return Buffer.from(await res.arrayBuffer());
        }
        throw new Error("Image API returned no image data");
    } catch (err) {
        log.warn(
            `Image generation failed for ${variant.name} (${(err as Error).message}). Falling back to placeholder.`,
        );
        return renderPlaceholder(subject, variant);
    }
}

/**
 * Renders a clean, on-brand SVG placeholder (rendered to PNG by sharp) using
 * the same palette as the style guide. No external API required.
 */
function renderPlaceholder(subject: string, variant: ThumbnailVariant): Buffer {
    const w = variant.width;
    const h = variant.height;
    const safeSubject = escapeXml(subject).slice(0, 80);
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0a2540"/>
      <stop offset="60%" stop-color="#0070f2"/>
      <stop offset="100%" stop-color="#00d2ff"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <g fill="none" stroke="#ffffff" stroke-opacity="0.12" stroke-width="2">
    <circle cx="${w * 0.82}" cy="${h * 0.25}" r="120"/>
    <circle cx="${w * 0.9}" cy="${h * 0.7}" r="180"/>
    <line x1="${w * 0.82}" y1="${h * 0.25}" x2="${w * 0.9}" y2="${h * 0.7}"/>
  </g>
  <text x="64" y="${h * 0.42}" font-family="Segoe UI, Helvetica, Arial, sans-serif"
        font-size="${Math.round(h * 0.07)}" font-weight="700" fill="#ffffff" opacity="0.92">
    SAP Dev Weekly
  </text>
  <text x="64" y="${h * 0.58}" font-family="Segoe UI, Helvetica, Arial, sans-serif"
        font-size="${Math.round(h * 0.045)}" font-weight="400" fill="#dceeff" opacity="0.9">
    ${safeSubject}
  </text>
</svg>`;
    return Buffer.from(svg);
}

function escapeXml(s: string): string {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}
