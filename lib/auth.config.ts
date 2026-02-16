import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    trustHost: true,
    secret: process.env.AUTH_SECRET,
    session: { strategy: "jwt" },
    pages: {
        signIn: "/auth/signin",
    },
    providers: [], // Providers are added in lib/auth.ts to avoid Node-specific imports here
} satisfies NextAuthConfig
