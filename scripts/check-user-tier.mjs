import mysql from 'mysql2/promise';

async function main() {
    const conn = await mysql.createConnection(process.env.DATABASE_URL);

    const [offs] = await conn.query(
        `SELECT o.id, o.position, o.positionLevel, u.email, u.name 
         FROM officials o 
         JOIN users u ON o.userId = u.id 
         WHERE u.email IN ('tmcnadmi@gmail.com', 'pegbaogunbajo@gmail.com')`
    );
    console.log('OFFICIALS FOR ANIMASHAUN & OGUNBAJO:', offs);

    const [mems] = await conn.query(
        `SELECT m.id, m.memberId, u.email, u.name 
         FROM members m 
         JOIN users u ON m.userId = u.id 
         WHERE u.email IN ('tmcnadmi@gmail.com', 'pegbaogunbajo@gmail.com')`
    );
    console.log('MEMBERS FOR ANIMASHAUN & OGUNBAJO:', mems);

    await conn.end();
}

main().catch(console.error);
