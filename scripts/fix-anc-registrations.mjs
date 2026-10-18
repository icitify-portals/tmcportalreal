import mysql from 'mysql2/promise';

async function main() {
    const conn = await mysql.createConnection(process.env.DATABASE_URL);
    const ancProgrammeId = '28cda84e-42bb-48fe-9581-0d4d556df53e';

    console.log('=== 1. Checking ANC 1448 (2026) Registrations ===');
    const [regs] = await conn.query(
        `SELECT r.id, r.userId, r.name, r.email, r.amountPaid, r.lockedAmount, r.registrationTier, r.status,
                o.position, o.positionLevel
         FROM programme_registrations r
         LEFT JOIN officials o ON r.userId = o.userId AND o.isActive = 1
         WHERE r.programmeId = ?`,
        [ancProgrammeId]
    );

    for (const r of regs) {
        console.log(`Attendee: ${r.name} (${r.email}) - Paid: ₦${r.amountPaid}, Locked: ₦${r.lockedAmount}, Tier: "${r.registrationTier}", Official: ${r.position || 'None'} [${r.positionLevel || 'None'}]`);
        
        // If the attendee is a National Executive:
        if (r.positionLevel === 'NATIONAL') {
            if (r.lockedAmount !== '2000.00' || !r.registrationTier?.includes('NEC') && !r.registrationTier?.includes('National')) {
                await conn.query(
                    `UPDATE programme_registrations 
                     SET lockedAmount = '2000.00', 
                         registrationTier = 'National Executive Council (NEC) Registration '
                     WHERE id = ?`,
                    [r.id]
                );
                console.log(`  -> UPDATED National Executive ${r.name} to ₦2,000 (NEC Registration)`);
            }
        } else {
            // Non-executive member: should be General Member/Delegate Registration at ₦1,000
            if (r.status === 'PAID' && parseFloat(r.amountPaid) === 1000) {
                if (r.lockedAmount !== '1000.00' || !r.registrationTier?.includes('General')) {
                    await conn.query(
                        `UPDATE programme_registrations 
                         SET lockedAmount = '1000.00', 
                             registrationTier = 'General Member/Delegate Registration '
                         WHERE id = ?`,
                        [r.id]
                    );
                    console.log(`  -> UPDATED Non-executive ${r.name} to ₦1,000 (General Member/Delegate)`);
                }
            }
        }
    }

    // Verify Abdulwasiu Taiwo Bangbala specifically
    const [amirReg] = await conn.query(
        `SELECT id, name, email, amountPaid, lockedAmount, registrationTier, status 
         FROM programme_registrations 
         WHERE programmeId = ? AND (email LIKE '%bamgbala%' OR email LIKE '%bangbala%')`,
        [ancProgrammeId]
    );
    console.log('\nAMIR REGISTRATION NOW:', amirReg[0]);

    await conn.end();
}

main().catch(console.error);
