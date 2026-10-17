import mysql from 'mysql2/promise';
import crypto from 'crypto';

async function main() {
    const conn = await mysql.createConnection(process.env.DATABASE_URL);
    const activeProgrammeId = '74daa437-93c1-4880-aa34-7525526ce2cb';

    console.log('=== 1. Restoring Jimoh Morufudeen Ademola (₦20,000 paid 2026-09-03, Ref: T927716822847289) ===');
    const jimohRegId = 'e0df276d-09f9-47b7-be28-34450fd13f0f';
    const [existingJimoh] = await conn.query(
        `SELECT id, status, amountPaid FROM programme_registrations WHERE id = ? OR (programmeId = ? AND (email = 'jimohmorufudeen@gmail.com' OR userId = 'eca8db52-9def-4521-9193-2b1f970e6b32'))`,
        [jimohRegId, activeProgrammeId]
    );

    if (existingJimoh.length === 0) {
        const securityHash = crypto.randomBytes(6).toString('hex').toUpperCase();
        await conn.query(
            `INSERT INTO programme_registrations 
            (id, programmeId, memberId, userId, name, email, phone, gender, country, state, lga, branch, status, paymentReference, securityHash, amountPaid, lockedAmount, registeredAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PAID', ?, ?, '20000.00', '15000.00', '2026-09-03 11:55:03', NOW())`,
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
                'T927716822847289',
                securityHash
            ]
        );
        console.log('Inserted Jimoh Morufudeen Ademola registration:', jimohRegId);
    } else {
        await conn.query(
            `UPDATE programme_registrations 
             SET status = 'PAID', amountPaid = '20000.00', paymentReference = 'T927716822847289',
                 memberId = 'ba780ae6-bc74-49bf-9635-548dd53a9ade', userId = 'eca8db52-9def-4521-9193-2b1f970e6b32',
                 state = 'FCT', lga = 'Kuje', branch = 'Kuje', updatedAt = NOW()
             WHERE id = ?`,
            [existingJimoh[0].id]
        );
        console.log('Updated existing Jimoh Morufudeen Ademola registration:', existingJimoh[0].id);
    }

    console.log('\n=== 2. Syncing 5 Paid Sponsorship Pools that were stuck in PENDING ===');
    const paidPools = [
        { id: 'c45017c9-fa58-49a4-90e6-047b5c8b5e89', code: 'SP-D0528559', ref: 'T223717840499850' },
        { id: '9fc89e00-027f-44a4-ada2-7eb7d378abde', code: 'SP-684D9C7D', ref: 'T708280702364809' },
        { id: '3ef45a9e-c9c4-4209-83ca-b252041f8665', code: 'SP-5C5FBECC', ref: 'T222536835664733' },
        { id: '6d5f6f97-5e72-4a2b-a217-b5b306e9be30', code: 'SP-0738DC6E', ref: 'T199297834901794' },
        { id: 'b60f1148-edfc-4a13-8f30-750499402e46', code: 'SP-BC4567FD', ref: 'T174312316371867' },
    ];
    for (const p of paidPools) {
        const [poolRows] = await conn.query(`SELECT id, amountPerSeat, status FROM programme_sponsorship_pools WHERE id = ?`, [p.id]);
        if (poolRows.length > 0) {
            await conn.query(
                `UPDATE programme_sponsorship_pools SET status = 'PAID', paymentRef = ?, updatedAt = NOW() WHERE id = ?`,
                [p.ref, p.id]
            );
            await conn.query(
                `UPDATE programme_registrations SET status = 'PAID', amountPaid = ?, paymentReference = ?, updatedAt = NOW() WHERE sponsorPoolId = ?`,
                [poolRows[0].amountPerSeat, p.ref, p.id]
            );
            console.log(`Synced pool ${p.code} (${p.id}) -> PAID`);
        }
    }

    console.log('\n=== 3. Syncing 7 Paid Bulk Groups that were stuck in PENDING ===');
    const paidBulkIds = [
        '48d3df72-f583-453f-9d99-bf7ca01e330b',
        '3e089265-2e66-46a2-99e7-96d544a436e0',
        '663cb305-2df4-47f4-9cf9-bd47e58c8ca0',
        'ff193065-6b4e-4187-b152-79923508a596',
        'fd8328dd-9209-49a4-b462-1228ddfc1ae4',
        '1a2cf915-7e2f-4e13-8ca1-fa133ec5a933',
        'fa5c4581-2090-4a83-ad2b-ef66494126fe',
    ];
    for (const bgId of paidBulkIds) {
        const [bgRows] = await conn.query(`SELECT id, totalAmount, totalSeats, paymentRef FROM programme_bulk_groups WHERE id = ?`, [bgId]);
        if (bgRows.length > 0) {
            const bg = bgRows[0];
            const perSeat = (parseFloat(bg.totalAmount || '0') / Math.max(1, bg.totalSeats)).toFixed(2);
            await conn.query(`UPDATE programme_bulk_groups SET status = 'PAID', updatedAt = NOW() WHERE id = ?`, [bgId]);
            await conn.query(
                `UPDATE programme_registrations SET status = 'PAID', amountPaid = ?, paymentReference = ?, updatedAt = NOW() WHERE bulkGroupId = ?`,
                [perSeat, bg.paymentRef, bgId]
            );
            console.log(`Synced bulk group ${bgId} -> PAID (₦${perSeat}/seat)`);
        }
    }

    console.log('\n=== 4. Syncing 16 Paid Individual Registrations that were stuck in PENDING_PAYMENT ===');
    const paidIndiv = [
        { id: 'c8f5e0c3-1895-4c0f-bdf7-810e30972579', amount: 15000, ref: 'T791845619572494' },
        { id: '0a168761-bc0b-45c3-b59c-b811675021da', amount: 15000, ref: 'T223717840499850' },
        { id: '90801e56-6896-4090-be02-8fb4ca6745ee', amount: 25000, ref: 'T708280702364809' },
        { id: 'da671ac3-57cd-4375-b051-1de386b72909', amount: 15000, ref: 'T902267992350226' },
        { id: '6d055bb2-3ac6-44b5-b37f-9ab52efbbdc1', amount: 15000, ref: 'T280982297719937' },
        { id: '598bbeb9-5600-467d-bcff-7983ef2f357c', amount: 15000, ref: 'T199297834901794' },
        { id: '09638798-3fa3-49ee-ab5e-3d586e180c2f', amount: 15000, ref: 'T006378637191529' },
        { id: 'd2f52cf1-18cc-48a8-8de8-d53dc52f64c2', amount: 10000, ref: 'T448745184426089' },
        { id: '3b8a237c-70aa-474f-b859-16b11216c494', amount: 15000, ref: 'T059373131797268' },
        { id: '3222a1b4-39e2-454e-b462-4bf613cfcf7d', amount: 20000, ref: 'T290866911926397' },
        { id: 'cf2a010d-21b3-4026-b51b-560b457ef955', amount: 15000, ref: 'T202085686274969' },
        { id: '653bb60d-30d6-4d75-b862-f63d2d2911dd', amount: 15000, ref: 'T031161001809100' },
        { id: 'd2ba80a7-98c7-4ab8-b4d6-14330e367189', amount: 10000, ref: 'T242862958711303' },
        { id: '608d0db2-4fa6-4090-a7d0-aa82b274b1fd', amount: 15000, ref: 'T013954328496890' },
        { id: '5284c04a-a671-4098-b49f-8e7a6d201d9e', amount: 5000,  ref: 'T903025551789624' },
        { id: 'b62850e5-d9d1-4a76-bf07-bd350615f44b', amount: 15000, ref: 'T174312316371867' },
    ];
    for (const reg of paidIndiv) {
        const [rows] = await conn.query(`SELECT id, status, lockedAmount FROM programme_registrations WHERE id = ?`, [reg.id]);
        if (rows.length > 0 && rows[0].status === 'PENDING_PAYMENT') {
            const locked = parseFloat(rows[0].lockedAmount || '15000');
            const newStatus = reg.amount >= locked ? 'PAID' : 'PARTIALLY_PAID';
            await conn.query(
                `UPDATE programme_registrations SET status = ?, amountPaid = ?, paymentReference = ?, updatedAt = NOW() WHERE id = ?`,
                [newStatus, reg.amount.toFixed(2), reg.ref, reg.id]
            );
            console.log(`Synced individual registration ${reg.id} -> ${newStatus} (₦${reg.amount})`);
        }
    }

    await conn.end();
    console.log('\nDone!');
}

main().catch(e => { console.error(e); process.exit(1); });
