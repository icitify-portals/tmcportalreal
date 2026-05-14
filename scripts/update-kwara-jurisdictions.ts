
import * as dotenv from "dotenv";
import path from "path";
import mysql from "mysql2/promise";
import { v4 as uuidv4 } from 'uuid';

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const genId = () => uuidv4();

const kwaraData = {
  lgas: [
    { name: "Ilorin West", branches: ["Osere branch", "Irewolede branch", "Asa - Dam branch"] },
    { name: "Ilorin South", branches: ["Basin branch", "Fate Branch"] },
    { name: "Ilorin East", branches: ["Adewole branch", "Agaka branch", "Apalara branch"] },
    { name: "Asa", branches: ["Eyenkrin Branch"] },
    { name: "Offa", branches: ["Offa branch"] },
    { name: "Ifelodun", branches: ["Igbaja branch"] },
  ],
};

async function main() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error("DATABASE_URL is not defined in .env");
        process.exit(1);
    }

    const connection = await mysql.createConnection({
        uri: connectionString
    });

    console.log("Updating Kwara Jurisdictions...");

    try {
        // 1. Get Kwara State ID
        const [stateRows] = await connection.execute(
            'SELECT id FROM organizations WHERE name = ? AND level = ?', 
            ['Kwara', 'STATE']
        );
        const states = stateRows as any[];

        if (states.length === 0) {
            console.error("Kwara State not found in organizations table.");
            process.exit(1);
        }

        const kwaraId = states[0].id;
        console.log(`Found Kwara State ID: ${kwaraId}`);

        // 2. Process each LGA
        for (const lga of kwaraData.lgas) {
            const lgaName = lga.name;
            console.log(`\nProcessing LGA: ${lgaName}`);

            // Upsert LGA
            const cleanLgaName = lgaName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
            const lgaCode = `KWA-${cleanLgaName.substring(0, 10)}`;

            let lgaId: string;
            const [existingLga] = await connection.execute(
                'SELECT id FROM organizations WHERE name = ? AND level = ? AND parentId = ?', 
                [lgaName, 'LOCAL_GOVERNMENT', kwaraId]
            );

            if ((existingLga as any[]).length > 0) {
                lgaId = (existingLga as any[])[0].id;
                console.log(`- LGA exists, ID: ${lgaId}`);
            } else {
                lgaId = genId();
                await connection.execute(`
                    INSERT INTO organizations (id, name, level, code, parentId, country, createdAt, updatedAt)
                    VALUES (?, ?, 'LOCAL_GOVERNMENT', ?, ?, 'Nigeria', NOW(), NOW())
                `, [lgaId, lgaName, lgaCode, kwaraId]);
                console.log(`- Created LGA: ${lgaName} (ID: ${lgaId})`);
            }

            // Process each branch
            for (const branchName of lga.branches) {
                console.log(`  - Processing Branch: ${branchName}`);
                const cleanBranchName = branchName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                const branchCode = `${lgaCode}-${cleanBranchName.substring(0, 10)}`;

                // Look for existing branch with a similar name anywhere in Kwara
                // We'll search for the core name (e.g., "Osere" in "Osere branch" or "OSERE")
                const coreName = branchName.replace(/branch/gi, '').trim().toLowerCase();
                
                const [existingBranchRows] = await connection.execute(`
                    SELECT id, name, parentId FROM organizations 
                    WHERE level = 'BRANCH' 
                    AND (LOWER(name) LIKE ? OR LOWER(name) LIKE ?)
                    AND parentId IN (SELECT id FROM organizations WHERE parentId = ? AND level = 'LOCAL_GOVERNMENT')
                `, [`%${coreName}%`, coreName, kwaraId]);

                const branchesFound = existingBranchRows as any[];

                if (branchesFound.length > 0) {
                    // Update existing branch
                    const branchToUpdate = branchesFound[0];
                    console.log(`    * Found existing branch: ${branchToUpdate.name} (ID: ${branchToUpdate.id}) in LGA ID: ${branchToUpdate.parentId}`);
                    
                    await connection.execute(`
                        UPDATE organizations 
                        SET name = ?, parentId = ?, code = ?, updatedAt = NOW()
                        WHERE id = ?
                    `, [branchName, lgaId, branchCode, branchToUpdate.id]);
                    
                    console.log(`    * Updated and moved branch: ${branchName} to ${lgaName}`);
                } else {
                    // Create new branch
                    await connection.execute(`
                        INSERT INTO organizations (id, name, level, code, parentId, country, createdAt, updatedAt)
                        VALUES (?, ?, 'BRANCH', ?, ?, 'Nigeria', NOW(), NOW())
                    `, [genId(), branchName, branchCode, lgaId]);
                    console.log(`    * Created new branch: ${branchName}`);
                }
            }
        }

        console.log("\nKwara Jurisdictions updated successfully.");

    } catch (error) {
        console.error("Update failed:", error);
    } finally {
        await connection.end();
    }
}

main();
