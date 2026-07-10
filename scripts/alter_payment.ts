import "dotenv/config";
import mysql from 'mysql2/promise';

async function run() {
    const conn = await mysql.createConnection(process.env.DATABASE_URL as string);
    try {
        await conn.query(`ALTER TABLE payments MODIFY COLUMN paymentType ENUM('MEMBERSHIP_FEE','RENEWAL','DONATION','EVENT_FEE','BURIAL_FEE','LEVY','OTHER') NOT NULL;`);
        console.log('Altered successfully on server!');
    } catch(e) {
        console.error(e);
    }
    await conn.end();
}
run();
