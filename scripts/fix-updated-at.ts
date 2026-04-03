
import * as dotenv from "dotenv";
import path from "path";
import mysql from "mysql2/promise";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function main() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error("DATABASE_URL not found");
        return;
    }

    const connection = await mysql.createConnection({ uri: connectionString });

    try {
        const [tables] = await connection.execute<any[]>('SHOW TABLES');
        const dbName = connectionString.split('/').pop()?.split('?')[0] || 'tmc_portal';
        const tableKey = `Tables_in_${dbName}`;

        console.log(`Found ${tables.length} tables. Checking for updatedAt columns...`);

        for (const tableRow of tables) {
            const tableName = tableRow[Object.keys(tableRow)[0]];
            
            const [columns] = await connection.execute<any[]>(`DESCRIBE \`${tableName}\``);
            const updatedAtCol = columns.find(c => c.Field === 'updatedAt');

            if (updatedAtCol) {
                console.log(`Fixing table: ${tableName}...`);
                try {
                    // Try to modify the column to have proper defaults
                    const sql = `ALTER TABLE \`${tableName}\` MODIFY COLUMN \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`;
                    await connection.execute(sql);
                    console.log(`✅ Fixed ${tableName}`);
                } catch (err: any) {
                    console.error(`❌ Failed to fix ${tableName}:`, err.message);
                }
            }
        }

        console.log("Database schema fix completed.");

    } catch (error: any) {
        console.error("Script failed:", error.message);
    } finally {
        await connection.end();
    }
}

main();
