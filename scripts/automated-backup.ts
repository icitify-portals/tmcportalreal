import { db } from "../lib/db"
import { backups, roles, userRoles } from "../lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3"
import { exec } from "child_process"
import { promisify } from "util"
import path from "path"
import fs from "fs/promises"

const execAsync = promisify(exec)

// S3 Configuration
const S3_REGION = process.env.WASABI_REGION || "us-east-1"
const S3_BUCKET = process.env.WASABI_BUCKET_NAME || process.env.AWS_BUCKET_NAME
const S3_ACCESS_KEY = process.env.WASABI_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID
const S3_SECRET_KEY = process.env.WASABI_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY
const S3_ENDPOINT = process.env.WASABI_ENDPOINT || process.env.AWS_ENDPOINT

const s3Client = (S3_ACCESS_KEY && S3_SECRET_KEY)
    ? new S3Client({
        region: S3_REGION,
        credentials: {
            accessKeyId: S3_ACCESS_KEY,
            secretAccessKey: S3_SECRET_KEY
        },
        endpoint: S3_ENDPOINT,
        forcePathStyle: true,
    })
    : null

async function cleanupOldBackups() {
    console.log("Starting cleanup of old backups...");

    // 1. Local Retention (5 Days)
    const localArchiveDir = path.join(process.cwd(), 'backups', 'archive');
    try {
        const files = await fs.readdir(localArchiveDir);
        const now = Date.now();
        const localRetentionMs = 5 * 24 * 60 * 60 * 1000;

        for (const file of files) {
            const filePath = path.join(localArchiveDir, file);
            const stats = await fs.stat(filePath);
            if (now - stats.mtimeMs > localRetentionMs) {
                console.log(`Deleting old local backup: ${file}`);
                await fs.unlink(filePath);
            }
        }
    } catch (e) {
        console.warn("Local cleanup skipped or failed (likely no archive yet).");
    }

    // 2. Wasabi Retention (14 Days)
    if (s3Client && S3_BUCKET) {
        try {
            const now = new Date();
            const cloudRetentionMs = 14 * 24 * 60 * 60 * 1000;
            
            const listResponse = await s3Client.send(new ListObjectsV2Command({
                Bucket: S3_BUCKET,
                Prefix: "backups/"
            }));

            if (listResponse.Contents && listResponse.Contents.length > 0) {
                const objectsToDelete = listResponse.Contents
                    .filter(obj => {
                        if (!obj.LastModified) return false;
                        return (now.getTime() - obj.LastModified.getTime()) > cloudRetentionMs;
                    })
                    .map(obj => ({ Key: obj.Key }));

                if (objectsToDelete.length > 0) {
                    console.log(`Deleting ${objectsToDelete.length} old objects from Wasabi...`);
                    await s3Client.send(new DeleteObjectsCommand({
                        Bucket: S3_BUCKET,
                        Delete: { Objects: objectsToDelete }
                    }));
                }
            }
        } catch (e) {
            console.error("Wasabi cleanup failed:", e);
        }
    }
}

