"use client"

import { SessionProvider, SessionProviderProps } from "next-auth/react"
import { ThemeProvider } from "@/components/theme-provider"

export default function Providers({ children, session }: { children: React.ReactNode, session?: SessionProviderProps["session"] }) {
  return (
    <SessionProvider session={session}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </SessionProvider>
  )
}


