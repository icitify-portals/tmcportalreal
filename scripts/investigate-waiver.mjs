import mysql from 'mysql2/promise';

async function main() {
    const conn = await mysql.createConnection(process.env.DATABASE_URL);

    // 1. Check programme waiver code
    const [prog] = await conn.query('SELECT id, title, waiverCode, amount FROM programmes WHERE id = ?', ['28cda84e-42bb-48fe-9581-0d4d556df53e']);
    console.log('PROGRAMME WAIVER CODE:', prog[0]);

    // 2. Check all registrations with WAIVER_BYPASS for ANC
    const [ancWaivers] = await conn.query(
        `SELECT id, name, email, amountPaid, lockedAmount, paymentReference, status, registeredAt 
         FROM programme_registrations 
         WHERE programmeId = ? AND (paymentReference LIKE '%WAIVER%' OR paymentReference IS NULL)`,
        ['28cda84e-42bb-48fe-9581-0d4d556df53e']
    );
    console.log('\nANC WAIVER OR NO-REF REGISTRATIONS (' + ancWaivers.length + '):', ancWaivers);

    // 3. Check all registrations for ANC
    const [allAnc] = await conn.query(
        `SELECT id, name, email, amountPaid, lockedAmount, paymentReference, status, registeredAt 
         FROM programme_registrations 
         WHERE programmeId = ?`,
        ['28cda84e-42bb-48fe-9581-0d4d556df53e']
    );
    console.log('\nALL ANC REGISTRATIONS (' + allAnc.length + '):', allAnc);

    // 4. Check all payments table records for bangbala or bamgbala
    const [payments] = await conn.query(
        `SELECT * FROM payments 
         WHERE email LIKE '%bangbala%' OR email LIKE '%bamgbala%' OR userId = '42ddbb53-e487-4b9f-a167-65787afb1d54'`
    );
    console.log('\nPAYMENTS TABLE FOR BANGBALA:', payments);

    await conn.end();
}

main().catch(console.error);
