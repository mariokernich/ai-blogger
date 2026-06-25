/** A normalized item collected from any source before enrichment. */
export interface RawItem {
  source:
    | "sap-community"
    | "dotabap"
    | "bestofui5"
    | "bestofcap"
    | "marian-zeis"
    | "its-full-of-stars"
    | "ui5-changelog";
  title: string;
  url: string;
  /** ISO timestamp used for the week filter. */
  publishedAt: string;
  /** Short description / summary if available. */
  summary?: string;
  author?: string;
  /** GitHub repo in "owner/name" form, if this item maps to a repo. */
  repo?: string;
}

/** An item enriched with full content / commits, ready for the AI. */
export interface EnrichedItem extends RawItem {
  /** Full article text (SAP community) or README excerpt (repos). */
  content?: string;
  /** Recent commit messages in the target week (dotabap / bestofui5 / bestofcap). */
  commits?: string[];
  /** Release names/tags published in the target week. */
  releases?: string[];
}

export interface DateRange {
  /** Monday 00:00:00 of the previous week (ISO). */
  start: string;
  /** Sunday 23:59:59 of the previous week (ISO). */
  end: string;
  /** ISO week label like "2026-W25". */
  label: string;
}

export interface GeneratedArticle {
  title: string;
  /** URL-safe slug. */
  slug: string;
  /** One-line summary / description for front matter. */
  description: string;
  /** Markdown body (without front matter). */
  body: string;
  tags: string[];
  /** AI image prompt subject used for the thumbnail. */
  imageSubject: string;
}

export interface GeneratedLinkedIn {
  text: string;
}
