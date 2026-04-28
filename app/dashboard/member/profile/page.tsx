export const dynamic = 'force-dynamic'

import { getServerSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { members, organizations, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { User, Mail, MapPin, Building, Calendar, IdCard } from "lucide-react"
import { ProfileImageUpload } from "@/components/profile/image-upload"

export default async function MemberProfilePage() {
    const session = await getServerSession()
    if (!session?.user?.id) redirect("/login")

    const memberResults = await db.select({
        member: members,
        user: users,
        organization: organizations,
    })
        .from(members)
        .innerJoin(users, eq(members.userId, users.id))
        .leftJoin(organizations, eq(members.organizationId, organizations.id))
        .where(eq(members.userId, session.user.id))
        .limit(1)

    const data = memberResults[0]

    if (!data) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <User className="h-16 w-16 text-muted-foreground" />
                    <h2 className="text-2xl font-bold">No Member Profile Found</h2>
                    <p className="text-muted-foreground max-w-md">
                        You haven't completed your membership application yet.
                    </p>
                    <a href="/dashboard/member/apply" className="text-primary hover:underline font-medium">
                        Apply for Membership
                    </a>
                </div>
            </DashboardLayout>
        )
    }

    const { member, user, organization } = data

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <ProfileImageUpload 
                            currentImage={user.image} 
                            userName={user.name || "Member"} 
                        />
                        <div className="text-center md:text-left">
                            <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
                            <p className="text-muted-foreground flex items-center gap-1">
                                <Mail className="h-4 w-4" /> {user.email}
                            </p>
                        </div>
                    </div>
                    <Badge variant={member.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-lg py-1 px-4">
                        {member.status} Member
                    </Badge>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <IdCard className="h-5 w-5 text-primary" />
                                Membership Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="text-sm text-muted-foreground">Member ID</span>
                                    <p className="font-medium underline decoration-primary/30">{member.memberId || "Pending"}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-sm text-muted-foreground">Membership Type</span>
                                    <p className="font-medium">{member.membershipType}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-sm text-muted-foreground">Date Joined</span>
                                    <p className="font-medium">
                                        {member.dateJoined ? format(new Date(member.dateJoined), "PPP") : "N/A"}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-sm text-muted-foreground">Last Updated</span>
                                    <p className="font-medium">
                                        {member.updatedAt ? format(new Date(member.updatedAt), "PPP") : "N/A"}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building className="h-5 w-5 text-primary" />
                                Organization
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {organization ? (
                                <div className="space-y-3">
                                    <div>
                                        <span className="text-sm text-muted-foreground">Affiliated Organ</span>
                                        <p className="font-semibold text-lg">{organization.name}</p>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <MapPin className="h-4 w-4" />
                                        {organization.address || "Local Jurisdiction"}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-muted-foreground italic">No primary organization assigned.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Membership Card Preview */}
                <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden border-none shadow-xl max-w-sm mx-auto">
                    <CardHeader className="border-b border-white/10 pb-4">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold tracking-widest uppercase opacity-70">Membership Card</span>
                            <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">TMC</div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <div className="flex gap-4 items-center">
                           <div className="h-16 w-16 rounded border-2 border-white/20 overflow-hidden bg-slate-700">
                               {user.image ? <img src={user.image} alt="User" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-xl">{user.name?.charAt(0)}</div>}
                           </div>
                           <div>
                               <p className="text-lg font-bold leading-none">{user.name}</p>
                               <p className="text-blue-400 text-xs font-medium mt-1">{member.membershipType}</p>
                           </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                                <p className="opacity-60 mb-1">ID NUMBER</p>
                                <p className="font-mono tracking-wider">{member.memberId || "PENDING"}</p>
                            </div>
                            <div>
                                <p className="opacity-60 mb-1">JURISDICTION</p>
                                <p className="truncate">{organization?.name || "NATIONAL"}</p>
                            </div>
                        </div>
                    </CardContent>
                    <div className="bg-primary h-1.5 w-full"></div>
                </Card>
            </div>
        </DashboardLayout>
    )
}
