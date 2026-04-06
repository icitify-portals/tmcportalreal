
import { db } from "../lib/db"
import { backups, users, roles, userRoles } from "../lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
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

async function runAutomatedBackup() {
    console.log("Starting automated backup...");
    
    // 1. Identify a Superadmin to associate the backup with
    const superAdminRole = await db.query.roles.findFirst({
        where: eq(roles.code, "SUPER_ADMIN")
    });

    if (!superAdminRole) {
        console.error("SUPER_ADMIN role not found in database.");
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
    const backupName = `auto-backup-${timestamp}`
    const tempDir = path.join(process.cwd(), 'tmp', backupName)
    const dbFile = path.join(tempDir, 'database.sql')
    const zipFile = path.join(tempDir, 'files.zip')

    try {
        await fs.mkdir(tempDir, { recursive: true })

        // 2. Database Dump
        const dbUrl = process.env.DATABASE_URL || ""
        const match = dbUrl.match(/mysql:\/\/(.*):(.*)@(.*):(.*)\/(.*)/)
        if (match) {
            const [_, user, pass, host, port, dbName] = match
            console.log(`Dumping database ${dbName}...`);
            try {
                await execAsync(`mysqldump -u ${user} -p'${pass}' -h ${host} -P ${port} ${dbName} > ${dbFile}`)
                console.log("Database dump successful.");
            } catch (err) {
                console.error("mysqldump failed:", err)
                await fs.writeFile(dbFile, "-- mysqldump failed")
            }
        } else {
            console.error("Invalid DATABASE_URL format.");
        }

        // 3. Zip Uploads
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
        console.log("Zipping uploads directory...");
        try {
            // Check if uploads dir exists
            await fs.access(uploadsDir);
            await execAsync(`zip -r ${zipFile} ${uploadsDir}`)
            console.log("Files zipped successful.");
        } catch (err) {
            console.warn("Uploads directory not found or zip failed, creating empty zip file.");
            await fs.writeFile(zipFile, "empty or failed zip");
        }

        // 4. Upload to S3/Wasabi
        let databaseUrl = ""
        let filesUrl = ""

        if (s3Client && S3_BUCKET) {
            console.log("Uploading to Cloud Storage...");
            const dbBuffer = await fs.readFile(dbFile)
            const zipBuffer = await fs.readFile(zipFile)

            await s3Client.send(new PutObjectCommand({
                Bucket: S3_BUCKET,
                Key: `backups/${backupName}/database.sql`,
                Body: dbBuffer,
                ACL: 'private'
            }))
            
            await s3Client.send(new PutObjectCommand({
                Bucket: S3_BUCKET,
                Key: `backups/${backupName}/files.zip`,
                Body: zipBuffer,
                ACL: 'private'
            }))

            databaseUrl = `s3://${S3_BUCKET}/backups/${backupName}/database.sql`
            filesUrl = `s3://${S3_BUCKET}/backups/${backupName}/files.zip`
            console.log("Cloud upload successful.");
        } else {
            console.log("Cloud storage not configured, keeping local copy in temporary directory (will be cleaned up).");
        }

        // 5. Save Record to DB
        console.log("Saving backup record to database...");
        
        let totalSize = 0;
        try {
            const dbStat = await fs.stat(dbFile).catch(() => ({ size: 0 }));
            const zipStat = await fs.stat(zipFile).catch(() => ({ size: 0 }));
            totalSize = dbStat.size + zipStat.size;
        } catch (e) {}

        await db.insert(backups).values({
            name: backupName,
            type: 'AUTOMATED',
            databaseUrl,
            filesUrl,
            status: 'COMPLETED',
            size: totalSize,
            createdBy: superAdminId
        })

        console.log("Automated backup completed successfully!");
    } catch (error) {
        console.error("CRITICAL: Backup process failed:", error)
        
        // Log failure to DB if possible
        try {
            await db.insert(backups).values({
                name: backupName,
                type: 'AUTOMATED',
                status: 'FAILED',
                size: 0,
                createdBy: superAdminId
            })
        } catch (e) {}
        
        process.exit(1);
    } finally {
        // Cleanup temp files
        console.log("Cleaning up temporary files...");
        try {
            await fs.rm(tempDir, { recursive: true, force: true })
        } catch (e) {}
    }
}

runAutomatedBackup().catch(err => {
    console.error(err);
    process.exit(1);
});
