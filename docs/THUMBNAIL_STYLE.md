# Thumbnail Style Guide

To keep the blog and LinkedIn visually consistent, **every** generated thumbnail
follows the same rules. The single source of truth lives in
[`src/ai/thumbnail.ts`](../src/ai/thumbnail.ts) (`THUMBNAIL_STYLE`). Only the
weekly **subject** changes; the look stays identical.

## Brand rules

| Aspect | Rule |
|---|---|
| **Palette** | Deep navy `#0a2540`, SAP blue `#0070f2`, cyan accent `#00d2ff`, white |
| **Style** | Modern flat / isometric vector illustration, clean & minimal |
| **Background** | Subtle geometric tech pattern, abstract connected nodes, soft gradients |
| **Motifs** | Cloud, code brackets, dashboards, gears — SAP development themes |
| **Mood** | Professional, trustworthy, innovative, developer-focused |
| **Forbidden** | Real logos, copyrighted marks, photos of real people, **any text/letters** |
| **Composition** | Balanced negative space so a title can be overlaid later |

## Variants

| Variant | Size | Purpose |
|---|---|---|
| `blog` | 1200×630 | Article cover image / Open Graph |
| `linkedin` | 1200×627 | LinkedIn link card |

Both are generated from the **same prompt template** and only differ in the
final crop size (via `sharp`), guaranteeing identical art direction.

## How the prompt is built

```
A wide 16:9 banner thumbnail for a weekly SAP developer news blog.
Theme / subject: <WEEKLY SUBJECT>.
Color palette: <palette>.
Art direction: <artDirection>.
Mood: <mood>.
```

The `<WEEKLY SUBJECT>` comes from the AI article generation step
(`GeneratedArticle.imageSubject`), describing the week's main theme in a few
words.

## Evolving the brand

To change the global look (e.g. new palette or new accent style), edit
`THUMBNAIL_STYLE` in `src/ai/thumbnail.ts`. Because it's the single source of
truth, all future thumbnails update automatically and stay consistent.
