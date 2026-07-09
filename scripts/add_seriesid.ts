import "dotenv/config";
import mysql from 'mysql2/promise';

async function run() {
    try {
        const connection = await mysql.createConnection(process.env.DATABASE_URL as string);
        
        try {
            await connection.execute(`ALTER TABLE programmes ADD COLUMN seriesId VARCHAR(255)`);
            console.log("Added seriesId");
        } catch (e: any) {
            console.log("seriesId error:", e.message);
        }

        await connection.end();
        console.log("Done");
    } catch (err: any) {
        console.error("Connection error:", err.message);
    }
    process.exit(0);
}
run();
