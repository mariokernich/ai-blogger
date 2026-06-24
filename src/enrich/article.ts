import { fetchText } from "../util/http.js";
import { log } from "../util/log.js";

/**
 * Fetches a SAP Community blog page and extracts a readable text excerpt.
 * The community pages are heavy HTML; we do a best-effort extraction of the
 * main article body without a full headless browser.
 */
export async function fetchArticleText(
    url: string,
): Promise<string | undefined> {
    try {
        // The community CDN rejects non-browser User-Agents with 403, so
        // present a realistic browser identity for article fetches.
        const html = await fetchText(url, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
                Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
            },
        });

        // Try to grab the lia-message body which holds the blog content.
        const bodyMatch =
            html.match(
                /<div[^>]*class="[^"]*lia-message-body-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
            ) ?? html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);

        const raw = bodyMatch ? bodyMatch[1] : html;
        const text = htmlToText(raw);
        return text.slice(0, 4000);
    } catch (err) {
        log.warn(`Could not fetch article ${url}: ${(err as Error).message}`);
        return undefined;
    }
}

function htmlToText(html: string): string {
    return html
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<\/(p|div|li|h[1-6]|br)>/gi, "\n")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&#39;|&apos;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}
