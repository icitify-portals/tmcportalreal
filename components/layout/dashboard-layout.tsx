"use client"
import React, { useState, useEffect } from "react"

import { useSession } from "next-auth/react"
import { Sidebar } from "./sidebar"
import { Toaster } from "@/components/ui/sonner"
import { NotificationBell } from "@/components/layout/notification-bell"
import { AiChatWidget } from "@/components/ai/ai-chat-widget"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { NotificationListener } from "@/components/dashboard/notification-listener"
import { ImpersonationBanner } from "./impersonation-banner"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { data: session, status } = useSession()
  const [mounted, setMounted] = useState(false)
  const [overrideRole, setOverrideRole] = useState<"admin" | "member" | "official" | "council" | null>(null)

  useEffect(() => {
    setMounted(true)
    const savedMode = localStorage.getItem('tmc_view_mode') as "admin" | "member" | "official" | "council" | null
    if (savedMode) {
      setOverrideRole(savedMode)
    }
  }, [])

  // Determine role based on session data
  const isAdmin = session?.user?.isSuperAdmin || (session?.user?.roles && session.user.roles.length > 0 && session.user.roles.some((r: any) => r.code !== "COUNCIL"));
  const isCouncil = session?.user?.roles?.some((r: any) => r.code === "COUNCIL");
  const isOfficial = !!session?.user?.officialId;

  const baseUserRole = isAdmin
    ? "admin"
    : isCouncil
      ? "council"
      : isOfficial
        ? "official"
        : "member"

  const userRole = overrideRole || baseUserRole

  const handleViewModeChange = (mode: "admin" | "member" | "official" | "council") => {
    setOverrideRole(mode)
    localStorage.setItem('tmc_view_mode', mode)
    setIsMobileMenuOpen(false)
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {mounted && <ImpersonationBanner />}
      <div className="flex flex-1 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        {mounted && (
          <Sidebar 
            userRole={userRole} 
            isRealAdmin={isAdmin} 
            adminLevel={session?.user?.isSuperAdmin ? "SUPER_ADMIN" : session?.user?.roles?.[0]?.jurisdictionLevel} 
            onViewModeChange={handleViewModeChange}
          />
        )}
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 md:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <SheetTitle className="sr-only">Mobile Navigation Menu</SheetTitle>
              {mounted && (
                <Sidebar
                  userRole={userRole}
                  isRealAdmin={isAdmin}
                  adminLevel={session?.user?.isSuperAdmin ? "SUPER_ADMIN" : session?.user?.roles?.[0]?.jurisdictionLevel}
                  className="w-full h-full border-none"
                  onNavigate={() => setIsMobileMenuOpen(false)}
                  onViewModeChange={handleViewModeChange}
                />
              )}
            </SheetContent>
          </Sheet>
          <div className="font-bold text-lg">TMC Portal</div>
          <div className="ml-auto">
            {mounted && <NotificationBell />}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-4 md:p-6">
            <div className="hidden md:flex justify-end mb-4">
              {mounted && <NotificationBell />}
            </div>
            {mounted && children}
          </div>
          {mounted && <Toaster />}
          {mounted && <NotificationListener />}
        </main>
      </div>
      </div>
      {mounted && <AiChatWidget />}
    </div>
  )
}


