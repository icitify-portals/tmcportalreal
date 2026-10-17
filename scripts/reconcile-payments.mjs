import mysql from 'mysql2/promise';

async function main() {
    const conn = await mysql.createConnection(process.env.DATABASE_URL);
    const activeProgrammeId = '74daa437-93c1-4880-aa34-7525526ce2cb';

    console.log('=== 1. Ensuring all beneficiary rows under PAID Sponsorship Pools are marked PAID ===');
    const [paidPools] = await conn.query(
        `SELECT id, sponsorCode, amountPerSeat, paymentRef FROM programme_sponsorship_pools WHERE sponsorship_status = 'PAID'`
    );
    for (const pool of paidPools) {
        const [res] = await conn.query(
            `UPDATE programme_registrations 
             SET status = 'PAID', amountPaid = ?, paymentReference = COALESCE(paymentReference, ?)
             WHERE sponsorPoolId = ? AND status != 'PAID' AND status != 'ATTENDED'`,
            [pool.amountPerSeat, pool.paymentRef, pool.id]
        );
        if (res.affectedRows > 0) {
            console.log(`  -> Activated ${res.affectedRows} pre-named beneficiary seat(s) for pool ${pool.sponsorCode}`);
        }
    }

    console.log('=== 2. Ensuring all attendee rows under PAID Bulk Groups are marked PAID ===');
    const [paidBulk] = await conn.query(
        `SELECT id, paymasterName, amountPerAttendee, paymentRef FROM bulk_registration_groups WHERE bulk_status = 'PAID'`
    );
    for (const bg of paidBulk) {
        const [res] = await conn.query(
            `UPDATE programme_registrations 
             SET status = 'PAID', amountPaid = ?, paymentReference = COALESCE(paymentReference, ?)
             WHERE bulkGroupId = ? AND status != 'PAID' AND status != 'ATTENDED'`,
            [bg.amountPerAttendee, bg.paymentRef, bg.id]
        );
        if (res.affectedRows > 0) {
            console.log(`  -> Activated ${res.affectedRows} bulk seat(s) for group ${bg.id} (${bg.paymasterName})`);
        }
    }

    console.log('=== 3. Fixing Together-Checkout Self-Registration amountPaid so combined pool/bulk totals are not double-counted ===');
    const [togetherSelfRegs] = await conn.query(
        `SELECT r.id, r.name, r.amountPaid, r.lockedAmount, r.paymentReference
         FROM programme_registrations r
         WHERE r.programmeId = ?
           AND r.sponsorPoolId IS NULL
           AND r.bulkGroupId IS NULL
           AND r.paymentReference IS NOT NULL
           AND (
               EXISTS (SELECT 1 FROM programme_sponsorship_pools p WHERE p.paymentRef = r.paymentReference)
               OR EXISTS (SELECT 1 FROM bulk_registration_groups b WHERE b.paymentRef = r.paymentReference)
           )`,
        [activeProgrammeId]
    );
    for (const r of togetherSelfRegs) {
        const seatFee = parseFloat(r.lockedAmount || '15000').toFixed(2);
        if (parseFloat(r.amountPaid) > parseFloat(seatFee)) {
            await conn.query(
                `UPDATE programme_registrations SET amountPaid = ?, status = 'PAID' WHERE id = ?`,
                [seatFee, r.id]
            );
            console.log(`  -> Normalized Together-checkout self-seat ${r.name}: ₦${r.amountPaid} -> ₦${seatFee} (Ref: ${r.paymentReference})`);
        }
    }

    await conn.end();
    console.log('Done!');
}

main().catch(e => { console.error(e); process.exit(1); });
