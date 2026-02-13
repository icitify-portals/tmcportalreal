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
} from "lucide-react"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { ThemeToggle, ColorSwitcher } from "@/components/theme-components"

interface SidebarProps {
  userRole: "admin" | "member" | "official" | "council"
  adminLevel?: string
}

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
  { href: "/dashboard/admin/reports", label: "Activity Reports", icon: FileText },
  { href: "/dashboard/admin/special-programmes", label: "Special Resource Archive", icon: Library },
  { href: "/dashboard/admin/meetings", label: "Meetings", icon: Users },
  { href: "/dashboard/admin/posts", label: "News & Posts", icon: Newspaper },
  { href: "/dashboard/admin/galleries", label: "Galleries", icon: Image },
  { href: "/dashboard/admin/adhkar", label: "Adhkar Centres", icon: MapPin },
  { href: "/dashboard/admin/teskiyah", label: "Teskiyah Centres", icon: MapPin },
  { href: "/dashboard/admin/occasions", label: "Engagements & Occasions", icon: Handshake },
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
  { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/member/payments", label: "Payments", icon: CreditCard },
  { href: "/dashboard/finance", label: "Levies & Dues", icon: Banknote },
  { href: "/dashboard/member/documents", label: "Documents", icon: FileText },
  { href: "/dashboard/user/promotions", label: "My Promotions", icon: Megaphone },
  { href: "/dashboard/burial", label: "Burial Requests", icon: HeartHandshake },
]

const officialNavItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/dashboard/official", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/broadcasts", label: "Broadcasts", icon: Radio },
  { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/official/members", label: "Members", icon: Users },
  { href: "/dashboard/admin/finance/analytics", label: "Finance Analytics", icon: BarChart3 },
  { href: "/dashboard/official/payments", label: "Payments", icon: CreditCard },
  { href: "/dashboard/admin/reports", label: "Activity Reports", icon: FileText },
  { href: "/dashboard/official/documents", label: "Documents", icon: FileText },
]

const councilNavItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/dashboard/council", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/broadcasts", label: "Broadcasts", icon: Radio },
  { href: "/dashboard/council/reports", label: "Event Reports", icon: FileText },
  { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
]

export function Sidebar({ userRole, adminLevel, className, onNavigate }: SidebarProps & { className?: string; onNavigate?: () => void }) {
  const pathname = usePathname()

  const navItems =
    userRole === "admin"
      ? adminNavItems
      : userRole === "official"
        ? officialNavItems
        : userRole === "council"
          ? councilNavItems
          : memberNavItems

  return (
    <div className={cn("flex h-screen w-64 flex-col border-r bg-background", className)}>
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold">Muslim Congress</h1>
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
    </div>
  )
}


