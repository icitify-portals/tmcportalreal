import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Session } from "next-auth";

export async function getOrganizationHierarchy(orgId: string) {
    const hierarchy: any[] = [];
    let currentId = orgId;

    while (currentId) {
        // Use db.select().from() instead of db.query to avoid mysql2 compatibility issues
        const orgs = await db.select({
            id: organizations.id,
            name: organizations.name,
            level: organizations.level,
            parentId: organizations.parentId
        })
            .from(organizations)
            .where(eq(organizations.id, currentId))
            .limit(1);

        const org = orgs[0];
        if (!org) break;

        hierarchy.unshift(org);
        currentId = org.parentId as string;
    }

    return hierarchy;
}

export function formatHierarchyNames(hierarchy: any[]) {
    // Sort logic usually unshift handles it (National -> State -> LGA -> Branch)
    return hierarchy.map(h => h.name).join(" > ");
}

/**
 * Determines the organization ID scope for the current user session.
 * 
 * Logic:
 * 1. If Super Admin -> Returns NULL (Global Scope)
 * 2. If Official -> Returns officialOrganizationId
 * 3. If Member/Role -> Returns matching organizationId from role or profile
 * 4. Fallback -> Returns NULL (Global Scope - use with caution or restrict access)
 */
export function getOrganizationScope(session: Session | null): string | null {
    if (!session?.user) return null;

    // 1. Super Admin has global access
    if (session.user.isSuperAdmin) {
        return null;
    }

    // 2. Check Official Profile
    if (session.user.officialOrganizationId) {
        return session.user.officialOrganizationId;
    }

    // 3. Check Explicit Admin Org ID (if set in session via role selection)
    if (session.user.organizationId) {
        return session.user.organizationId;
    }

    // 4. Check Roles
    if (session.user.roles && session.user.roles.length > 0) {
        // Find if any role has organizationId
        const orgRole = session.user.roles.find((r: any) => r.organizationId);
        if (orgRole && orgRole.organizationId) {
            return orgRole.organizationId;
        }
    }

    // Default to handling restriction at page level if no scope found
    // A null return here means "Scope is Global", so page should restrict if not super admin
    return null;
}
