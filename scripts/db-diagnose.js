
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });
dotenv.config();

async function diagnose() {
    try {
        const connection = await mysql.createConnection(process.env.DATABASE_URL);
        console.log('Connected to database.');

        const [tables] = await connection.query('SHOW TABLES');
        console.log('Tables:', tables.map(t => Object.values(t)[0]));

        try {
            const [columns] = await connection.query('DESCRIBE navigation_items');
            console.log('navigation_items columns:', columns);
        } catch (error) {
            console.error('Error describing navigation_items:', error.message);
        }

        try {
            const [pagesCols] = await connection.query('DESCRIBE pages');
            console.log('pages columns:', pagesCols);
        } catch (error) {
            console.error('Error describing pages:', error.message);
        }

        await connection.end();
    } catch (error) {
        console.error('Database connection failed:', error);
    }
}

diagnose();
