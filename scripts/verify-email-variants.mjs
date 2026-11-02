import mysql from 'mysql2/promise';

async function main() {
    const conn = await mysql.createConnection(process.env.DATABASE_URL);

    // Check user lookup for both bamgbala and bangbala
    for (const email of ['bamgbala_taiwo@yahoo.co.uk', 'bangbala_taiwo@yahoo.co.uk']) {
        const cleanEmail = email.trim().toLowerCase();
        const variants = [cleanEmail];
        if (cleanEmail.includes('bamgbala')) variants.push(cleanEmail.replace(/bamgbala/g, 'bangbala'));
        if (cleanEmail.includes('bangbala')) variants.push(cleanEmail.replace(/bangbala/g, 'bamgbala'));

        const [users] = await conn.query(
            `SELECT u.id, u.name, u.email, o.position, o.positionLevel 
             FROM users u 
             LEFT JOIN officials o ON u.id = o.userId AND o.isActive = 1
             WHERE LOWER(u.email) IN (?)`,
            [variants]
        );
        console.log(`Email '${email}' resolved user:`, users[0]);
    }

    // Verify Abdulwasiu Taiwo Bangbala registration record
    const [reg] = await conn.query(
        `SELECT id, name, email, amountPaid, lockedAmount, registrationTier, status 
         FROM programme_registrations 
         WHERE id = '1b4c3713-1caa-4ba0-a94f-65e4cbcc2e83'`
    );
    console.log('\nCONFIRMED REGISTRATION IN DB:', reg[0]);

    await conn.end();
}

main().catch(console.error);
