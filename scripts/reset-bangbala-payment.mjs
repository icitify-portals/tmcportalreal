import mysql from 'mysql2/promise';

async function main() {
    const conn = await mysql.createConnection(process.env.DATABASE_URL);
    const regId = '1b4c3713-1caa-4ba0-a94f-65e4cbcc2e83';
    const progId = '28cda84e-42bb-48fe-9581-0d4d556df53e';

    console.log('=== 1. Resetting Abdulwasiu Taiwo Bangbala to PENDING_PAYMENT ===');
    await conn.query(
        `UPDATE programme_registrations 
         SET status = 'PENDING_PAYMENT',
             amountPaid = '0.00',
             lockedAmount = '2000.00',
             registrationTier = 'National Executive Council (NEC) Registration ',
             paymentReference = NULL,
             checkInWaiver = 0
         WHERE id = ?`,
        [regId]
    );

    const [reg] = await conn.query('SELECT * FROM programme_registrations WHERE id = ?', [regId]);
    console.log('UPDATED REGISTRATION:', {
        id: reg[0].id,
        name: reg[0].name,
        email: reg[0].email,
        status: reg[0].status,
        amountPaid: reg[0].amountPaid,
        lockedAmount: reg[0].lockedAmount,
        registrationTier: reg[0].registrationTier,
        paymentReference: reg[0].paymentReference,
    });

    console.log('\n=== 2. Clearing waiverCode from ANC 1448 programme ===');
    await conn.query(
        `UPDATE programmes SET waiverCode = NULL WHERE id = ?`,
        [progId]
    );
    const [p] = await conn.query('SELECT id, title, waiverCode FROM programmes WHERE id = ?', [progId]);
    console.log('PROGRAMME NOW:', p[0]);

    await conn.end();
}

main().catch(console.error);
