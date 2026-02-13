
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });
dotenv.config();

const sqlFile = path.join(__dirname, '../drizzle/0003_concerned_lake.sql');

async function migrate() {
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    console.log('Connected to database.');

    const sqlContent = fs.readFileSync(sqlFile, 'utf-8');
    const statements = sqlContent.split('--> statement-breakpoint');

    for (const statement of statements) {
        const query = statement.trim();
        if (!query) continue;

        try {
            await connection.query(query);
            console.log('Executed:', query.substring(0, 50) + '...');
        } catch (error) {
            if (error.code === 'ER_TABLE_EXISTS_ERROR' || error.message.includes('already exists')) {
                console.log('Skipping existing table/constraint.');
            } else if (error.code === 'ER_DUP_KEYNAME') {
                console.log('Skipping existing key.');
            } else {
                console.error('Error executing query:', query);
                console.error(error);
                // process.exit(1); // Don't exit, try to continue
            }
        }
    }

    console.log('Migration completed.');
    await connection.end();
}

migrate().catch(console.error);
