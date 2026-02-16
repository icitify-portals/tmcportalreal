import { NextAuthConfig } from "next-auth"
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

export const authConfig: NextAuthConfig = {
  trustHost: true, // Required for NextAuth v5
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

        console.log(`[DEBUG] Login attempt for: ${email}`);

        // Simplified query - we only need credentials here
        const userResults = await db.select().from(users).where(eq(users.email, email)).limit(1)
        const user = userResults[0]

        if (!user) {
          console.log(`[DEBUG] User not found: ${email}`);
          return null
        }

        if (!user.password) {
          console.log(`[DEBUG] User has no password: ${email}`);
          return null
        }

        // Check if email is verified
        if (!user.emailVerified) {
          console.log(`[DEBUG] Email not verified: ${email}`);
          throw new Error("Please verify your email address before signing in. Check your inbox for the verification link.")
        }

        console.log(`[DEBUG] Comparing password for: ${email}`);
        const isPasswordValid = await bcrypt.compare(
          password,
          user.password
        )

        if (!isPasswordValid) {
          console.log(`[DEBUG] Invalid password for: ${email}`);
          return null
        }

        console.log(`[DEBUG] Login successful for: ${email}`);

        return {
          id: user.id,
          email: user.email,
          name: user.name || "",
          image: user.image || "",
          country: user.country || undefined, // Add country
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      try {
        if (user) {
          console.log(`[DEBUG] JWT Callback: Processing new login for user ${user.id}`);
          token.id = user.id
          token.country = user.country // Store in token

          // 1. Fetch User Roles & Permissions
          // We join userRoles -> roles -> rolePermissions -> permissions -> organizations
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
            .where(eq(userRoles.userId, user.id))

          console.log(`[DEBUG] JWT Callback: Found ${userRolesData.length} role/permission entries`);

          // Process roles and permissions
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

          console.log(`[DEBUG] JWT Callback: isSuperAdmin=${token.isSuperAdmin}`);

          // 2. Fetch Member Profile
          const memberProfileData = await db.select({
            id: members.id,
            organizationId: members.organizationId,
            status: members.status
          })
            .from(members)
            .where(eq(members.userId, user.id))
            .limit(1)

          if (memberProfileData.length > 0) {
            const profile = memberProfileData[0]
            token.memberId = profile.id
            token.memberOrganizationId = profile.organizationId
            token.memberStatus = profile.status || undefined
            console.log(`[DEBUG] JWT Callback: Found member profile ${profile.id}`);
          }

          // 3. Fetch Official Profile
          const officialProfileData = await db.select({
            id: officials.id,
            organizationId: officials.organizationId,
            positionLevel: officials.positionLevel
          })
            .from(officials)
            .where(eq(officials.userId, user.id))
            .limit(1)

          if (officialProfileData.length > 0) {
            const profile = officialProfileData[0]
            token.officialId = profile.id
            token.officialOrganizationId = profile.organizationId
            token.officialLevel = profile.positionLevel
            console.log(`[DEBUG] JWT Callback: Found official profile ${profile.id}`);
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
          console.log(`[DEBUG] Session Callback: Populating session for user ${token.id}`);
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
          // Add country to session user
          session.user.country = token.country as string | undefined
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
