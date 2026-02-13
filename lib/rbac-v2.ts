import { Session } from "next-auth"
import { db } from "@/lib/db"
import {
  userRoles,
  roles,
  rolePermissions,
  permissions,
  organizations
} from "@/lib/db/schema"
import { eq, and, or, isNull, gt } from "drizzle-orm"

// Define types based on schema enums
export type JurisdictionLevel = "SYSTEM" | "NATIONAL" | "STATE" | "LOCAL" | "LOCAL_GOVERNMENT" | "BRANCH"

export interface UserRole {
  id: string
  role: {
    id: string
    name: string
    code: string
    jurisdictionLevel: JurisdictionLevel
    rolePermissions: Array<{
      permission: {
        code: string
      }
      granted: boolean | null
    }>
  }
  organizationId: string | null
  organization: {
    id: string
    name: string
    level: string
    code: string
  } | null
}

export interface UserPermissions {
  roles: UserRole[]
  allPermissions: Set<string>
  jurisdictions: Map<string, JurisdictionLevel> // organizationId -> jurisdiction level
}

/**
 * Get all roles and permissions for a user
 */
export async function getUserPermissions(userId: string): Promise<UserPermissions> {
  const rows = await db
    .select({
      userRole: userRoles,
      role: roles,
      organization: organizations,
      permission: permissions,
      rolePermission: rolePermissions,
    })
    .from(userRoles)
    .leftJoin(roles, eq(userRoles.roleId, roles.id))
    .leftJoin(organizations, eq(userRoles.organizationId, organizations.id))
    .leftJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
    .leftJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(
      and(
        eq(userRoles.userId, userId),
        eq(userRoles.isActive, true),
        or(isNull(userRoles.expiresAt), gt(userRoles.expiresAt, new Date())),
        eq(roles.isActive, true),
        // We only care about granted permissions that are active
        or(
          isNull(rolePermissions.id), // Allow roles with no permissions yet
          and(
            eq(rolePermissions.granted, true),
            eq(permissions.isActive, true)
          )
        )
      )
    );

  const allPermissions = new Set<string>();
  const jurisdictions = new Map<string, JurisdictionLevel>();
  const validRolesMap = new Map<string, UserRole>();

  rows.forEach((row) => {
    // 1. Collect Permissions
    if (row.permission && row.permission.code) {
      allPermissions.add(row.permission.code);
    }

    // 2. Build UserRole objects (deduplicate by userRole.id)
    if (row.userRole && row.role) {
      if (!validRolesMap.has(row.userRole.id)) {
        validRolesMap.set(row.userRole.id, {
          id: row.userRole.id,
          role: {
            id: row.role.id,
            name: row.role.name,
            code: row.role.code,
            jurisdictionLevel: row.role.jurisdictionLevel as JurisdictionLevel,
            rolePermissions: [], // populated below if needed, but we mostly need the Set
          },
          organizationId: row.userRole.organizationId,
          organization: row.organization
            ? {
              id: row.organization.id,
              name: row.organization.name,
              level: row.organization.level,
              code: row.organization.code,
            }
            : null,
        });
      }

      // Add permission to the specific role structure if helpful (optional for the return type structure, but good for completeness)
      if (row.permission) {
        const userRole = validRolesMap.get(row.userRole.id);
        userRole?.role.rolePermissions.push({
          permission: { code: row.permission.code },
          granted: true
        })
      }
    }

    // 3. Track Jurisdictions
    if (row.userRole && row.userRole.organizationId && row.role) {
      jurisdictions.set(
        row.userRole.organizationId,
        row.role.jurisdictionLevel as JurisdictionLevel
      );
    }
  });

  return {
    roles: Array.from(validRolesMap.values()),
    allPermissions,
    jurisdictions,
  };
}

/**
 * Check if user has a specific permission
 */
export async function hasPermission(
  userId: string,
  permission: string,
  organizationId?: string
): Promise<boolean> {
  const userPerms = await getUserPermissions(userId)

  // SuperAdmin (SYSTEM level) has all permissions
  const hasSuperAdmin = userPerms.roles.some(
    (r) => r.role.jurisdictionLevel === "SYSTEM"
  )
  if (hasSuperAdmin) return true

  // Check if user has the permission
  if (!userPerms.allPermissions.has(permission)) {
    return false
  }

  // If organizationId is specified, check jurisdiction
  if (organizationId) {
    return canAccessOrganization(userId, organizationId)
  }

  return true
}

