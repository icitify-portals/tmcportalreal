import mysql from 'mysql2/promise';

async function verifyPaystack(ref, secretKey) {
    if (!ref || !secretKey) return null;
    try {
        const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(ref)}`, {
            headers: { Authorization: `Bearer ${secretKey}` }
        });
        const json = await res.json();
        if (json?.status && json?.data?.status === 'success') {
            return json.data;
        }
    } catch (e) {
        // ignore network error
    }
    return null;
}

async function main() {
    const conn = await mysql.createConnection(process.env.DATABASE_URL);
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    const activeProgrammeId = '74daa437-93c1-4880-aa34-7525526ce2cb';

    console.log('=== 1. Verifying Jimoh Morufudeen Ademola (₦20,000 paid 2026-09-03, Ref: T927716822847289) ===');
    const jimohRegId = 'e0df276d-09f9-47b7-be28-34450fd13f0f';
    const [existingJimoh] = await conn.query(
        `SELECT id, name, email, status, amountPaid, state, lga, branch, memberId, paymentReference FROM programme_registrations WHERE id = ? OR (programmeId = ? AND (email = 'jimohmorufudeen@gmail.com' OR userId = 'eca8db52-9def-4521-9193-2b1f970e6b32'))`,
        [jimohRegId, activeProgrammeId]
    );

    if (existingJimoh.length === 0) {
        await conn.query(
            `INSERT INTO programme_registrations 
            (id, programmeId, memberId, userId, name, email, phone, gender, country, state, lga, branch, status, paymentReference, amountPaid, lockedAmount, registeredAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PAID', ?, '20000.00', '15000.00', '2026-09-03 11:55:03')`,
            [
                jimohRegId,
                activeProgrammeId,
                'ba780ae6-bc74-49bf-9635-548dd53a9ade',
                'eca8db52-9def-4521-9193-2b1f970e6b32',
                'Jimoh Morufudeen Ademola',
                'jimohmorufudeen@gmail.com',
                '+2348025332568',
                'MALE',
                'Nigeria',
                'FCT',
                'Kuje',
                'Kuje',
                'T927716822847289'
            ]
        );
        console.log('Inserted Jimoh Morufudeen Ademola registration:', jimohRegId);
    } else {
        await conn.query(
            `UPDATE programme_registrations 
             SET status = 'PAID', amountPaid = '20000.00', paymentReference = 'T927716822847289',
                 memberId = 'ba780ae6-bc74-49bf-9635-548dd53a9ade', userId = 'eca8db52-9def-4521-9193-2b1f970e6b32',
                 state = 'FCT', lga = 'Kuje', branch = 'Kuje'
             WHERE id = ?`,
            [existingJimoh[0].id]
        );
        console.log('Verified Jimoh Morufudeen Ademola registration:', existingJimoh[0]);
    }

    console.log('\n=== 2. Checking all PENDING Sponsorship Pools against Paystack ===');
    const [pendingPools] = await conn.query(
        `SELECT id, sponsorCode, sponsorName, seatCount, seatsClaimed, amountPerSeat, totalAmount, paymentRef, sponsorship_status FROM programme_sponsorship_pools WHERE sponsorship_status = 'PENDING' AND paymentRef IS NOT NULL`
    );
    console.log(`Found ${pendingPools.length} PENDING sponsorship pools with paymentRef`);
    for (const p of pendingPools) {
        const tx = await verifyPaystack(p.paymentRef, secretKey);
        if (tx) {
            await conn.query(
                `UPDATE programme_sponsorship_pools SET sponsorship_status = 'PAID', updatedAt = NOW() WHERE id = ?`,
                [p.id]
            );
            await conn.query(
                `UPDATE programme_registrations SET status = 'PAID', amountPaid = ?, paymentReference = ? WHERE sponsorPoolId = ?`,
                [p.amountPerSeat, p.paymentRef, p.id]
            );
            console.log(`  -> Synced PAID pool ${p.sponsorCode} (${p.sponsorName}, ${p.seatCount} seats, Ref: ${p.paymentRef})`);
        }
    }

    const [allPaidPools] = await conn.query(
        `SELECT id, sponsorCode, sponsorName, seatCount, seatsClaimed, amountPerSeat, totalAmount, sponsorship_status FROM programme_sponsorship_pools WHERE sponsorship_status = 'PAID'`
    );
    console.log(`Total PAID sponsorship pools now: ${allPaidPools.length}`);
    for (const p of allPaidPools) {
        console.log(`  - ${p.sponsorCode}: ${p.sponsorName} (${p.seatsClaimed}/${p.seatCount} seats claimed, ₦${p.totalAmount})`);
    }

    console.log('\n=== 3. Checking all PENDING Bulk Groups against Paystack ===');
    const [pendingBulk] = await conn.query(
        `SELECT id, paymasterName, attendeeCount, amountPerAttendee, totalAmount, paymentRef, bulk_status FROM bulk_registration_groups WHERE bulk_status = 'PENDING' AND paymentRef IS NOT NULL`
    );
    console.log(`Found ${pendingBulk.length} PENDING bulk groups with paymentRef`);
    for (const bg of pendingBulk) {
        const tx = await verifyPaystack(bg.paymentRef, secretKey);
        if (tx) {
            await conn.query(`UPDATE bulk_registration_groups SET bulk_status = 'PAID', updatedAt = NOW() WHERE id = ?`, [bg.id]);
            await conn.query(
                `UPDATE programme_registrations SET status = 'PAID', amountPaid = ?, paymentReference = ? WHERE bulkGroupId = ?`,
                [bg.amountPerAttendee, bg.paymentRef, bg.id]
            );
            console.log(`  -> Synced PAID bulk group ${bg.id} (${bg.paymasterName}, ${bg.attendeeCount} seats, Ref: ${bg.paymentRef})`);
        }
    }

    console.log('\n=== 4. Checking all PENDING_PAYMENT Individual Registrations against Paystack ===');
    const [pendingRegs] = await conn.query(
        `SELECT id, name, email, status, amountPaid, lockedAmount, paymentReference FROM programme_registrations WHERE programmeId = ? AND status = 'PENDING_PAYMENT' AND paymentReference IS NOT NULL`,
        [activeProgrammeId]
    );
    console.log(`Found ${pendingRegs.length} PENDING_PAYMENT registrations with paymentReference`);
    for (const reg of pendingRegs) {
        const tx = await verifyPaystack(reg.paymentReference, secretKey);
        if (tx) {
            const paidNaira = Number(tx.amount || 0) / 100;
            const locked = parseFloat(reg.lockedAmount || '15000');
            const newStatus = paidNaira >= locked ? 'PAID' : 'PARTIALLY_PAID';
            await conn.query(
                `UPDATE programme_registrations SET status = ?, amountPaid = ? WHERE id = ?`,
                [newStatus, paidNaira.toFixed(2), reg.id]
            );
            console.log(`  -> Synced ${reg.name} (${reg.email}) -> ${newStatus} (₦${paidNaira}, Ref: ${reg.paymentReference})`);
        }
    }

    await conn.end();
    console.log('\nReconciliation complete!');
}

main().catch(e => { console.error(e); process.exit(1); });
