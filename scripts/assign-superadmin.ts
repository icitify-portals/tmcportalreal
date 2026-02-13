import "dotenv/config"
import { db } from "../lib/db"
import { users, roles, userRoles } from "../lib/db/schema"
import { eq } from "drizzle-orm"

const TARGET_EMAIL = "aa.adelopo@gmail.com"

async function assignSuperAdmin() {
    console.log(`Looking for user: ${TARGET_EMAIL}...`)

    // Use select to pick specific columns to avoid errors if schema mismatches (e.g. missing country)
    const usersFound = await db.select({
        id: users.id,
        name: users.name,
        email: users.email
    })
        .from(users)
        .where(eq(users.email, TARGET_EMAIL))
        .limit(1)

    const user = usersFound[0]

    if (!user) {
        console.error(`User with email ${TARGET_EMAIL} not found.`)
        process.exit(1)
    }

    console.log(`Found user: ${user.name} (${user.id})`)

    const superAdminRole = await db.query.roles.findFirst({
        where: eq(roles.code, "SUPER_ADMIN")
    })

    if (!superAdminRole) {
        console.error("SUPER_ADMIN role not found. Please run seed-rbac.ts first.")
        process.exit(1)
    }

    // Check if already assigned
    const existingAssignment = await db.query.userRoles.findFirst({
        where: (ur, { and, eq }) => and(
            eq(ur.userId, user.id),
            eq(ur.roleId, superAdminRole.id)
        )
    })

    if (existingAssignment) {
        console.log("User is already a Super Admin.")
        process.exit(0)
    }

    console.log("Assigning SUPER_ADMIN role...")
    await db.insert(userRoles).values({
        userId: user.id,
        roleId: superAdminRole.id,
        isActive: true,
    })

    console.log("Successfully assigned SUPER_ADMIN role.")
    process.exit(0)
}

assignSuperAdmin().catch(console.error)
