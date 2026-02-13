import "next-auth"
import "next-auth/jwt"

export type JurisdictionLevel = "SYSTEM" | "NATIONAL" | "STATE" | "LOCAL_GOVERNMENT" | "BRANCH"
export type OrgLevel = "NATIONAL" | "STATE" | "LOCAL" | "LOCAL_GOVERNMENT" | "BRANCH"

export interface UserRole {
  id: string
  name: string
  code: string
  jurisdictionLevel: JurisdictionLevel
  organizationId?: string | null
  organization?: {
    id: string
    name: string
    level: OrgLevel
    code: string
  } | null
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      image?: string | null
      roles?: UserRole[]
      permissions?: string[]
      isSuperAdmin?: boolean
      memberId?: string
      memberOrganizationId?: string
      memberStatus?: string
      officialId?: string
      officialOrganizationId?: string
      officialLevel?: string
      role?: string
      organizationId?: string
      country?: string
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    email: string
    name: string
    image?: string | null
    role?: string
    organizationId?: string
    country?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    roles?: UserRole[]
    permissions?: string[]
    isSuperAdmin?: boolean
    memberId?: string
    memberOrganizationId?: string
    memberStatus?: string
    officialId?: string
    officialOrganizationId?: string
    officialLevel?: string
  }
}

