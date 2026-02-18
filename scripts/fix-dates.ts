
import 'dotenv/config';
import mysql from 'mysql2/promise';

// Parse DATABASE_URL if available
const databaseUrl = process.env.DATABASE_URL;
let dbConfig: any = {
    host: '127.0.0.1',
    user: 'root',
    database: 'tmc_portal',
};

if (databaseUrl) {
    try {
        const url = new URL(databaseUrl);
        dbConfig = {
            host: url.hostname,
            user: url.username,
            password: url.password,
            database: url.pathname.substring(1), // remove leading /
            port: Number(url.port) || 3306,
        };
    } catch (e) {
        console.warn("Invalid DATABASE_URL, using defaults");
    }
}

async function fix() {
    console.log(`Connecting to DB at ${dbConfig.host}...`);
    const connection = await mysql.createConnection(dbConfig);

    try {
        console.log("Fixing invalid zero dates...");

        // List of tables that might have updatedAt
        const tables = ['system_settings', 'users', 'jurisdiction_codes', 'member_id_sequences', 'members', 'organizations'];

        for (const table of tables) {
            try {
                // Check if table exists
                const [rows] = await connection.execute(`SHOW TABLES LIKE '${table}'`);
                if ((rows as any[]).length === 0) continue;

                // Check if updatedAt exists
                const [cols] = await connection.execute(`SHOW COLUMNS FROM ${table} LIKE 'updatedAt'`);
                if ((cols as any[]).length === 0) continue;

                console.log(`Checking ${table}...`);
                // Update invalid dates
                // MySQL 5.7/8.0 '0000-00-00' handling depends on sql_mode but updating it to NOW() is standard fix
                await connection.query(`UPDATE ${table} SET updatedAt = CURRENT_TIMESTAMP WHERE CAST(updatedAt AS CHAR) LIKE '0000%' OR updatedAt IS NULL`);
                console.log(`Fixed ${table}`);
            } catch (err: any) {
                console.log(`Skipping ${table}: ${err.message}`);
            }
        }

        console.log("Date fix complete.");

    } catch (error) {
        console.error("Fix failed:", error);
    } finally {
        await connection.end();
    }
}

fix().catch(console.error).finally(() => process.exit(0));
