
import 'dotenv/config';
import { db } from "@/lib/db";
import { organizations, posts, galleries } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { format } from "date-fns";

async function main() {
    console.log('🔍 Debugging Page Logic...');

    try {
        // 1. Fetch National Org
        const nationalOrg = await db.query.organizations.findFirst({
            where: eq(organizations.level, "NATIONAL"),
        });

        if (!nationalOrg) {
            console.log("❌ National Org not found");
            return;
        }
        console.log("✅ Found National Org:", nationalOrg.name);
        console.log("Org CreatedAt:", nationalOrg.createdAt, typeof nationalOrg.createdAt);
        if (nationalOrg.createdAt) {
            try {
                console.log("Formatted Org Date:", format(new Date(nationalOrg.createdAt), 'MMM d, yyyy'));
            } catch (e) {
                console.error("❌ Failed to format Org Date:", e);
            }
        }

        // 2. Fetch Posts (NewsFeed)
        console.log("Fetching posts...");
        const postsData = await db.query.posts.findMany({
            where: eq(posts.organizationId, nationalOrg.id),
            orderBy: [desc(posts.createdAt)],
            limit: 3,
        });
        console.log(`Found ${postsData.length} posts`);

        for (const post of postsData) {
            console.log(`Post: ${post.title}, CreatedAt: ${post.createdAt}`);
            try {
                if (post.createdAt) {
                    console.log("Formatted Post Date:", format(new Date(post.createdAt), 'MMM d, yyyy'));
                }
            } catch (e) {
                console.error(`❌ Failed to format Post ${post.id} Date:`, e);
            }
        }

        // 3. Fetch Galleries
        const rawGalleries = await db.query.galleries.findMany({
            where: eq(galleries.organizationId, nationalOrg.id),
            limit: 1
        });
        console.log(`Found ${rawGalleries.length} galleries`);

    } catch (error) {
        console.error("❌ Script Error:", error);
    }
}

main();
