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
import { ViewAsBanner } from "./view-as-banner"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { data: session, status } = useSession()
  const [mounted, setMounted] = useState(false)
  const [overrideRole, setOverrideRole] = useState<"admin" | "member" | "official" | "council" | null>(null)
  const [overrideAdminLevel, setOverrideAdminLevel] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    const savedMode = localStorage.getItem('tmc_view_mode') as "admin" | "member" | "official" | "council" | null
    const savedLevel = localStorage.getItem('tmc_view_level')
    if (savedMode) {
      setOverrideRole(savedMode)
    }
    if (savedLevel) {
      setOverrideAdminLevel(savedLevel)
    }
  }, [])

  // Determine role based on session data
  const isAdmin = session?.user?.isSuperAdmin || (session?.user?.roles && session.user.roles.some((r: any) => ["SUPER_ADMIN", "NATIONAL_ADMIN"].includes(r.code) || ["SYSTEM", "NATIONAL"].includes(r.jurisdictionLevel)));
  const isCouncil = session?.user?.roles?.some((r: any) => r.code === "COUNCIL");
  const isOfficial = !!session?.user?.officialId || (session?.user?.roles && session.user.roles.some((r: any) => ["STATE_ADMIN", "LOCAL_GOVERNMENT_ADMIN", "BRANCH_ADMIN", "OFFICIAL"].includes(r.code) || ["STATE", "LOCAL_GOVERNMENT", "BRANCH"].includes(r.jurisdictionLevel)));

  const baseUserRole = isAdmin
    ? "admin"
    : isCouncil
      ? "council"
      : isOfficial
        ? "official"
        : "member"

  const userRole = overrideRole || baseUserRole
  
  // Real Admin Level (from session)
  const realAdminLevel = session?.user?.isSuperAdmin 
    ? "SUPER_ADMIN" 
    : session?.user?.officialLevel || session?.user?.roles?.[0]?.jurisdictionLevel;

  const adminLevel = overrideAdminLevel || realAdminLevel

  const handleViewModeChange = (mode: "admin" | "member" | "official" | "council", level?: string, jurisdiction?: { state?: string; lga?: string; branch?: string }) => {
    setOverrideRole(mode)
    localStorage.setItem('tmc_view_mode', mode)
    
    if (level) {
      setOverrideAdminLevel(level)
      localStorage.setItem('tmc_view_level', level)
      document.cookie = `tmc_mock_level=${level}; path=/`
    } else {
      setOverrideAdminLevel(null)
      localStorage.removeItem('tmc_view_level')
      document.cookie = `tmc_mock_level=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    }

    if (jurisdiction) {
      if (jurisdiction.state) document.cookie = `tmc_mock_state=${jurisdiction.state}; path=/`
      if (jurisdiction.lga) document.cookie = `tmc_mock_lga=${jurisdiction.lga}; path=/`
      if (jurisdiction.branch) document.cookie = `tmc_mock_branch=${jurisdiction.branch}; path=/`
    } else {
      document.cookie = `tmc_mock_state=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
      document.cookie = `tmc_mock_lga=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
      document.cookie = `tmc_mock_branch=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    }
    
    setIsMobileMenuOpen(false)
    window.location.reload() // Reload to apply server-side mocking
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {mounted && <ImpersonationBanner />}
      {mounted && <ViewAsBanner />}
      <div className="flex flex-1 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        {mounted && (
          <Sidebar 
            userRole={userRole} 
            isRealAdmin={isAdmin} 
            adminLevel={adminLevel} 
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
                  adminLevel={adminLevel}
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


