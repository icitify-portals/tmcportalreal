import mysql from 'mysql2/promise';

async function main() {
    const conn = await mysql.createConnection(process.env.DATABASE_URL);

    const [progs] = await conn.query(
        `SELECT id, title, amount, pricingTiers FROM programmes WHERE pricingTiers IS NOT NULL`
    );
    console.log(`Found ${progs.length} programmes with pricingTiers:`);
    for (const p of progs) {
        console.log(`\n--- Programme: ${p.title} (${p.id}) ---`);
        console.log(`Standard Amount: ₦${p.amount}`);
        console.log(`Pricing Tiers:`, p.pricingTiers);
    }

    await conn.end();
}

main().catch(console.error);
