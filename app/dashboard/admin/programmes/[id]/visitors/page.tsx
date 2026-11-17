"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
    Users, 
    ArrowLeft, 
    UserCheck, 
    LogOut, 
    Clock, 
    Search, 
    Plus, 
    Printer, 
    CheckCircle2, 
    AlertCircle, 
    Building2, 
    Phone,
    ShieldAlert,
    QrCode
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { 
    getProgrammeVisitors, 
    createProgrammeVisitor, 
    checkOutProgrammeVisitor,
    deleteProgrammeVisitor 
} from "@/lib/actions/programme-camp-ops"

export default function AdminProgrammeVisitorsPage() {
    const params = useParams()
    const id = params.id as string

    const [visitors, setVisitors] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("ALL")
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [activeVisitorBadge, setActiveVisitorBadge] = useState<any | null>(null)

    // Form state
    const [visitorName, setVisitorName] = useState("")
    const [phoneNumber, setPhoneNumber] = useState("")
    const [email, setEmail] = useState("")
    const [organization, setOrganization] = useState("")
    const [purpose, setPurpose] = useState("Visiting Delegate")
    const [hostDelegateName, setHostDelegateName] = useState("")
    const [hostDelegatePhone, setHostDelegatePhone] = useState("")
    const [tagNumber, setTagNumber] = useState("")
    const [securityNotes, setSecurityNotes] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const loadData = async () => {
        setLoading(true)
        const res = await getProgrammeVisitors(id)
        if (res.success) {
            setVisitors(res.data)
        } else {
            toast.error(res.error || "Failed to load visitors")
        }
        setLoading(false)
    }

    useEffect(() => {
        if (id) loadData()
    }, [id])

    const handleCreateVisitor = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!visitorName.trim() || !phoneNumber.trim()) {
            toast.error("Visitor name and phone number are required")
            return
        }

        setIsSubmitting(true)
        const res = await createProgrammeVisitor({
            programmeId: id,
            visitorName,
            phoneNumber,
            email,
            organization,
            purpose,
            hostDelegateName,
            hostDelegatePhone,
            tagNumber,
            securityNotes,
        })

        if (res.success) {
            toast.success(`Visitor checked in successfully! Tag: ${res.tagNumber}`)
            setShowCreateModal(false)
            // Reset form
            setVisitorName("")
            setPhoneNumber("")
            setEmail("")
            setOrganization("")
            setPurpose("Visiting Delegate")
            setHostDelegateName("")
            setHostDelegatePhone("")
            setTagNumber("")
            setSecurityNotes("")
            loadData()
        } else {
            toast.error(res.error || "Failed to check in visitor")
        }
        setIsSubmitting(false)
    }

    const handleCheckOut = async (visitorId: string, name: string) => {
        if (!confirm(`Confirm check-out for visitor: ${name}?`)) return
        const res = await checkOutProgrammeVisitor(visitorId)
        if (res.success) {
            toast.success(`${name} checked out successfully`)
            loadData()
        } else {
            toast.error(res.error || "Failed to check out visitor")
        }
    }

    const filteredVisitors = visitors.filter(v => {
        const matchesQuery = 
            v.visitorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.phoneNumber.includes(searchQuery) ||
            (v.tagNumber && v.tagNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (v.organization && v.organization.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (v.hostDelegateName && v.hostDelegateName.toLowerCase().includes(searchQuery.toLowerCase()))
        
        const matchesStatus = statusFilter === "ALL" || v.status === statusFilter
        return matchesQuery && matchesStatus
    })

    const checkedInCount = visitors.filter(v => v.status === "CHECKED_IN").length
    const checkedOutCount = visitors.filter(v => v.status === "CHECKED_OUT").length

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-7xl mx-auto pb-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
                    <div className="flex items-center gap-3">
                        <Link href={`/dashboard/admin/programmes`}>
                            <Button variant="ghost" size="icon" className="rounded-xl">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Camp Visitor Management</h1>
                                <Badge className="bg-emerald-600 text-white font-bold text-xs">Security Desk</Badge>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Log, track, issue visitor passes, and monitor all non-residential guests on camp premises.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button 
                            onClick={() => setShowCreateModal(true)}
                            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl gap-2 shadow-sm"
                        >
                            <Plus className="w-4 h-4" /> Check In New Visitor
                        </Button>
                    </div>
                </div>

                {/* Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="rounded-2xl border border-gray-200/80 shadow-xs bg-white">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Currently On Camp</p>
                                <p className="text-2xl font-black text-emerald-700 mt-1">{checkedInCount}</p>
                            </div>
                            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                                <UserCheck className="w-6 h-6" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border border-gray-200/80 shadow-xs bg-white">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Checked Out</p>
                                <p className="text-2xl font-black text-gray-700 mt-1">{checkedOutCount}</p>
                            </div>
                            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-500">
                                <LogOut className="w-6 h-6" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border border-gray-200/80 shadow-xs bg-white">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Visitors Logged</p>
                                <p className="text-2xl font-black text-blue-700 mt-1">{visitors.length}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                                <Users className="w-6 h-6" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search & Filter Toolbar */}
                <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="relative w-full sm:w-80">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <Input 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search name, tag, phone, organization..."
                            className="pl-9 h-9 text-xs rounded-xl"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button 
                            size="sm" 
                            variant={statusFilter === "ALL" ? "default" : "outline"}
                            onClick={() => setStatusFilter("ALL")}
                            className="rounded-xl text-xs h-8 font-semibold"
                        >
                            All ({visitors.length})
                        </Button>
                        <Button 
                            size="sm" 
                            variant={statusFilter === "CHECKED_IN" ? "default" : "outline"}
                            onClick={() => setStatusFilter("CHECKED_IN")}
                            className="rounded-xl text-xs h-8 font-semibold"
                        >
                            On Camp ({checkedInCount})
                        </Button>
                        <Button 
                            size="sm" 
                            variant={statusFilter === "CHECKED_OUT" ? "default" : "outline"}
                            onClick={() => setStatusFilter("CHECKED_OUT")}
                            className="rounded-xl text-xs h-8 font-semibold"
                        >
                            Departed ({checkedOutCount})
                        </Button>
                    </div>
                </div>

                {/* Visitors Table / Cards */}
                {loading ? (
                    <div className="bg-white rounded-2xl p-12 text-center text-gray-400 text-xs">
                        Loading camp visitor records...
                    </div>
                ) : filteredVisitors.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center space-y-3">
                        <Users className="w-10 h-10 text-gray-300 mx-auto" />
                        <p className="text-sm font-semibold text-gray-700">No visitor records found</p>
                        <p className="text-xs text-gray-400 max-w-sm mx-auto">
                            Check in daytime guests, lecturers, and family members to ensure camp security and accountability.
                        </p>
                        <Button 
                            onClick={() => setShowCreateModal(true)}
                            size="sm"
                            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs mt-2"
                        >
                            <Plus className="w-3.5 h-3.5 mr-1.5" /> Check In First Visitor
                        </Button>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                        <th className="py-3 px-4">Visitor / Tag</th>
                                        <th className="py-3 px-4">Phone / Org</th>
                                        <th className="py-3 px-4">Purpose / Host</th>
                                        <th className="py-3 px-4">Check-in Time</th>
                                        <th className="py-3 px-4">Status</th>
                                        <th className="py-3 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-xs">
                                    {filteredVisitors.map(v => (
                                        <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="py-3.5 px-4">
                                                <div className="font-bold text-gray-900">{v.visitorName}</div>
                                                <span className="inline-block mt-0.5 px-2 py-0.5 bg-gray-100 text-gray-700 font-mono text-[10px] rounded-md font-bold">
                                                    {v.tagNumber || "NO TAG"}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-gray-600">
                                                <div className="font-medium text-gray-800">{v.phoneNumber}</div>
                                                <div className="text-[11px] text-gray-400">{v.organization || "Independent"}</div>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="font-semibold text-gray-800">{v.purpose}</div>
                                                {v.hostDelegateName && (
                                                    <div className="text-[11px] text-gray-500">
                                                        Visiting: <span className="font-medium text-gray-700">{v.hostDelegateName}</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 text-gray-600">
                                                <div>{new Date(v.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                <div className="text-[10px] text-gray-400">{new Date(v.checkInTime).toLocaleDateString()}</div>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                {v.status === "CHECKED_IN" ? (
                                                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 font-bold text-[10px]">
                                                        ● On Camp
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-gray-100 text-gray-600 border-gray-200 font-bold text-[10px]">
                                                        Departed
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 text-right space-x-1.5">
                                                <Button 
                                                    size="sm" 
                                                    variant="outline"
                                                    onClick={() => setActiveVisitorBadge(v)}
                                                    className="h-8 px-2.5 text-xs rounded-lg font-semibold"
                                                >
                                                    <Printer className="w-3.5 h-3.5 mr-1" /> Badge
                                                </Button>

                                                {v.status === "CHECKED_IN" && (
                                                    <Button 
                                                        size="sm"
                                                        onClick={() => handleCheckOut(v.id, v.visitorName)}
                                                        className="h-8 px-2.5 text-xs rounded-lg font-bold bg-amber-600 hover:bg-amber-700 text-white"
                                                    >
                                                        <LogOut className="w-3.5 h-3.5 mr-1" /> Check Out
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Check In Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-gray-100 my-8">
                        <div className="flex items-center justify-between border-b pb-3">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                                    <UserCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-base">Check In Camp Visitor</h3>
                                    <p className="text-xs text-gray-500">Security Gate Entry Log</p>
                                </div>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setShowCreateModal(false)}
                                className="rounded-full h-8 w-8 p-0"
                            >
                                ✕
                            </Button>
                        </div>

                        <form onSubmit={handleCreateVisitor} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1 sm:col-span-2">
                                    <Label className="text-xs font-bold text-gray-700">Visitor Full Name *</Label>
                                    <Input 
                                        required 
                                        value={visitorName} 
                                        onChange={(e) => setVisitorName(e.target.value)}
                                        placeholder="e.g. Alhaji Mustapha Bello"
                                        className="h-9 text-xs rounded-xl"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-bold text-gray-700">Phone Number *</Label>
                                    <Input 
                                        required 
                                        value={phoneNumber} 
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        placeholder="08012345678"
                                        className="h-9 text-xs rounded-xl"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-bold text-gray-700">Assigned Tag / Badge #</Label>
                                    <Input 
                                        value={tagNumber} 
                                        onChange={(e) => setTagNumber(e.target.value)}
                                        placeholder="Leave blank for auto VIS-###"
                                        className="h-9 text-xs rounded-xl"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-bold text-gray-700">Organization / Branch</Label>
                                    <Input 
                                        value={organization} 
                                        onChange={(e) => setOrganization(e.target.value)}
                                        placeholder="e.g. Lagos Island Branch / Press"
                                        className="h-9 text-xs rounded-xl"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-bold text-gray-700">Purpose of Visit *</Label>
                                    <select
                                        value={purpose}
                                        onChange={(e) => setPurpose(e.target.value)}
                                        className="w-full h-9 rounded-xl border border-gray-300 bg-white px-3 text-xs focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="Visiting Delegate">Visiting Delegate / Family</option>
                                        <option value="Guest Speaker / Dignitary">Guest Speaker / Dignitary</option>
                                        <option value="Official Inspection">Official Inspection</option>
                                        <option value="Day Participation">Day Participation</option>
                                        <option value="Vendor / Supply Delivery">Vendor / Supply Delivery</option>
                                        <option value="Media / Coverage">Media / Coverage</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-bold text-gray-700">Host Delegate Name (If any)</Label>
                                    <Input 
                                        value={hostDelegateName} 
                                        onChange={(e) => setHostDelegateName(e.target.value)}
                                        placeholder="e.g. Brother Kabir Ahmed"
                                        className="h-9 text-xs rounded-xl"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-bold text-gray-700">Host Delegate Phone</Label>
                                    <Input 
                                        value={hostDelegatePhone} 
                                        onChange={(e) => setHostDelegatePhone(e.target.value)}
                                        placeholder="08098765432"
                                        className="h-9 text-xs rounded-xl"
                                    />
                                </div>

                                <div className="space-y-1 sm:col-span-2">
                                    <Label className="text-xs font-bold text-gray-700">Security Gate Notes</Label>
                                    <Textarea 
                                        value={securityNotes} 
                                        onChange={(e) => setSecurityNotes(e.target.value)}
                                        placeholder="Vehicle plate number, belongings declaration, special pass conditions..."
                                        rows={2}
                                        className="text-xs rounded-xl"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => setShowCreateModal(false)}
                                    className="rounded-xl text-xs h-9 font-semibold"
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                    className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold h-9"
                                >
                                    {isSubmitting ? "Checking In..." : "Complete Check-In"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Visitor Badge Print Modal */}
            {activeVisitorBadge && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-gray-200 text-center">
                        <div className="border-b pb-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">The Muslim Congress</p>
                            <h3 className="font-black text-gray-900 text-lg">VISITOR PASS</h3>
                            <p className="text-xs text-gray-500">Camp Security Clearance</p>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                            <div className="text-2xl font-black font-mono text-emerald-800">{activeVisitorBadge.tagNumber}</div>
                            <div className="font-bold text-gray-900 text-base">{activeVisitorBadge.visitorName}</div>
                            <div className="text-xs text-gray-500">{activeVisitorBadge.organization || "Day Guest"}</div>
                            <div className="text-xs font-semibold text-gray-700 pt-1">
                                Purpose: <span className="font-bold">{activeVisitorBadge.purpose}</span>
                            </div>
                            {activeVisitorBadge.hostDelegateName && (
                                <div className="text-[11px] text-gray-500">
                                    Visiting: {activeVisitorBadge.hostDelegateName}
                                </div>
                            )}
                            <div className="text-[10px] text-gray-400 pt-2 border-t border-gray-200">
                                Checked In: {new Date(activeVisitorBadge.checkInTime).toLocaleString()}
                            </div>
                        </div>

                        <div className="flex items-center justify-center gap-2 pt-2">
                            <Button 
                                onClick={() => window.print()} 
                                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl gap-1.5"
                            >
                                <Printer className="w-3.5 h-3.5" /> Print Pass
                            </Button>
                            <Button 
                                variant="outline" 
                                onClick={() => setActiveVisitorBadge(null)}
                                className="font-semibold text-xs rounded-xl"
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    )
}
