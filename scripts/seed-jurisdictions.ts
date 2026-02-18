
import 'dotenv/config';
import mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';

// Parse DATABASE_URL if available, otherwise fallback (mostly for local dev if .env missing)
// DATABASE_URL format: mysql://user:pass@host:port/db
const databaseUrl = process.env.DATABASE_URL;
let dbConfig: any = {
    host: '127.0.0.1',
    user: 'root',
    database: 'tmc_portal',
};

if (databaseUrl) {
    try {
        const url = new URL(databaseUrl);
        dbConfig = {
            host: url.hostname,
            user: url.username,
            password: url.password,
            database: url.pathname.substring(1), // remove leading /
            port: Number(url.port) || 3306,
        };
    } catch (e) {
        console.warn("Invalid DATABASE_URL, using defaults");
    }
}

// Specific codes requested by user
const COUNTRIES = [
    { name: "Nigeria", code: "01" },
    { name: "Benin", code: "02" },
];

const NIGERI_STATES_SPECIFIC = [
    { name: "Lagos", code: "01" },
    { name: "Oyo", code: "02" },
    { name: "Ogun", code: "03" },
    { name: "Osun", code: "04" },
    { name: "Kwara", code: "05" },
    { name: "Edo", code: "06" },
    { name: "Ondo", code: "07" },
    { name: "Ekiti", code: "08" },
    { name: "Abuja", code: "09" }, // User called it Abuja, usually FCT, but will stick to user name/code
    { name: "Niger", code: "10" },
];

// Remaining states to be added sequentially starting from 11
const NIGERI_STATES_REMAINING = [
    "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
    "Cross River", "Delta", "Ebonyi", "Enugu", "Gombe", "Imo", "Jigawa", "Kaduna",
    "Kano", "Katsina", "Kebbi", "Kogi", "Nasarawa", "Plateau", "Rivers", "Sokoto",
    "Taraba", "Yobe", "Zamfara"
];

async function seed() {
    console.log(`Connecting to DB at ${dbConfig.host}...`);
    const connection = await mysql.createConnection(dbConfig);

    try {
        console.log("Seeding Jurisdiction Codes (Updated Spec)...");
        const now = new Date();

        // 1. Process Countries
        for (const country of COUNTRIES) {
            const [rows] = await connection.execute(
                'SELECT id, code FROM jurisdiction_codes WHERE name = ? AND type = "COUNTRY"',
                [country.name]
            );

            if ((rows as any[]).length > 0) {
                const existing = (rows as any[])[0];
                if (existing.code !== country.code) {
                    console.log(`Updating ${country.name} code from ${existing.code} to ${country.code}`);
                    await connection.execute(
                        'UPDATE jurisdiction_codes SET code = ?, updatedAt = ? WHERE id = ?',
                        [country.code, now, existing.id]
                    );
                } else {
                    console.log(`${country.name} already exists with correct code.`);
                }
            } else {
                await connection.execute(
                    'INSERT INTO jurisdiction_codes (id, type, name, code, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
                    [uuidv4(), 'COUNTRY', country.name, country.code, now, now]
                );
                console.log(`Created country: ${country.name} (${country.code})`);
            }
        }

        // Get Nigeria ID for states
        const [nigeriaRows] = await connection.execute(
            'SELECT id FROM jurisdiction_codes WHERE name = ? AND type = "COUNTRY"',
            ['Nigeria']
        );

        if ((nigeriaRows as any[]).length === 0) throw new Error("Nigeria not found after seeding");
        const nigeriaId = (nigeriaRows as any[])[0].id;

        // 2. Process Specific States
        for (const state of NIGERI_STATES_SPECIFIC) {
            const [rows] = await connection.execute(
                'SELECT id, code FROM jurisdiction_codes WHERE name = ? AND parentId = ? AND type = "STATE"',
                [state.name, nigeriaId]
            );

            if ((rows as any[]).length > 0) {
                const existing = (rows as any[])[0];
                if (existing.code !== state.code) {
                    console.log(`Updating ${state.name} code from ${existing.code} to ${state.code}`);
                    await connection.execute(
                        'UPDATE jurisdiction_codes SET code = ?, updatedAt = ? WHERE id = ?',
                        [state.code, now, existing.id]
                    );
                } else {
                    console.log(`${state.name} already exists with correct code.`);
                }
            } else {
                await connection.execute(
                    'INSERT INTO jurisdiction_codes (id, type, name, code, parentId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [uuidv4(), 'STATE', state.name, state.code, nigeriaId, now, now]
                );
                console.log(`Created state: ${state.name} (${state.code})`);
            }
        }

        // 3. Process Remaining States (Sequential from 11)
        let nextCode = 11;
        for (const stateName of NIGERI_STATES_REMAINING) {
            const code = nextCode.toString().padStart(2, '0');
            const [rows] = await connection.execute(
                'SELECT id, code FROM jurisdiction_codes WHERE name = ? AND parentId = ? AND type = "STATE"',
                [stateName, nigeriaId]
            );

            if ((rows as any[]).length > 0) {
                const existing = (rows as any[])[0];
                // Only update if it conflicts with a reserved code or satisfy uniqueness? 
                // For now, let's just ensure they exist. 
                // If we strictly want to reorder existing sequential ones, we might need a more aggressive reset.
                // But assuming previous seed was generic alphabetic, likely mismatch.
                // Let's UPDATE them to ensuring consistent sequential ordering excludes the top 10.

                // However, "Abuja" in user list might conflict with "FCT" in my previous list.
                // User said "Abuja is 09". My previous list had "FCT".
                // "Niger" is 10.

                // If previous seed ran, we have random generic codes.
                // Ideally we update them to be safe.
                if (existing.code !== code) {
                    console.log(`Updating ${stateName} code to ${code}`);
                    await connection.execute(
                        'UPDATE jurisdiction_codes SET code = ?, updatedAt = ? WHERE id = ?',
                        [code, now, existing.id]
                    );
                }
            } else {
                await connection.execute(
                    'INSERT INTO jurisdiction_codes (id, type, name, code, parentId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [uuidv4(), 'STATE', stateName, code, nigeriaId, now, now]
                );
                console.log(`Created state: ${stateName} (${code})`);
            }
            nextCode++;
        }

        console.log("Seeding complete.");

    } catch (error) {
        console.error("Seeding failed:", error);
    } finally {
        await connection.end();
    }
}

seed().catch(console.error).finally(() => process.exit(0));