/**
 * Check if user can access a specific organization based on jurisdiction
 */
export async function canAccessOrganization(
  userId: string,
  organizationId: string
): Promise<boolean> {
  const userPerms = await getUserPermissions(userId)

  // SuperAdmin can access all
  const hasSuperAdmin = userPerms.roles.some(
    (r) => r.role.jurisdictionLevel === "SYSTEM"
  )
  if (hasSuperAdmin) return true

  // Get the organization
  const organization = await db.query.organizations.findFirst({
    where: eq(organizations.id, organizationId),
    with: {
      parent: true,
    },
  })

  if (!organization) return false

  // Check if user has a role for this organization or its parents
  for (const userRole of userPerms.roles) {
    if (!userRole.organizationId) continue

    // Direct match
    if (userRole.organizationId === organizationId) {
      return true
    }

    // Check if organization is within user's jurisdiction
    const canAccess = await checkJurisdictionAccess(
      userRole.organizationId,
      userRole.role.jurisdictionLevel,
      organizationId,
      organization.level
    )

    if (canAccess) return true
  }

  return false
}

/**
 * Check if a role's jurisdiction allows access to a target organization
 */
async function checkJurisdictionAccess(
  userOrgId: string,
  jurisdictionLevel: JurisdictionLevel,
  targetOrgId: string,
  targetLevel: string
): Promise<boolean> {
  // Get organization hierarchy
  const userOrg = await db.query.organizations.findFirst({
    where: eq(organizations.id, userOrgId),
  })

  if (!userOrg) return false

  // Build hierarchy path for target org
  // Drizzle doesn't support recursive includes easily, but we can nest a few levels
  const targetOrg = await db.query.organizations.findFirst({
    where: eq(organizations.id, targetOrgId),
    with: {
      parent: {
        with: {
          parent: {
            with: {
              parent: true,
            },
          },
        },
      },
    },
  })

  if (!targetOrg) return false

  // Check if target is within user's organization hierarchy
  const hierarchy = [
    targetOrg.parent?.parent?.parent?.id,
    targetOrg.parent?.parent?.id,
    targetOrg.parent?.id,
    targetOrgId,
  ].filter(Boolean)

  return hierarchy.includes(userOrgId)
}

/**
 * Check if user has a specific role
 */
export async function hasRole(
  userId: string,
  roleCode: string,
  organizationId?: string
): Promise<boolean> {
  const conditions = [
    eq(userRoles.userId, userId),
    eq(userRoles.isActive, true)
  ]

  if (organizationId) {
    conditions.push(eq(userRoles.organizationId, organizationId))
  }

  // To check role code, we need to join or look up role first. 
  // Drizzle findMany on userRoles with 'with' role filtering is limited.
  // We fetch roles and filter in memory.
  const validRoles = await db.query.userRoles.findMany({
    where: and(...conditions),
    with: {
      role: true
    }
  })

  // Filter out where role relation returned null or doesn't match code/active
  return validRoles.some(ur => ur.role && ur.role.code === roleCode && ur.role.isActive)
}

/**
 * Get all roles for a user
 */
export async function getUserRoles(userId: string) {
  const allRoles = await db.query.userRoles.findMany({
    where: and(
      eq(userRoles.userId, userId),
      eq(userRoles.isActive, true)
    ),
    with: {
      role: true,
      organization: true
    },
  })

  return allRoles.filter(ur => ur.role && ur.role.isActive)
}

/**
 * Session-based permission check (for use in API routes)
 */
export function requirePermission(
  session: Session | null,
  permission: string,
  organizationId?: string
): Session {
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  // Check permissions from session (loaded in auth.ts)
  const userPerms = session.user.permissions || []
  const hasSuperAdmin = session.user.roles?.some(
    (r: any) => r.jurisdictionLevel === "SYSTEM"
  )

  if (hasSuperAdmin) {
    return session
  }

  if (!userPerms.includes(permission)) {
    throw new Error(`Forbidden: ${permission} permission required`)
  }

  return session
}

/**
 * Require user to have a specific role
 */
export function requireRole(
  session: Session | null,
  roleCode: string
): Session {
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  const userRoles = session.user.roles || []
  const hasRole = userRoles.some((r: any) => r.code === roleCode)

  if (!hasRole) {
    throw new Error(`Forbidden: ${roleCode} role required`)
  }

  return session
}


