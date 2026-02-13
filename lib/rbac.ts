import { Session } from "next-auth"

// Define AdminLevel logic locally or based on official levels
export type AdminLevel = "SUPER_ADMIN" | "NATIONAL" | "STATE" | "LOCAL" | "LOCAL_GOVERNMENT" | "BRANCH"

export type Permission =
  | "members:create"
  | "members:read"
  | "members:update"
  | "members:delete"
  | "members:approve"
  | "officials:create"
  | "officials:read"
  | "officials:update"
  | "officials:delete"
  | "admins:create"
  | "admins:read"
  | "admins:update"
  | "admins:delete"
  | "organizations:create"
  | "organizations:read"
  | "organizations:update"
  | "organizations:delete"
  | "payments:create"
  | "payments:read"
  | "payments:update"
  | "documents:create"
  | "documents:read"
  | "documents:update"
  | "documents:delete"
  | "audit:read"
  | "reports:read"
  | "reports:generate"

// ... imports

export function hasPermission(
  session: Session | null,
  permission: Permission
): boolean {
  if (!session?.user) return false

  // Super admin has all permissions
  if (session.user.isSuperAdmin) return true

  // Check explicit permissions
  if (session.user.permissions?.includes(permission)) return true

  // Check role-based permissions (via official level or roles)
  if (session.user.officialLevel) {
    const adminPermissions = getAdminPermissions(session.user.officialLevel as AdminLevel)
    return adminPermissions.includes(permission)
  }

  return false
}

export function getAdminPermissions(level: AdminLevel | undefined): Permission[] {
  // ... existing logic ...
  if (!level) return []

  const basePermissions: Permission[] = [
    "members:read",
    "officials:read",
    "organizations:read",
    "payments:read",
    "documents:read",
  ]
  // ... switch case remains valid if AdminLevel matches strings
  switch (level) {
    case "SUPER_ADMIN":
      return [
        ...basePermissions,
        "members:create",
        "members:update",
        "members:delete",
        "members:approve",
        "officials:create",
        "officials:update",
        "officials:delete",
        "admins:create",
        "admins:read",
        "admins:update",
        "admins:delete",
        "organizations:create",
        "organizations:update",
        "organizations:delete",
        "payments:create",
        "payments:update",
        "documents:create",
        "documents:update",
        "documents:delete",
        "audit:read",
        "reports:read",
        "reports:generate",
      ]
    case "NATIONAL":
      return [
        ...basePermissions,
        "members:create",
        "members:update",
        "members:approve",
        "officials:create",
        "officials:update",
        "organizations:read",
        "organizations:update",
        "payments:create",
        "payments:update",
        "documents:create",
        "documents:update",
        "audit:read",
        "reports:read",
        "reports:generate",
      ]
    case "STATE":
      return [
        ...basePermissions,
        "members:create",
        "members:update",
        "members:approve",
        "officials:read",
        "organizations:read",
        "payments:create",
        "payments:update",
        "documents:create",
        "documents:update",
        "reports:read",
      ]
    case "LOCAL":
      return [
        ...basePermissions,
        "members:create",
        "members:update",
        "payments:create",
        "documents:create",
        "documents:update",
      ]
    default:
      return basePermissions
  }
  // To avoid re-writing the whole switch, I'll trust it matches string values.
  return basePermissions
}


export function canAccessOrganization(
  session: Session | null,
  organizationId: string
): boolean {
  if (!session?.user) return false

  // Super admin can access all
  if (session.user.isSuperAdmin) return true

  // Check if user's organization matches
  if (session.user.officialOrganizationId === organizationId) return true
  if (session.user.memberOrganizationId === organizationId) return true

  return false
}

export function requireAuth(session: Session | null): Session {
  if (!session?.user) {
    throw new Error("Unauthorized")
  }
  return session
}

export function requireAdmin(session: Session | null): Session {
  const authSession = requireAuth(session)
  if (!authSession.user.isSuperAdmin && !authSession.user.officialLevel) {
    throw new Error("Forbidden: Admin access required")
  }
  return authSession
}

export function requirePermission(
  session: Session | null,
  permission: Permission
): Session {
  const authSession = requireAuth(session)
  if (!hasPermission(authSession, permission)) {
    throw new Error(`Forbidden: ${permission} permission required`)
  }
  return authSession
}

