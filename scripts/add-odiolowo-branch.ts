import * as dotenv from "dotenv";
import path from "path";
import mysql from "mysql2/promise";
import { v4 as uuidv4 } from "uuid";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function main() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error("DATABASE_URL is not defined in .env");
        process.exit(1);
    }

    const connection = await mysql.createConnection({
        uri: connectionString,
    });

    try {
        console.log("Adding Odiolowo branch under Mushin LGA...");

        // 1. Locate Lagos State
        const [lagosRows] = await connection.execute(
            "SELECT id, name FROM organizations WHERE name = ? AND level = ?",
            ["Lagos", "STATE"]
        );
        const lagosList = lagosRows as any[];
        if (lagosList.length === 0) {
            console.error("Lagos State not found in organizations table.");
            process.exit(1);
        }
        const lagosId = lagosList[0].id;
        console.log(`Found Lagos State: ${lagosId}`);

        // 2. Locate Mushin LGA under Lagos State
        const [mushinRows] = await connection.execute(
            "SELECT id, name, code FROM organizations WHERE (name = 'Mushin' OR name LIKE '%Mushin%') AND level = 'LOCAL_GOVERNMENT' AND parentId = ?",
            [lagosId]
        );
        const mushinList = mushinRows as any[];
        if (mushinList.length === 0) {
            console.error("Mushin LGA not found under Lagos State in organizations table.");
            process.exit(1);
        }
        const mushin = mushinList[0];
        console.log(`Found Mushin LGA: ${mushin.name} (${mushin.id}, code: ${mushin.code})`);

        // 3. Check if Odiolowo branch already exists under Mushin LGA
        const [existingBranchRows] = await connection.execute(
            "SELECT id, name, code FROM organizations WHERE (LOWER(name) = 'odiolowo' OR LOWER(name) = 'odi-olowo') AND level = 'BRANCH' AND parentId = ?",
            [mushin.id]
        );
        const existingBranches = existingBranchRows as any[];

        if (existingBranches.length > 0) {
            console.log(`Odiolowo branch already exists under Mushin LGA: ${existingBranches[0].name} (${existingBranches[0].id}, code: ${existingBranches[0].code})`);
        } else {
            const branchId = uuidv4();
            const branchCode = `${mushin.code}-ODIOLOWO`;
            await connection.execute(
                `INSERT INTO organizations (id, name, level, code, parentId, state, country, createdAt, updatedAt)
                 VALUES (?, 'Odiolowo', 'BRANCH', ?, ?, 'Lagos', 'Nigeria', NOW(), NOW())`,
                [branchId, branchCode, mushin.id]
            );
            console.log(`Successfully created Odiolowo branch under Mushin LGA: ID ${branchId}, Code ${branchCode}`);
        }

        console.log("Done!");
    } catch (err) {
        console.error("Error adding Odiolowo branch:", err);
    } finally {
        await connection.end();
    }
}

main().catch(console.error);
