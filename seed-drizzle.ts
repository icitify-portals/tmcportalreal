
import 'dotenv/config';
import { db } from "@/lib/db";
import { organizations, permissions, roles, rolePermissions, navigationItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
    console.log('🌱 Seeding database via Drizzle...');

    // 1. Permissions
    const permissiondata = [
        // Members
        { code: 'members:create', name: 'Create Members', category: 'members', description: 'Create new member accounts' },
        { code: 'members:read', name: 'View Members', category: 'members', description: 'View member information' },
        { code: 'members:update', name: 'Update Members', category: 'members', description: 'Update member information' },
        { code: 'members:delete', name: 'Delete Members', category: 'members', description: 'Delete member accounts' },
        { code: 'members:approve', name: 'Approve Members', category: 'members', description: 'Approve pending member applications' },

        // Officials
        { code: 'officials:create', name: 'Create Officials', category: 'officials', description: 'Create official positions' },
        { code: 'officials:read', name: 'View Officials', category: 'officials', description: 'View official information' },
        { code: 'officials:update', name: 'Update Officials', category: 'officials', description: 'Update official information' },
        { code: 'officials:delete', name: 'Delete Officials', category: 'officials', description: 'Remove officials' },

        // Roles & Permissions
        { code: 'roles:create', name: 'Create Roles', category: 'roles', description: 'Create new roles' },
        { code: 'roles:read', name: 'View Roles', category: 'roles', description: 'View roles and permissions' },
        { code: 'roles:update', name: 'Update Roles', category: 'roles', description: 'Update role information' },
        { code: 'roles:delete', name: 'Delete Roles', category: 'roles', description: 'Delete roles' },
        { code: 'roles:assign', name: 'Assign Roles', category: 'roles', description: 'Assign roles to users' },
        { code: 'permissions:manage', name: 'Manage Permissions', category: 'roles', description: 'Manage role permissions' },

        // Organizations
        { code: 'organizations:create', name: 'Create Organizations', category: 'organizations', description: 'Create new organizations' },
        { code: 'organizations:read', name: 'View Organizations', category: 'organizations', description: 'View organization information' },
        { code: 'organizations:update', name: 'Update Organizations', category: 'organizations', description: 'Update organization information' },
        { code: 'organizations:delete', name: 'Delete Organizations', category: 'organizations', description: 'Delete organizations' },

        // Payments
        { code: 'payments:create', name: 'Create Payments', category: 'payments', description: 'Create payment records' },
        { code: 'payments:read', name: 'View Payments', category: 'payments', description: 'View payment information' },
        { code: 'payments:update', name: 'Update Payments', category: 'payments', description: 'Update payment records' },
        { code: 'payments:refund', name: 'Refund Payments', category: 'payments', description: 'Process refunds' },

        // Documents
        { code: 'documents:create', name: 'Upload Documents', category: 'documents', description: 'Upload documents' },
        { code: 'documents:read', name: 'View Documents', category: 'documents', description: 'View documents' },
        { code: 'documents:update', name: 'Update Documents', category: 'documents', description: 'Update document information' },
        { code: 'documents:delete', name: 'Delete Documents', category: 'documents', description: 'Delete documents' },

        // Audit & Reports
        { code: 'audit:read', name: 'View Audit Logs', category: 'audit', description: 'View system audit logs' },
        { code: 'reports:read', name: 'View Reports', category: 'reports', description: 'View reports' },
        { code: 'reports:generate', name: 'Generate Reports', category: 'reports', description: 'Generate new reports' },

        // Users
        { code: 'users:create', name: 'Create Users', category: 'users', description: 'Create user accounts' },
        { code: 'users:read', name: 'View Users', category: 'users', description: 'View user information' },
        { code: 'users:update', name: 'Update Users', category: 'users', description: 'Update user accounts' },
        { code: 'users:delete', name: 'Delete Users', category: 'users', description: 'Delete user accounts' },
    ];

    console.log('Syncing permissions...');
    for (const perm of permissiondata) {
        // Drizzle doesn't have native upsert in simple query builder, we check first
        const existing = await db.query.permissions.findFirst({ where: eq(permissions.code, perm.code) });
        if (!existing) {
            await db.insert(permissions).values(perm);
        }
    }

    // 2. Roles
    const rolesData = [
        {
            name: 'Super Admin',
            code: 'SUPER_ADMIN',
            description: 'Full system access with no jurisdiction limits',
            jurisdictionLevel: 'SYSTEM' as const,
            isSystem: true,
            permissions: permissiondata.map(p => p.code),
        },
        {
            name: 'National Admin',
            code: 'NATIONAL_ADMIN',
            description: 'National level administrator with full access to national jurisdiction',
            jurisdictionLevel: 'NATIONAL' as const,
            isSystem: true,
            permissions: [
                'members:create', 'members:read', 'members:update', 'members:approve',
                'officials:create', 'officials:read', 'officials:update',
                'organizations:read', 'organizations:update',
                'payments:create', 'payments:read', 'payments:update',
                'documents:create', 'documents:read', 'documents:update',
                'audit:read', 'reports:read', 'reports:generate',
                'roles:read', 'roles:assign',
            ],
        },
        {
            name: 'State Admin',
            code: 'STATE_ADMIN',
            description: 'State level administrator with full access to state jurisdiction',
            jurisdictionLevel: 'STATE' as const,
            isSystem: true,
            permissions: [
                'members:create', 'members:read', 'members:update', 'members:approve',
                'officials:read',
                'organizations:read',
                'payments:create', 'payments:read', 'payments:update',
                'documents:create', 'documents:read', 'documents:update',
                'reports:read',
            ],
        },
        {
            name: 'Local Government Admin',
            code: 'LOCAL_GOVERNMENT_ADMIN',
            description: 'Local Government level administrator',
            jurisdictionLevel: 'LOCAL_GOVERNMENT' as const,
            isSystem: true,
            permissions: [
                'members:create', 'members:read', 'members:update',
                'payments:create', 'payments:read',
                'documents:create', 'documents:read', 'documents:update',
            ],
        },
        {
            name: 'Branch Admin',
            code: 'BRANCH_ADMIN',
            description: 'Branch level administrator',
            jurisdictionLevel: 'BRANCH' as const,
            isSystem: true,
            permissions: [
                'members:create', 'members:read', 'members:update',
                'payments:create', 'payments:read',
                'documents:create', 'documents:read',
            ],
        },
        {
            name: 'Official',
            code: 'OFFICIAL',
            description: 'Organization official with jurisdiction-based access',
            jurisdictionLevel: 'BRANCH' as const,
            isSystem: true,
            permissions: [
                'members:read',
                'payments:read',
                'documents:read',
                'reports:read',
            ],
        },
        {
            name: 'Member',
            code: 'MEMBER',
            description: 'Regular member with limited access',
            jurisdictionLevel: 'BRANCH' as const,
            isSystem: true,
            permissions: [
                'members:read',
                'payments:read',
                'documents:read',
            ],
        },
    ];

    console.log('Syncing roles...');
    for (const r of rolesData) {
        // Check role
        let role = await db.query.roles.findFirst({ where: eq(roles.code, r.code) });
        if (!role) {
            // insert
            const { permissions: _p, ...roleInfo } = r;
            await db.insert(roles).values(roleInfo);
            role = await db.query.roles.findFirst({ where: eq(roles.code, r.code) });
        }

        if (role) {
            // Assign permissions
            for (const permCode of r.permissions) {
                const perm = await db.query.permissions.findFirst({ where: eq(permissions.code, permCode) });
                if (perm) {
                    // Check link
                    // NOTE: Drizzle queries on junction tables are tricky if no explicit relation object in schema except via relations.
                    // We can query table direct. BUT schema.ts defines rolePermissions table.
                    // Wait, schema.ts defines `rolePermissions`.
                    // Let's use it.
                    // The id composite key is handled by UUID primary key in schema?
                    // schema.ts: `id: varchar("id")...primaryKey()`
                    // So we query by roleId and permissionId.

                    // Wait, schema definition of lookup on junction table:
                    // `rolePermissions` table.
                    // BUT `db.query.rolePermissions` method might not exist if it's not exported to `db` object?
                    // `db` usually imports `* as schema`.

                    // Verify: `import { rolePermissions } from "@/lib/db/schema"`
                    // Query: `db.select().from(rolePermissions).where(...)`

                    // Simple check:
                    try {
                        /* 
                           We can't easily check for existence with complex where in `db.query` if relations aren't perfect.
                           But we can use `db.select()...`
                        */
                        // For now, let's just use try-catch insert if unique constraint (roleId, permissionId) exists.
                        // schema.ts: `@@unique([roleId, permissionId])` -> constraint exists in Prisma, 
                        // In Drizzle schema.ts: `uniqueIndex` might be missing on the junction in my view earlier.
                        // Let's check schema.ts content in memory.
                        // rolePermissions has `id` PK. No explicit unique index in Drizzle schema shown in previous view?
                        // Wait, I see lines 300-307. No unique index defined in Drizzle!
                        // This means we might insert duplicates if we aren't careful.

                        // Let's check if we can find one.
                        // We need `and(eq(...), eq(...))` from drizzle-orm.
                        const { and } = await import("drizzle-orm");

                        const existingLink = await db.select().from(rolePermissions).where(
                            and(
                                eq(rolePermissions.roleId, role.id),
                                eq(rolePermissions.permissionId, perm.id)
                            )
                        );

                        if (existingLink.length === 0) {
                            await db.insert(rolePermissions).values({
                                roleId: role.id,
                                permissionId: perm.id,
                                granted: true
                            });
                        }
                    } catch (e) {
                        console.error(`Failed to assign permission ${permCode} to role ${r.code}`, e);
                    }
                }
            }
        }
    }

    // 3. Navigation Items
    console.log('Syncing navigation items...');
    const nationalOrg = await db.query.organizations.findFirst({ where: eq(organizations.code, 'TMC-NAT') });

    if (nationalOrg) {
        const MENU_ITEMS = [
            { label: "Home", path: "/", order: 0, type: "link" },
            { label: "Dashboard", path: "/dashboard", order: 1, type: "link" },
            { label: "Constitution", path: "/constitution", order: 2, type: "link" },
            { label: "Adhkar Centres", path: "/adhkar", order: 3, type: "link" },
            { label: "Teskiyah Centres", path: "/teskiyah", order: 4, type: "link" },
            { label: "Connect", path: "/connect", order: 5, type: "link" },
            { label: "Events", path: "/programmes", order: 6, type: "link" },
            { label: "Donate", path: "/donate", order: 7, type: "link" },
            { label: "Media Library", path: "/media", order: 8, type: "link" },
        ];

        const { and } = await import("drizzle-orm");

        for (const item of MENU_ITEMS) {
            const existingNav = await db.query.navigationItems.findFirst({
                where: and(
                    eq(navigationItems.label, item.label),
                    eq(navigationItems.organizationId, nationalOrg.id)
                )
            });

            if (!existingNav) {
                await db.insert(navigationItems).values({
                    label: item.label,
                    path: item.path,
                    order: item.order,
                    type: item.type as any,
                    isActive: true,
                    organizationId: nationalOrg.id
                });
            }
        }
    }

    console.log('✅ Seeding complete via Drizzle!');
    process.exit(0);
}

main();
