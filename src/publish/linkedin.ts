import { promises as fs } from "node:fs";
import { config } from "../config.js";
import type { GeneratedLinkedIn } from "../types.js";
import { log } from "../util/log.js";

const LINKEDIN_API = "https://api.linkedin.com/v2";

/**
 * Publishes a LinkedIn post with an uploaded image and a link to the article.
 * Requires LINKEDIN_ACCESS_TOKEN (w_member_social) and LINKEDIN_AUTHOR_URN.
 *
 * If credentials are missing or dryRun is set, the post is saved to disk only.
 */
export async function publishToLinkedIn(
    post: GeneratedLinkedIn,
    imagePath: string,
    draftPath: string,
    dryRun: boolean,
): Promise<{ published: boolean; draftPath: string }> {
    log.step("Publishing LinkedIn post");
    await fs.writeFile(draftPath, post.text, "utf8");

    if (dryRun || !config.linkedin.enabled) {
        log.warn(
            dryRun
                ? "Dry run: LinkedIn post saved as draft, not published."
                : "LinkedIn credentials missing: saved draft only.",
        );
        return { published: false, draftPath };
    }

    const token = config.linkedin.accessToken;
    const author = config.linkedin.authorUrn;

    // 1) Register the image upload.
    const asset = await registerUpload(token, author);

    // 2) Upload the binary.
    await uploadImage(asset.uploadUrl, imagePath, token);

    // 3) Create the UGC post referencing the image asset.
    await createPost(token, author, post.text, asset.assetUrn);

    log.ok("LinkedIn post published");
    return { published: true, draftPath };
}

interface RegisterResult {
    uploadUrl: string;
    assetUrn: string;
}

async function registerUpload(
    token: string,
    author: string,
): Promise<RegisterResult> {
    const res = await fetch(`${LINKEDIN_API}/assets?action=registerUpload`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({
            registerUploadRequest: {
                recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
                owner: author,
                serviceRelationships: [
                    {
                        relationshipType: "OWNER",
                        identifier: "urn:li:userGeneratedContent",
                    },
                ],
            },
        }),
    });
    if (!res.ok)
        throw new Error(
            `LinkedIn registerUpload failed: ${res.status} ${await res.text()}`,
        );
    const json = (await res.json()) as {
        value: {
            asset: string;
            uploadMechanism: {
                "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest": {
                    uploadUrl: string;
                };
            };
        };
    };
    return {
        assetUrn: json.value.asset,
        uploadUrl:
            json.value.uploadMechanism[
                "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
            ].uploadUrl,
    };
}

async function uploadImage(
    uploadUrl: string,
    imagePath: string,
    token: string,
): Promise<void> {
    const data = await fs.readFile(imagePath);
    const res = await fetch(uploadUrl, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "image/png",
        },
        body: data,
    });
    if (!res.ok) throw new Error(`LinkedIn image upload failed: ${res.status}`);
}

async function createPost(
    token: string,
    author: string,
    text: string,
    assetUrn: string,
): Promise<void> {
    const res = await fetch(`${LINKEDIN_API}/ugcPosts`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({
            author,
            lifecycleState: "PUBLISHED",
            specificContent: {
                "com.linkedin.ugc.ShareContent": {
                    shareCommentary: { text },
                    shareMediaCategory: "IMAGE",
                    media: [
                        {
                            status: "READY",
                            media: assetUrn,
                        },
                    ],
                },
            },
            visibility: {
                "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
            },
        }),
    });
    if (!res.ok)
        throw new Error(
            `LinkedIn createPost failed: ${res.status} ${await res.text()}`,
        );
}

function authHeaders(token: string): Record<string, string> {
    return {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
    };
}
