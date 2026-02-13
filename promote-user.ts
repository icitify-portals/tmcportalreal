import "dotenv/config"
import { db } from "./lib/db"
import { users, userRoles, roles } from "./lib/db/schema"
import { eq } from "drizzle-orm"

const TARGET_EMAIL = "aa.adelopo@gmail.com"

async function main() {
    console.log(`🔍 Looking for user: ${TARGET_EMAIL}`)

    const user = await db.query.users.findFirst({
        where: eq(users.email, TARGET_EMAIL)
    })

    if (!user) {
        console.error("❌ User not found!")
        process.exit(1)
    }

    console.log(`✅ User found: ${user.name} (${user.id})`)

    // 1. Verify Email
    if (!user.emailVerified) {
        console.log("Updating emailVerified...")
        await db.update(users)
            .set({ emailVerified: new Date() })
            .where(eq(users.id, user.id))
        console.log("✅ Email verified")
    } else {
        console.log("ℹ️ Email already verified")
    }

    // 2. Get Super Admin Role
    const superAdminRole = await db.query.roles.findFirst({
        where: eq(roles.code, "SUPER_ADMIN")
    })

    if (!superAdminRole) {
        console.error("❌ SUPER_ADMIN role not found in DB!")
        process.exit(1)
    }

    // 3. Assign Role
    const existingRole = await db.query.userRoles.findFirst({
        where: (ur, { and, eq }) => and(
            eq(ur.userId, user.id),
            eq(ur.roleId, superAdminRole.id)
        )
    })

    if (!existingRole) {
        console.log("Assigning SUPER_ADMIN role...")
        await db.insert(userRoles).values({
            userId: user.id,
            roleId: superAdminRole.id,
            assignedBy: "SYSTEM_SCRIPT" // Audit trail
        })
        console.log("✅ Role assigned")
    } else {
        console.log("ℹ️ User already has SUPER_ADMIN role")
    }

    console.log("🎉 User promotion complete!")
}

main()
    .catch(e => {
        console.error("❌ Script failed:", e)
        process.exit(1)
    })
    .then(() => process.exit(0))
