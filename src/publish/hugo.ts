import { promises as fs } from "node:fs";
import path from "node:path";
import { config } from "../config.js";
import type { GeneratedArticle } from "../types.js";
import { log } from "../util/log.js";

export interface PublishResult {
    postDir: string;
    indexPath: string;
    /** Public URL of the published post. */
    url: string;
}

/**
 * Writes a Hugo "page bundle" post:
 *   blog/content/posts/<slug>/index.md
 *   blog/content/posts/<slug>/thumbnail.png   (blog cover)
 *
 * Uses PaperMod front matter (cover image, tags, etc.).
 */
export async function publishToHugo(
    article: GeneratedArticle,
    blogThumbnailPath: string,
    date: Date = new Date(),
): Promise<PublishResult> {
    log.step("Publishing article to Hugo");

    const postDir = path.join(
        config.blog.dir,
        "content",
        "posts",
        article.slug,
    );
    await fs.mkdir(postDir, { recursive: true });

    // Copy the blog cover image into the bundle.
    const coverName = "thumbnail.png";
    await fs.copyFile(blogThumbnailPath, path.join(postDir, coverName));

    const frontMatter = buildFrontMatter(article, coverName, date);
    const indexPath = path.join(postDir, "index.md");
    await fs.writeFile(
        indexPath,
        `${frontMatter}\n\n${article.body}\n`,
        "utf8",
    );

    const url = `${config.blog.baseUrl.replace(/\/$/, "")}/posts/${article.slug}/`;
    log.ok(`Hugo post written -> ${indexPath}`);
    return { postDir, indexPath, url };
}

function buildFrontMatter(
    article: GeneratedArticle,
    coverImage: string,
    date: Date,
): string {
    const tags = article.tags.map((t) => `  - "${escapeYaml(t)}"`).join("\n");
    return [
        "---",
        `title: "${escapeYaml(article.title)}"`,
        `date: ${date.toISOString()}`,
        "draft: false",
        `description: "${escapeYaml(article.description)}"`,
        "tags:",
        tags,
        "cover:",
        `  image: "${coverImage}"`,
        `  alt: "${escapeYaml(article.imageSubject)}"`,
        `  caption: "${escapeYaml(article.title)}"`,
        "  relative: true",
        "ShowToc: true",
        "TocOpen: false",
        "---",
    ].join("\n");
}

function escapeYaml(s: string): string {
    return s.replace(/"/g, '\\"');
}
