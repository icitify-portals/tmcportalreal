"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Building2,
  CreditCard,
  FileText,
  Settings,
  LogOut,
  Shield,
  Briefcase,
  LayoutTemplate,
  MessageSquare,
  Banknote,
  Box,
  Calendar,
  Newspaper,
  Image,
  MapPin,
  Handshake,
  Radio,
  Library,
  BarChart3,
  Megaphone,
  Scroll,
  HeartHandshake,
  Home,
  BookOpen,
  Award,
  Database,
  StickyNote,
  Trophy,
} from "lucide-react"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { ThemeToggle, ColorSwitcher } from "@/components/theme-components"

interface SidebarProps {
  userRole: "admin" | "member" | "official" | "council"
  isRealAdmin?: boolean
  adminLevel?: string
  onViewModeChange?: (mode: "admin" | "member" | "official" | "council", level?: string, jurisdiction?: { state?: string; lga?: string; branch?: string }) => void
}

import { MockJurisdictionDialog } from "@/components/admin/mock-jurisdiction-dialog"
import { useState } from "react"

const adminNavItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/dashboard/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/broadcasts", label: "Broadcasts", icon: Radio },
  { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/admin/finance", label: "Finance & Donations", icon: Banknote },
  { href: "/dashboard/admin/finance/campaigns", label: "Fundraising Campaigns", icon: Megaphone },
  { href: "/dashboard/admin/finance/analytics", label: "Finance Analytics", icon: BarChart3 },
  { href: "/dashboard/admin/assets", label: "Assets", icon: Box },
  { href: "/dashboard/admin/programmes", label: "Programmes & Events", icon: Calendar },
  { href: "/dashboard/admin/programmes/reports", label: "Programme Reports", icon: BarChart3 },
  { href: "/dashboard/notes", label: "Meeting Notes", icon: StickyNote },
  { href: "/dashboard/admin/tmc-programmes", label: "Our Programmes", icon: BookOpen },
  { href: "/dashboard/admin/reports", label: "Activity Reports", icon: FileText },
  { href: "/dashboard/admin/special-programmes", label: "Special Resource Archive", icon: Library },
  { href: "/dashboard/admin/planner", label: "Year Planner", icon: Calendar },
  { href: "/dashboard/admin/meetings", label: "Meetings", icon: Users },
  { href: "/dashboard/admin/posts", label: "News & Posts", icon: Newspaper },
  { href: "/dashboard/admin/constitution", label: "Constitution Workspace", icon: FileText },
  { href: "/constitution", label: "View Live Constitution", icon: BookOpen },
  { href: "/dashboard/admin/galleries", label: "Galleries", icon: Image },
  { href: "/dashboard/admin/adhkar", label: "Adhkar Centres", icon: MapPin },
  { href: "/dashboard/admin/teskiyah", label: "Teskiyah Centres", icon: MapPin },
  { href: "/dashboard/admin/organs", label: "Our Organs", icon: Building2 },
  { href: "/dashboard/admin/occasions", label: "Engagements & Occasions", icon: Handshake },
  { href: "/dashboard/admin/competitions", label: "Competitions (Forms)", icon: Award },
  { href: "/dashboard/contests", label: "Contests Live", icon: Trophy },
  { href: "/dashboard/contests/guide", label: "Contest Guide", icon: BookOpen },
  { href: "/dashboard/admin/members", label: "Members", icon: Users },
  { href: "/dashboard/admin/officials", label: "Officials", icon: UserCheck },
  { href: "/dashboard/admin/organizations", label: "Organizations", icon: Building2 },
  { href: "/dashboard/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/dashboard/admin/documents", label: "Documents", icon: FileText },
  { href: "/dashboard/admin/burials", label: "Burials", icon: Scroll },
  { href: "/dashboard/admin/audit", label: "Audit Logs", icon: Shield },
  { href: "/dashboard/admin/roles", label: "Roles & Permissions", icon: Briefcase },
  { href: "/dashboard/admin/users", label: "Users & Access", icon: UserCheck },
  { href: "/dashboard/cms", label: "Content Management", icon: LayoutTemplate },
  { href: "/dashboard/admin/cms/menus", label: "Menus", icon: LayoutTemplate },
  { href: "/dashboard/admin/cms/pages", label: "Pages", icon: FileText },
  { href: "/dashboard/admin/promotions", label: "Promotions", icon: Megaphone },
  { href: "/dashboard/admin/analytics", label: "Site Analytics", icon: LayoutDashboard },
  { href: "/dashboard/admin/settings", label: "Settings", icon: Settings },
  { href: "/dashboard/admin/backups", label: "Backups", icon: Database },
]

const memberNavItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/dashboard/member", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/broadcasts", label: "Broadcasts", icon: Radio },
  { href: "/dashboard/member/profile", label: "My Profile", icon: Users },
  { href: "/dashboard/member/programmes", label: "My Programmes", icon: Calendar },
  { href: "/programmes/special", label: "Media Library", icon: Library },
  { href: "/dashboard/member/occasions", label: "My Occasions", icon: Handshake },
  { href: "/dashboard/member/meetings", label: "Meetings", icon: Users },
  { href: "/dashboard/notes", label: "Meeting Notes", icon: StickyNote },
  { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/member/payments", label: "Payments", icon: CreditCard },
  { href: "/dashboard/member/finance", label: "Levies & Dues", icon: Banknote },
  { href: "/dashboard/member/documents", label: "Documents", icon: FileText },
  { href: "/dashboard/user/promotions", label: "My Promotions", icon: Megaphone },
  { href: "/dashboard/burial", label: "Burial Requests", icon: HeartHandshake },
]

const officialNavItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/dashboard/official", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/broadcasts", label: "Broadcasts", icon: Radio },
  { href: "/dashboard/member/profile", label: "My Profile", icon: Users },
  { href: "/dashboard/admin/programmes", label: "Programmes & Events", icon: Calendar },
  { href: "/dashboard/member/programmes", label: "My Programmes", icon: Calendar },
  { href: "/programmes/special", label: "Media Library", icon: Library },
  { href: "/dashboard/member/occasions", label: "My Occasions", icon: Handshake },
  { href: "/dashboard/member/meetings", label: "Meetings", icon: Users },
  { href: "/dashboard/notes", label: "Meeting Notes", icon: StickyNote },
  { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/official/members", label: "Members", icon: Users, isJurisdictionHeadOnly: true },
  { href: "/dashboard/official/payments", label: "Payments", icon: CreditCard },
  { href: "/dashboard/member/finance", label: "Levies & Dues", icon: Banknote },
  { href: "/dashboard/admin/reports", label: "Activity Reports", icon: FileText },
  { href: "/dashboard/member/documents", label: "Documents", icon: FileText },
  { href: "/dashboard/official/documents", label: "Official Documents", icon: FileText },
  { href: "/dashboard/official/constitution", label: "Constitution Review", icon: FileText },
  { href: "/dashboard/user/promotions", label: "My Promotions", icon: Megaphone },
  { href: "/dashboard/burial", label: "Burial Requests", icon: HeartHandshake },
]

const councilNavItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/dashboard/council", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/broadcasts", label: "Broadcasts", icon: Radio },
  { href: "/dashboard/council/reports", label: "Event Reports", icon: FileText },
  { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
]

