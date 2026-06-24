/** A normalized item collected from any source before enrichment. */
export interface RawItem {
  source: 'sap-community' | 'dotabap' | 'bestofui5';
  title: string;
  url: string;
  /** ISO timestamp used for the week filter. */
  publishedAt: string;
  /** Short description / summary if available. */
  summary?: string;
  author?: string;
  /** Tags/categories from the source. */
  tags?: string[];
  /** GitHub repo in "owner/name" form, if this item maps to a repo. */
  repo?: string;
}

/** A commit summary fetched from GitHub. */
export interface CommitInfo {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

/** An item enriched with full content / commits, ready for the AI. */
export interface EnrichedItem extends RawItem {
  /** Full article text (SAP community) or README excerpt (repos). */
  content?: string;
  /** Recent commits in the target week (dotabap / bestofui5). */
  commits?: CommitInfo[];
  stars?: number;
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