async function runAutomatedBackup() {
    console.log("Starting automated backup...");
    
    // 1. Identify a Superadmin
    const superAdminRole = await db.query.roles.findFirst({
        where: eq(roles.code, "SUPER_ADMIN")
    });

    if (!superAdminRole) {
        console.error("SUPER_ADMIN role not found.");
        process.exit(1);
    }

    const firstSuperAdminRelation = await db.query.userRoles.findFirst({
        where: eq(userRoles.roleId, superAdminRole.id)
    });
    
    if (!firstSuperAdminRelation) {
        console.error("No user found with SUPER_ADMIN role.");
        process.exit(1);
    }

    const superAdminId = firstSuperAdminRelation.userId;

    const timestamp = Date.now()
    const backupId = `auto-${timestamp}`
    const tempDir = path.join(process.cwd(), 'tmp', backupId)
    const dbFile = path.join(tempDir, `db-${timestamp}.sql`)
    const zipFile = path.join(tempDir, `files-${timestamp}.zip`)
    
    const localArchiveDir = path.join(process.cwd(), 'backups', 'archive');

    try {
        await fs.mkdir(tempDir, { recursive: true });
        await fs.mkdir(localArchiveDir, { recursive: true });

        // 2. Database Dump
        const dbUrl = process.env.DATABASE_URL || ""
        const parsedUrl = new URL(dbUrl);
        const user = decodeURIComponent(parsedUrl.username);
        const pass = decodeURIComponent(parsedUrl.password);
        const host = parsedUrl.hostname;
        const port = parsedUrl.port || "3306";
        const dbName = decodeURIComponent(parsedUrl.pathname.substring(1));

        console.log(`Dumping database ${dbName}...`);
        const passArg = pass ? `-p'${pass}'` : '';
        await execAsync(`mysqldump -u ${user} ${passArg} -h ${host} -P ${port} ${dbName} > ${dbFile}`);
        console.log("Database dump successful.");

        // 3. Zip Uploads
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
        console.log("Zipping uploads directory...");
        try {
            await fs.access(uploadsDir);
            await execAsync(`zip -r ${zipFile} ${uploadsDir}`)
            console.log("Files zipped successfully.");
        } catch (err) {
            console.warn("Uploads directory missing or zip failed, sending info as files.zip");
            await fs.writeFile(zipFile, "uploads missing or zip failed at " + new Date().toISOString());
        }

        // 4. Persistence & Upload
        let databaseUrl = ""
        let filesUrl = ""

        // Copy to local archive (Persistent)
        const persistentDbPath = path.join(localArchiveDir, `db-${timestamp}.sql`);
        const persistentZipPath = path.join(localArchiveDir, `files-${timestamp}.zip`);
        await fs.copyFile(dbFile, persistentDbPath);
        await fs.copyFile(zipFile, persistentZipPath);
        console.log(`Local backup archived to ${localArchiveDir}`);

        // Upload to Cloud
        if (s3Client && S3_BUCKET) {
            console.log("Uploading to Wasabi...");
            const dbBuffer = await fs.readFile(dbFile)
            const zipBuffer = await fs.readFile(zipFile)

            await s3Client.send(new PutObjectCommand({
                Bucket: S3_BUCKET,
                Key: `backups/${backupId}/database.sql`,
                Body: dbBuffer,
                ACL: 'private'
            }))
            
            await s3Client.send(new PutObjectCommand({
                Bucket: S3_BUCKET,
                Key: `backups/${backupId}/files.zip`,
                Body: zipBuffer,
                ACL: 'private'
            }))

            databaseUrl = `s3://${S3_BUCKET}/backups/${backupId}/database.sql`
            filesUrl = `s3://${S3_BUCKET}/backups/${backupId}/files.zip`
            console.log("Cloud upload successful.");
        }

        // 5. Cleanup Old Backups (Retention)
        await cleanupOldBackups();

        // 6. Save Record to DB
        console.log("Saving backup record to database...");
        const dbStat = await fs.stat(dbFile);
        const zipStat = await fs.stat(zipFile);
        
        await db.insert(backups).values({
            name: `backup-${timestamp}`,
            type: 'AUTOMATED',
            databaseUrl,
            filesUrl,
            status: 'COMPLETED',
            size: dbStat.size + zipStat.size,
            createdBy: superAdminId
        })

        console.log("Automated backup completed successfully!");
    } catch (error) {
        console.error("CRITICAL: Backup process failed:", error)
        try {
            await db.insert(backups).values({
                name: `failed-backup-${timestamp}`,
                type: 'AUTOMATED',
                status: 'FAILED',
                size: 0,
                createdBy: superAdminId
            })
        } catch (e) {}
        process.exit(1);
    } finally {
        // Cleanup temp files
        console.log("Cleaning up temporary work directory...");
        try {
            await fs.rm(tempDir, { recursive: true, force: true })
        } catch (e) {}
    }
}

runAutomatedBackup().then(() => {
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
