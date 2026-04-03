import { NextAuthConfig } from "next-auth"
import { authConfig as baseConfig } from "./auth.config"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import type { Adapter } from "next-auth/adapters"
import CredentialsProvider from "next-auth/providers/credentials"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { UserRole } from "@/types/next-auth"
import {
  users,
  accounts,
  sessions,
  verificationTokens,
  members,
  officials,
  userRoles,
  roles,
  rolePermissions,
  permissions,
  organizations
} from "@/lib/db/schema"
import { eq } from "drizzle-orm"

// Helper to populate roles, members, and officials into the token
async function populateTokenData(userId: string, token: any) {
  // 1. Fetch User Roles & Permissions
  const userRolesData = await db.select({
    roleId: roles.id,
    roleName: roles.name,
    roleCode: roles.code,
    jurisdictionLevel: roles.jurisdictionLevel,
    organizationId: userRoles.organizationId,
    orgName: organizations.name,
    permissionCode: permissions.code,
    permissionGranted: rolePermissions.granted
  })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .leftJoin(organizations, eq(userRoles.organizationId, organizations.id))
    .leftJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
    .leftJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(userRoles.userId, userId))

  const allPermissions = new Set<string>()
  const processedRoles = new Map<string, any>()

  userRolesData.forEach(row => {
    // Add permission if granted
    if (row.permissionCode && row.permissionGranted) {
      allPermissions.add(row.permissionCode)
    }

    // Build unique roles list
    const roleKey = `${row.roleId}-${row.organizationId}`
    if (!processedRoles.has(roleKey)) {
      processedRoles.set(roleKey, {
        id: row.roleId,
        name: row.roleName,
        code: row.roleCode,
        jurisdictionLevel: row.jurisdictionLevel,
        organizationId: row.organizationId,
        organization: row.organizationId ? {
          id: row.organizationId,
          name: row.orgName
        } : null
      })
    }
  })

  const rolesList = Array.from(processedRoles.values())
  token.roles = rolesList
  token.permissions = Array.from(allPermissions)
  token.isSuperAdmin = rolesList.some((r) => r.jurisdictionLevel === "SYSTEM")

  // Reset member/official data before repopulating
  token.memberId = undefined
  token.memberOrganizationId = undefined
  token.memberStatus = undefined
  token.officialId = undefined
  token.officialOrganizationId = undefined
  token.officialLevel = undefined

  // 2. Fetch Member Profile
  const memberProfileData = await db.select({
    id: members.id,
    organizationId: members.organizationId,
    status: members.status
  })
    .from(members)
    .where(eq(members.userId, userId))
    .limit(1)

  if (memberProfileData.length > 0) {
    const profile = memberProfileData[0]
    token.memberId = profile.id
    token.memberOrganizationId = profile.organizationId
    token.memberStatus = profile.status || undefined
  }

  // 3. Fetch Official Profile
  const officialProfileData = await db.select({
    id: officials.id,
    organizationId: officials.organizationId,
    positionLevel: officials.positionLevel
  })
    .from(officials)
    .where(eq(officials.userId, userId))
    .limit(1)

  if (officialProfileData.length > 0) {
    const profile = officialProfileData[0]
    token.officialId = profile.id
    token.officialOrganizationId = profile.organizationId
    token.officialLevel = profile.positionLevel
  }

  return token
}

export const authConfig: NextAuthConfig = {
  ...baseConfig,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }) as Adapter,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email as string
        const password = credentials.password as string

        const userResults = await db.select().from(users).where(eq(users.email, email)).limit(1)
        const user = userResults[0]

        if (!user) {
          throw new Error("User with this email not found. Please sign up if you don't have an account.")
        }

        if (!user.password) {
          throw new Error("This account does not have a password set. Try another sign-in method.")
        }

        if (!user.emailVerified) {
          throw new Error("Please verify your email address before signing in. Check your inbox for the verification link.")
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)

        if (!isPasswordValid) {
          throw new Error("Incorrect password. Please try again or reset your password.")
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name || "",
          image: user.image || "",
          country: user.country || undefined,
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      try {
        if (user) {
          token.id = user.id
          token.country = user.country
          token = await populateTokenData(user.id, token)
        }

        if (trigger === "update" && session?.action === "impersonate" && token.isSuperAdmin) {
          const targetUserId = session.targetUserId
          const userResults = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1)
          const targetUser = userResults[0]
          
          if (targetUser) {
             token.impersonatorId = token.id // save current admin
             token.id = targetUser.id
             token.country = targetUser.country
             token = await populateTokenData(targetUser.id, token)
          }
        }

        if (trigger === "update" && session?.action === "revert_impersonate" && token.impersonatorId) {
          const revertId = token.impersonatorId as string
          const userResults = await db.select().from(users).where(eq(users.id, revertId)).limit(1)
          const originalAdmin = userResults[0]

          if (originalAdmin) {
             token.id = originalAdmin.id
             token.country = originalAdmin.country
             token.impersonatorId = undefined
             token = await populateTokenData(originalAdmin.id, token)
          }
        }

        return token
      } catch (error) {
        console.error("[DEBUG] JWT Callback Error:", error);
        return token;
      }
    },
    async session({ session, token }) {
      try {
        if (session.user) {
          session.user.id = token.id as string
          session.user.roles = token.roles as UserRole[] || undefined
          session.user.permissions = token.permissions as string[] | undefined
          session.user.isSuperAdmin = token.isSuperAdmin as boolean
          session.user.memberId = token.memberId as string | undefined
          session.user.memberOrganizationId = token.memberOrganizationId as string | undefined
          session.user.memberStatus = token.memberStatus as string | undefined
          session.user.officialId = token.officialId as string | undefined
          session.user.officialOrganizationId = token.officialOrganizationId as string | undefined
          session.user.officialLevel = token.officialLevel as string | undefined
          session.user.country = token.country as string | undefined
          session.user.impersonatorId = token.impersonatorId as string | undefined
        }
        return session
      } catch (error) {
        console.error("[DEBUG] Session Callback Error:", error);
        return session;
      }
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
}
