import mysql from 'mysql2/promise';

async function main() {
    const conn = await mysql.createConnection(process.env.DATABASE_URL);
    const ancProgrammeId = '28cda84e-42bb-48fe-9581-0d4d556df53e';

    // Link Ogunbajo
    const [uRows] = await conn.query('SELECT id FROM users WHERE email = ?', ['pegbaogunbajo@gmail.com']);
    if (uRows.length > 0) {
        const uId = uRows[0].id;
        const [mRows] = await conn.query('SELECT id FROM members WHERE userId = ?', [uId]);
        const mId = mRows[0]?.id || null;
        await conn.query(
            `UPDATE programme_registrations 
             SET registrationTier = 'National Executive Council (NEC) Registration ',
                 lockedAmount = '2000.00',
                 userId = ?,
                 memberId = ?
             WHERE email = 'pegbaogunbajo@gmail.com'`,
            [uId, mId]
        );
        console.log('Ogunbajo linked and updated to NEC Registration');
    }

    const [allRegs] = await conn.query(
        `SELECT r.name, r.email, r.amountPaid, r.lockedAmount, r.registrationTier, r.status
         FROM programme_registrations r
         WHERE r.programmeId = ?`,
        [ancProgrammeId]
    );
    console.log('\nFINAL ANC REGISTRATIONS:');
    for (const r of allRegs) {
        console.log(`- ${r.name} (${r.email}): Tier="${r.registrationTier}", Locked=₦${r.lockedAmount}, Paid=₦${r.amountPaid}, Status=${r.status}`);
    }

    await conn.end();
}

main().catch(console.error);
