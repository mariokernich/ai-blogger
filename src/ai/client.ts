import OpenAI from "openai";
import { config } from "../config.js";

let client: OpenAI | null = null;

export function getOpenAI(): OpenAI {
    if (!client) {
        config.requireOpenAI(); // throws if no key
        client = new OpenAI({
            apiKey: config.openai.apiKey,
            baseURL: config.openai.baseUrl,
            timeout: config.openai.timeoutMs,
            maxRetries: config.openai.maxRetries,
        });
    }
    return client;
}
