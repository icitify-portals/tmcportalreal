import "dotenv/config"
import { db } from "../lib/db"
import { permissions, roles, rolePermissions, userRoles, users } from "../lib/db/schema"
import { eq, and } from "drizzle-orm"
import { v4 as uuidv4 } from 'uuid'

// System Permissions
const systemPermissions = [
    // Role Management
    { code: "roles:read", name: "Read Roles", category: "Roles", description: "View roles and permissions" },
    { code: "roles:create", name: "Create Role", category: "Roles", description: "Create new roles" },
    { code: "roles:update", name: "Update Role", category: "Roles", description: "Update existing roles" },
    { code: "roles:delete", name: "Delete Role", category: "Roles", description: "Delete roles" },

    // User Management (Basic)
    { code: "users:read", name: "Read Users", category: "Users", description: "View users list" },

    // Member Management
    { code: "members:read", name: "Read Members", category: "Members", description: "View members list" },

    // Official Management
    { code: "officials:read", name: "Read Officials", category: "Officials", description: "View officials list" },
    { code: "officials:write", name: "Manage Officials", category: "Officials", description: "Create and update officials" },
]

async function seed() {
    console.log("Seeding RBAC...")

    // 1. Ensure Permissions Exist
    for (const perm of systemPermissions) {
        const existing = await db.query.permissions.findFirst({
            where: eq(permissions.code, perm.code)
        })

        if (!existing) {
            console.log(`Creating permission: ${perm.code}`)
            await db.insert(permissions).values({
                code: perm.code,
                name: perm.name,
                category: perm.category,
                description: perm.description,
            })
        }
    }

    // 2. Ensure Super Admin Role Exists
    let superAdminRole = await db.query.roles.findFirst({
        where: eq(roles.code, "SUPER_ADMIN")
    })

    if (!superAdminRole) {
        console.log("Creating SUPER_ADMIN role")
        const newId = uuidv4()
        await db.insert(roles).values({
            id: newId,
            name: "Super Administrator",
            code: "SUPER_ADMIN",
            description: "System Root Role with all capabilities",
            jurisdictionLevel: "SYSTEM",
            isSystem: true,
        })
        // Fetch it back
        superAdminRole = await db.query.roles.findFirst({ where: eq(roles.id, newId) })
    }

    // 3. Assign All System Permissions to Super Admin (Wait, system roles are implicitly strict? No, RBAC usually specific)
    // Actually, my `hasPermission` logic says: 
    // "SuperAdmin (SYSTEM level) has all permissions"
    // So I don't technically need to link them in `rolePermissions` for logic to work, 
    // BUT for the UI matrix to show checked boxes, I SHOULD link them.

    if (superAdminRole) {
        const allPerms = await db.query.permissions.findMany()

        for (const perm of allPerms) {
            const existingLink = await db.query.rolePermissions.findFirst({
                where: and(
                    eq(rolePermissions.roleId, superAdminRole.id),
                    eq(rolePermissions.permissionId, perm.id)
                )
            })

            if (!existingLink) {
                await db.insert(rolePermissions).values({
                    roleId: superAdminRole.id,
                    permissionId: perm.id,
                    granted: true
                })
            }
        }
    }

    console.log("RBAC Seed Completed.")
    process.exit(0)
}

seed().catch((err) => {
    console.error(err)
    process.exit(1)
})
