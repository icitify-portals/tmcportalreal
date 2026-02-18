
import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';

// Using 127.0.0.1 explicitly as confirmed working
const DB_CONFIG = {
    host: '127.0.0.1',
    user: 'root',
    database: 'tmc_portal',
};

async function backup() {
    console.log("Connecting to DB for backup...");
    const connection = await mysql.createConnection(DB_CONFIG);

    // Ensure backup directory exists
    const backupDir = path.join(process.cwd(), 'backups');
    try {
        await fs.mkdir(backupDir, { recursive: true });
    } catch (e) { }

    try {
        // 1. Backup system_settings
        console.log("Backing up system_settings...");
        try {
            const [settingsRows] = await connection.execute('SELECT * FROM system_settings');
            await fs.writeFile(
                path.join(backupDir, `system_settings_${Date.now()}.json`),
                JSON.stringify(settingsRows, null, 2)
            );
            console.log(`Backed up ${(settingsRows as any[]).length} rows from system_settings.`);
        } catch (err: any) {
            console.error("Error backing up system_settings:", err.message);
        }

        // 2. Backup site_visits
        console.log("Backing up site_visits...");
        try {
            const [visitRows] = await connection.execute('SELECT * FROM site_visits');
            await fs.writeFile(
                path.join(backupDir, `site_visits_${Date.now()}.json`),
                JSON.stringify(visitRows, null, 2)
            );
            console.log(`Backed up ${(visitRows as any[]).length} rows from site_visits.`);
        } catch (err: any) {
            console.error("Error backing up site_visits:", err.message);
        }

    } catch (error) {
        console.error("Backup failed:", error);
    } finally {
        await connection.end();
    }
}

backup().catch(console.error).finally(() => process.exit(0));