export function Sidebar({ userRole, isRealAdmin, adminLevel, className, onNavigate, onViewModeChange }: SidebarProps & { className?: string; onNavigate?: () => void }) {
  const pathname = usePathname()

  let navItems =
    userRole === "admin"
      ? adminNavItems
      : userRole === "official"
        ? officialNavItems
        : userRole === "council"
          ? councilNavItems
          : memberNavItems

  if (userRole === "official") {
    navItems = navItems.filter(item => {
      if ((item as any).isJurisdictionHeadOnly) {
        return !!adminLevel || isRealAdmin
      }
      return true
    })
  }

  if (userRole === "admin") {
    navItems = navItems.filter(item => {
      if (item.href === "/dashboard/admin/teskiyah") {
        return isRealAdmin || adminLevel === "NATIONAL" || adminLevel === "LOCAL_GOVERNMENT" || adminLevel === "BRANCH"
      }
      if (item.href === "/dashboard/admin/adhkar") {
        return isRealAdmin || adminLevel === "NATIONAL" || adminLevel === "STATE" || adminLevel === "LOCAL_GOVERNMENT"
      }
      return true
    })
  }

  const [mockDialogOpen, setMockDialogOpen] = useState(false)
  const [pendingMode, setPendingMode] = useState<{ role: "admin" | "member" | "official" | "council", level?: string } | null>(null)

  const onViewChange = (role: "admin" | "member" | "official" | "council", level?: string) => {
    if (role === "official" && (level === "STATE" || level === "LOCAL_GOVERNMENT" || level === "BRANCH")) {
      setPendingMode({ role, level })
      setMockDialogOpen(true)
    } else if (onViewModeChange) {
      onViewModeChange(role, level)
    }
  }

  const handleMockConfirm = (jurisdiction: { state?: string; lga?: string; branch?: string }) => {
    if (onViewModeChange && pendingMode) {
      onViewModeChange(pendingMode.role, pendingMode.level, jurisdiction)
    }
  }

  return (
    <div className={cn("flex h-screen w-64 flex-col border-r bg-background", className)}>
      <div className="flex h-16 items-center border-b px-6">
        <div className="leading-tight">
          <h1 className="text-xl font-extrabold tracking-tight">The TMC PORTAL</h1>
          <p className="text-[10px] tracking-[0.2em] text-muted-foreground font-semibold -mt-1">MUSLIM CONGRESS</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                if (onNavigate) onNavigate()
              }}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="border-t p-4 space-y-4">
        {isRealAdmin && (
          <div className="space-y-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">View As</span>
            <div className="grid grid-cols-1 gap-1">
              <Button
                variant={userRole === "admin" && (!adminLevel || adminLevel === "SUPER_ADMIN") ? "default" : "outline"}
                size="sm"
                className="w-full justify-start text-[11px] h-8"
                onClick={() => onViewChange("admin", "SUPER_ADMIN")}
              >
                <Shield className="mr-2 h-3 w-3" /> National Admin
              </Button>
              <Button
                variant={userRole === "official" && adminLevel === "STATE" ? "default" : "outline"}
                size="sm"
                className="w-full justify-start text-[11px] h-8"
                onClick={() => onViewChange("official", "STATE")}
              >
                <Building2 className="mr-2 h-3 w-3" /> State Admin
              </Button>
              <Button
                variant={userRole === "official" && adminLevel === "LOCAL_GOVERNMENT" ? "default" : "outline"}
                size="sm"
                className="w-full justify-start text-[11px] h-8"
                onClick={() => onViewChange("official", "LOCAL_GOVERNMENT")}
              >
                <MapPin className="mr-2 h-3 w-3" /> LGA Admin
              </Button>
              <Button
                variant={userRole === "official" && adminLevel === "BRANCH" ? "default" : "outline"}
                size="sm"
                className="w-full justify-start text-[11px] h-8"
                onClick={() => onViewChange("official", "BRANCH")}
              >
                <Users className="mr-2 h-3 w-3" /> Branch Admin
              </Button>
              <Button
                variant={userRole === "member" ? "default" : "outline"}
                size="sm"
                className="w-full justify-start text-[11px] h-8"
                onClick={() => onViewChange("member")}
              >
                <LayoutDashboard className="mr-2 h-3 w-3" /> Member View
              </Button>
            </div>
            {adminLevel && adminLevel !== "SUPER_ADMIN" && (
                <div className="mt-2 p-2 bg-green-50 border border-green-100 rounded text-[10px] text-green-800 animate-in fade-in zoom-in duration-300">
                    <p className="font-bold uppercase tracking-tight">Active Mock Mode:</p>
                    <p className="opacity-80">Level: {adminLevel.replace("_", " ")}</p>
                    {typeof window !== 'undefined' && (
                        <>
                            {document.cookie.includes("tmc_mock_state") && (
                                <p className="opacity-80">State: {document.cookie.split('tmc_mock_state=')[1]?.split(';')[0]}</p>
                            )}
                            {document.cookie.includes("tmc_mock_lga") && (
                                <p className="opacity-80">LGA: {decodeURIComponent(document.cookie.split('tmc_mock_lga=')[1]?.split(';')[0])}</p>
                            )}
                        </>
                    )}
                </div>
            )}
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>
        <div className="space-y-2">
          <span className="text-sm font-medium text-muted-foreground block">Color</span>
          <ColorSwitcher />
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={() => signOut({ callbackUrl: "/auth/signin" })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>

      <MockJurisdictionDialog 
        open={mockDialogOpen} 
        onOpenChange={setMockDialogOpen} 
        level={(pendingMode?.level as any) || "STATE"} 
        onConfirm={handleMockConfirm}
      />
    </div>
  )
}


