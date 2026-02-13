import "dotenv/config"
import { db } from "./lib/db"
import { roles, permissions, rolePermissions } from "./lib/db/schema"
import { eq } from "drizzle-orm"

const defaultRoles = [
    {
        name: 'National Admin',
        code: 'NATIONAL_ADMIN',
        description: 'National level administrator with full access to national jurisdiction',
        jurisdictionLevel: 'NATIONAL',
        isSystem: true,
        isActive: true
    },
    {
        name: 'State Admin',
        code: 'STATE_ADMIN',
        description: 'State level administrator with full access to state jurisdiction',
        jurisdictionLevel: 'STATE',
        isSystem: true,
        isActive: true
    },
    {
        name: 'Local Government Admin',
        code: 'LOCAL_GOVERNMENT_ADMIN',
        description: 'Local Government level administrator',
        jurisdictionLevel: 'LOCAL_GOVERNMENT',
        isSystem: true,
        isActive: true
    },
    {
        name: 'Branch Admin',
        code: 'BRANCH_ADMIN',
        description: 'Branch level administrator',
        jurisdictionLevel: 'BRANCH',
        isSystem: true,
        isActive: true
    },
    {
        name: 'National ICT Officer',
        code: 'NATIONAL_ICT_OFFICER',
        description: 'National level ICT administrator',
        jurisdictionLevel: 'NATIONAL',
        isSystem: true,
        isActive: true
    },
    {
        name: 'State ICT Officer',
        code: 'STATE_ICT_OFFICER',
        description: 'State level ICT administrator',
        jurisdictionLevel: 'STATE',
        isSystem: true,
        isActive: true
    },
    {
        name: 'Local Government ICT Officer',
        code: 'LOCAL_GOVERNMENT_ICT_OFFICER',
        description: 'Local Government level ICT administrator',
        jurisdictionLevel: 'LOCAL_GOVERNMENT',
        isSystem: true,
        isActive: true
    },
    {
        name: 'Official',
        code: 'OFFICIAL',
        description: 'Organization official with jurisdiction-based access',
        jurisdictionLevel: 'BRANCH',
        isSystem: true,
        isActive: true
    },
    {
        name: 'Member',
        code: 'MEMBER',
        description: 'Regular member with limited access',
        jurisdictionLevel: 'BRANCH',
        isSystem: true,
        isActive: true
    },
];

async function main() {
    console.log("Seeding roles...");

    for (const role of defaultRoles) {
        const existing = await db.select().from(roles).where(eq(roles.code, role.code)).limit(1);
        if (existing.length === 0) {
            await db.insert(roles).values(role as any);
            console.log(`Created role: ${role.name}`);
        } else {
            console.log(`Role already exists: ${role.name}`);
        }
    }
    console.log("Done.");
    process.exit(0);
}

main().catch(console.error);
