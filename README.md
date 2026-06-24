# SAP Dev Weekly 🤖📰

An **automated, AI-curated weekly blog** for fullstack SAP developers
(**UI5, RAP, BTP, ABAP, Fiori**).

Every Monday at **08:00 Europe/Berlin**, a GitHub Actions cron job:

1. **Collects** data from the *previous week* (Mon–Sun) out of three sources.
2. **Enriches** each item (fetches blog article text & GitHub commits/READMEs).
3. **Filters** to only what matters to the target audience.
4. **Generates** a blog article + LinkedIn post with an OpenAI-compatible model.
5. **Creates** style-consistent thumbnails for the blog and LinkedIn.
6. **Publishes** the article to a **Hugo** site (PaperMod theme) on GitHub Pages
   and posts to **LinkedIn** with a link back to the article.

---

## 🗂️ Project structure

```
sap-ai-news/
├─ src/
│  ├─ index.ts              # CLI entry (collect | run | run --dry-run)
│  ├─ pipeline.ts           # End-to-end orchestrator
│  ├─ config.ts             # Env + source URLs + audience keywords
│  ├─ types.ts              # Shared types
│  ├─ sources/              # Step 1: collect & date-filter
│  │  ├─ sapCommunity.ts    #   SAP Community RSS (blogs)
│  │  ├─ dotabap.ts         #   ABAP projects
│  │  └─ bestOfUi5.ts       #   UI5 projects
│  ├─ enrich/               # Step 2: deep fetch
│  │  ├─ article.ts         #   fetch SAP blog article text
│  │  ├─ github.ts          #   fetch repo commits + README via GitHub API
│  │  ├─ filter.ts          #   audience relevance pre-filter
│  │  └─ index.ts           #   enrichment orchestrator
│  ├─ ai/                   # Step 4 & 5: AI
│  │  ├─ client.ts          #   OpenAI-compatible client
│  │  ├─ digest.ts          #   builds grounding context for the model
│  │  ├─ writer.ts          #   article + LinkedIn generation (+ AI filtering)
│  │  └─ thumbnail.ts       #   image generation + STYLE GUIDE
│  ├─ publish/              # Step 6: publish
│  │  ├─ hugo.ts            #   writes Hugo page bundle + cover image
│  │  └─ linkedin.ts        #   LinkedIn UGC publishing
│  └─ util/                 # dates (prev-week, Berlin TZ), http, log
├─ blog/                    # Hugo site (PaperMod theme as submodule)
├─ .github/workflows/
│  ├─ weekly.yml            # Cron: collect → AI → publish
│  └─ deploy.yml            # Build Hugo + deploy to GitHub Pages
└─ data/runs/<week>/        # Generated artifacts per run (git-ignored)
```

---

## ⚙️ Setup

### 1. Install

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | ✅ | Your OpenAI-compatible API key |
| `OPENAI_BASE_URL` | – | Endpoint (default `https://api.openai.com/v1`) |
| `OPENAI_TEXT_MODEL` | – | Text model (default `gpt-4o`; best: `gpt-5.5-pro`) |
| `OPENAI_IMAGE_MODEL` | – | Image model (default `gpt-image-1`; best EU-safe: `vertex-imagen-4-ultra`) |
| `OPENAI_IMAGE_ENABLED` | – | `false` skips image gen and uses a branded placeholder |
| `GITHUB_TOKEN` | ✅ | For GitHub API (commits/READMEs). In Actions it's built-in |
| `LINKEDIN_ACCESS_TOKEN` | – | OAuth token with `w_member_social` scope |
| `LINKEDIN_AUTHOR_URN` | – | `urn:li:person:xxx` or `urn:li:organization:xxx` |
| `BLOG_BASE_URL` | – | Public blog URL used in the LinkedIn link |

> Without LinkedIn credentials (or with `--dry-run`), the LinkedIn post is
> saved as a draft file instead of being published.

> **Model note:** some endpoints geo-restrict `gpt-image-1` / `dall-e-3`
> (EU project geography). `vertex-imagen-4-ultra` works and accepts the
> `1536x1024` size this app uses. If image generation fails for any reason,
> the pipeline automatically falls back to a branded placeholder.

---

## 🚀 Usage (local)

```bash
# Collect + enrich only (no AI) – inspect data/runs/<week>/data.json
npm run collect

# Full pipeline, but DON'T publish to LinkedIn (draft only)
npm run run:dry

# Full pipeline incl. LinkedIn publishing
npm run run

# Type-check
npm run typecheck
```

Preview the blog locally:

```bash
cd blog && hugo server -D
```

---

## 🕗 The weekly schedule

GitHub Actions cron runs in **UTC**, but Germany switches between CET (UTC+1)
and CEST (UTC+2). The `weekly.yml` workflow schedules **both 06:00 and 07:00 UTC
on Mondays** and a gate step only proceeds when the Europe/Berlin hour is `08`,
so it runs **exactly once at 08:00 German time** year-round.

The "previous week" window is computed in `src/util/dates.ts` as
**Monday 00:00:00 → Sunday 23:59:59 Europe/Berlin**.

---

## 🔐 Required GitHub configuration

In your repository **Settings**:

**Secrets** (`Settings → Secrets and variables → Actions → Secrets`):
- `OPENAI_API_KEY`
- `OPENAI_BASE_URL` *(if not the default OpenAI endpoint)*
- `LINKEDIN_ACCESS_TOKEN` *(optional)*
- `LINKEDIN_AUTHOR_URN` *(optional)*

**Variables** (`… → Variables`):
- `OPENAI_TEXT_MODEL`
- `OPENAI_IMAGE_MODEL`
- `BLOG_BASE_URL`

**Pages** (`Settings → Pages`): set **Source = GitHub Actions**.

> `GITHUB_TOKEN` is provided automatically by Actions — no setup needed.

---

## 🎨 Thumbnails

All thumbnails follow a single **style guide** in
[`src/ai/thumbnail.ts`](src/ai/thumbnail.ts) (`THUMBNAIL_STYLE`) so every image
shares the same palette, composition and mood. Only the *subject* changes each
week. Two variants are produced from one consistent prompt:

- `blog` (1200×630) – article cover / Open Graph image
- `linkedin` (1200×627) – LinkedIn link card

See [`docs/THUMBNAIL_STYLE.md`](docs/THUMBNAIL_STYLE.md) for the full guide.

---

## 🎯 Audience filtering

Content is filtered twice:

1. **Keyword pre-filter** (`src/enrich/filter.ts`) — SAP Community posts must
   mention an audience topic (UI5, RAP, BTP, ABAP, Fiori, CAP, …). dotabap and
   bestofui5 are SAP/ABAP/UI5 by definition and always pass.
2. **AI filter** — the model is instructed to silently drop anything off-topic
   for fullstack SAP developers when writing the article.

Edit the keyword list in `src/config.ts` (`audienceTopics`).

---

## 📄 License

MIT — see source. The PaperMod theme is MIT licensed by its authors.
