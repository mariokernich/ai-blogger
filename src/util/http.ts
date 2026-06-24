import { log } from "./log.js";

const DEFAULT_HEADERS = {
    "User-Agent": "sap-ai-news-bot/1.0 (+https://github.com)",
};

/** Fetch with retries and exponential backoff. */
export async function fetchWithRetry(
    url: string,
    init: RequestInit = {},
    retries = 3,
): Promise<Response> {
    let lastErr: unknown;
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const res = await fetch(url, {
                ...init,
                headers: { ...DEFAULT_HEADERS, ...(init.headers ?? {}) },
            });
            if (res.status === 429 || res.status >= 500) {
                throw new Error(`HTTP ${res.status} for ${url}`);
            }
            return res;
        } catch (err) {
            lastErr = err;
            const wait = 500 * 2 ** (attempt - 1);
            log.warn(
                `fetch failed (attempt ${attempt}/${retries}) ${url} – retry in ${wait}ms`,
            );
            await new Promise((r) => setTimeout(r, wait));
        }
    }
    throw lastErr;
}

export async function fetchJson<T>(
    url: string,
    init?: RequestInit,
): Promise<T> {
    const res = await fetchWithRetry(url, init);
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return (await res.json()) as T;
}

export async function fetchText(
    url: string,
    init?: RequestInit,
): Promise<string> {
    const res = await fetchWithRetry(url, init);
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return await res.text();
}
