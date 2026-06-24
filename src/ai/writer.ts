import type {
    DateRange,
    EnrichedItem,
    GeneratedArticle,
    GeneratedLinkedIn,
} from "../types.js";
import { config } from "../config.js";
import { getOpenAI } from "./client.js";
import { buildDigest } from "./digest.js";
import { log } from "../util/log.js";

const AUDIENCE =
    "fullstack SAP developers working with SAPUI5/OpenUI5, RAP (RESTful ABAP Programming Model), " +
    "SAP BTP, ABAP / ABAP Cloud, CAP, and SAP Fiori / Fiori Elements";

const SYSTEM_PROMPT = `You are a senior technical editor writing a weekly newsletter-style blog for ${AUDIENCE}.

Rules:
- ONLY include topics relevant to the audience. Silently DROP anything off-topic (e.g. SAP HR/SuccessFactors UX tips, generic finance/basis content, marketing posts) that does not help a fullstack SAP developer.
- Focus on what is NOTEWORTHY. Silently SKIP low-signal noise: dependency bumps (e.g. "update dependency X to vY"), version-bump-only releases, small bug fixes, typo fixes, minor refactors, formatting/lint/CI/test-only changes, README tweaks, and "chore" commits. Do NOT list these.
- For each repo, only call out genuinely meaningful work: new features, new plugins/tools, breaking changes, major version releases, architecture changes, or new capabilities. If a repo only had trivial changes this week, OMIT it entirely rather than padding the article.
- If, after filtering, an entire section has nothing noteworthy, drop the whole section. Quality over quantity — a shorter, high-signal article is better than a long one full of minor changes.
- Be concrete and technical. Reference the actual blog posts and repositories provided. Always keep their URLs as markdown links.
- Group content into clear sections (e.g. "SAP Community Highlights", "ABAP Open Source", "UI5 Ecosystem").
- Summarize what changed/why it matters; for repos, mention notable commits/features only.
- Never invent facts, repos, links, or commits. Only use what is in the provided digest.
- Write in an engaging but professional tone. Use markdown (##, ###, bullet lists, bold).
- Output language: English.`;

interface ArticleJson {
    title: string;
    description: string;
    tags: string[];
    imageSubject: string;
    body: string;
}

export async function writeArticle(
    items: EnrichedItem[],
    range: DateRange,
): Promise<GeneratedArticle> {
    log.step("Generating blog article with AI");
    const openai = getOpenAI();
    const digest = buildDigest(items);

    const userPrompt = `Week: ${range.label} (${range.start.slice(0, 10)} to ${range.end.slice(0, 10)})

Below is the curated digest of everything collected this week. Write the weekly blog article.

Return STRICT JSON with this shape:
{
  "title": "string – catchy, includes the week, e.g. 'SAP Dev Weekly – Week 25/2026'",
  "description": "string – 1-2 sentence SEO summary (max 160 chars)",
  "tags": ["lowercase", "topic", "tags"],
  "imageSubject": "string – short visual subject for a thumbnail, describing the week's main theme in 5-10 words",
  "body": "string – the full article body in MARKDOWN (no front matter, no title H1, start with an intro paragraph then ## sections)"
}

DIGEST:
${digest}`;

    const res = await openai.chat.completions.create({
        model: config.openai.textModel,
        temperature: 0.6,
        max_tokens: 8000,
        response_format: { type: "json_object" },
        messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
        ],
    });

    const choice = res.choices[0];
    if (choice?.finish_reason === "length") {
        log.warn(
            "Article response hit the token limit and may be truncated; consider raising OPENAI max_tokens.",
        );
    }

    const json = parseJson<ArticleJson>(choice?.message?.content ?? "{}");
    const title = json.title?.trim() || `SAP Dev Weekly – ${range.label}`;

    log.ok(`Article generated: "${title}"`);
    return {
        title,
        slug: slugify(`${range.label}-${title}`),
        description: (json.description ?? "").trim(),
        body: (json.body ?? "").trim(),
        tags: dedupe([...(json.tags ?? []), "sap", "weekly"]),
        imageSubject:
            json.imageSubject?.trim() || "SAP development weekly recap",
    };
}

export async function writeLinkedIn(
    article: GeneratedArticle,
    articleUrl: string,
): Promise<GeneratedLinkedIn> {
    log.step("Generating LinkedIn post with AI");
    const openai = getOpenAI();

    const res = await openai.chat.completions.create({
        model: config.openai.textModel,
        temperature: 0.7,
        messages: [
            {
                role: "system",
                content: `You write concise, engaging LinkedIn posts for ${AUDIENCE}. Use a strong hook, 3-5 short bullet highlights with relevant emojis, and a clear call to action to read the full article. Add 3-6 relevant hashtags at the end (e.g. #SAP #SAPUI5 #ABAP #SAPBTP #Fiori). Keep it under 1300 characters. Do NOT use markdown.`,
            },
            {
                role: "user",
                content: `Article title: ${article.title}
Article description: ${article.description}
Article URL: ${articleUrl}

Write the LinkedIn post. Include the URL near the call to action.`,
            },
        ],
    });

    const text = (res.choices[0]?.message?.content ?? "").trim();
    log.ok("LinkedIn post generated");
    return { text };
}

function parseJson<T>(raw: string): T {
    const text = raw.trim();

    // 1. Happy path.
    try {
        return JSON.parse(text) as T;
    } catch {
        // continue
    }

    // 2. Strip ```json fences and try the largest {...} block.
    const unfenced = text
        .replace(/^```(?:json)?/i, "")
        .replace(/```$/i, "")
        .trim();
    const match = unfenced.match(/\{[\s\S]*\}/);
    if (match) {
        try {
            return JSON.parse(match[0]) as T;
        } catch {
            // continue
        }
    }

    // 3. Last resort: try to repair a truncated JSON object (e.g. the model
    //    was cut off mid-string). Close an open string and any open braces.
    const repaired = repairTruncatedJson(match ? match[0] : unfenced);
    if (repaired) {
        try {
            return JSON.parse(repaired) as T;
        } catch {
            // continue
        }
    }

    log.warn(
        `AI returned unparseable JSON (first 200 chars): ${text.slice(0, 200)}`,
    );
    throw new Error("AI did not return valid JSON");
}

/**
 * Best-effort repair of JSON that was cut off mid-output: terminate an
 * unterminated string and balance braces/brackets so JSON.parse can succeed.
 */
function repairTruncatedJson(s: string): string | null {
    if (!s) return null;
    let inString = false;
    let escaped = false;
    const stack: string[] = [];

    for (const ch of s) {
        if (escaped) {
            escaped = false;
            continue;
        }
        if (ch === "\\") {
            if (inString) escaped = true;
            continue;
        }
        if (ch === '"') {
            inString = !inString;
            continue;
        }
        if (inString) continue;
        if (ch === "{" || ch === "[") stack.push(ch);
        else if (ch === "}" || ch === "]") stack.pop();
    }

    let out = s;
    if (inString) out += '"';
    while (stack.length) {
        out += stack.pop() === "{" ? "}" : "]";
    }
    return out === s && !inString ? null : out;
}

function slugify(s: string): string {
    return s
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 80);
}

function dedupe(arr: string[]): string[] {
    return [...new Set(arr.map((s) => s.toLowerCase().trim()).filter(Boolean))];
}
