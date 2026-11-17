"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
    ShieldCheck, 
    ArrowLeft, 
    DoorOpen, 
    CheckCircle2, 
    Clock, 
    AlertTriangle, 
    Search, 
    Plus, 
    Printer, 
    MapPin, 
    Phone,
    UserCheck,
    Navigation,
    Ban
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { 
    getProgrammeGatePasses, 
    createProgrammeGatePass, 
    recordGatePassReturn,
    cancelProgrammeGatePass 
} from "@/lib/actions/programme-camp-ops"

export default function AdminProgrammeGatePassPage() {
    const params = useParams()
    const id = params.id as string

    const [passes, setPasses] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("ACTIVE")
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [activePassBadge, setActivePassBadge] = useState<any | null>(null)

    // Form state
    const [delegateName, setDelegateName] = useState("")
    const [phoneNumber, setPhoneNumber] = useState("")
    const [reason, setReason] = useState("Official Assignment")
    const [destination, setDestination] = useState("")
    const [expectedHours, setExpectedHours] = useState("2") // Default 2 hours from now
    const [notes, setNotes] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const loadData = async () => {
        setLoading(true)
        const res = await getProgrammeGatePasses(id)
        if (res.success) {
            setPasses(res.data)
        } else {
            toast.error(res.error || "Failed to load gate passes")
        }
        setLoading(false)
    }

    useEffect(() => {
        if (id) loadData()
    }, [id])

    const handleCreatePass = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!delegateName.trim() || !phoneNumber.trim() || !destination.trim()) {
            toast.error("Please fill out delegate name, phone, and destination")
            return
        }

        setIsSubmitting(true)
        const expectedReturnDate = new Date()
        expectedReturnDate.setHours(expectedReturnDate.getHours() + parseFloat(expectedHours || "2"))

        const res = await createProgrammeGatePass({
            programmeId: id,
            delegateName,
            phoneNumber,
            reason,
            destination,
            expectedReturnTime: expectedReturnDate.toISOString(),
            notes,
        })

        if (res.success) {
            toast.success(`Gate pass ${res.passNumber} issued!`)
            setShowCreateModal(false)
            // Reset
            setDelegateName("")
            setPhoneNumber("")
            setDestination("")
            setReason("Official Assignment")
            setExpectedHours("2")
            setNotes("")
            loadData()
        } else {
            toast.error(res.error || "Failed to issue gate pass")
        }
        setIsSubmitting(false)
    }

    const handleReturn = async (passId: string, name: string) => {
        if (!confirm(`Confirm gate return for delegate: ${name}?`)) return
        const res = await recordGatePassReturn(passId)
        if (res.success) {
            if (res.isOverdue) {
                toast.warning(`${name} checked in (RETURNED LATE / OVERDUE)`)
            } else {
                toast.success(`${name} checked back into camp successfully`)
            }
            loadData()
        } else {
            toast.error(res.error || "Failed to record return")
        }
    }

    const handleCancel = async (passId: string) => {
        if (!confirm("Are you sure you want to cancel this gate pass?")) return
        const res = await cancelProgrammeGatePass(passId)
        if (res.success) {
            toast.success("Gate pass cancelled")
            loadData()
        } else {
            toast.error(res.error || "Failed to cancel")
        }
    }

    const now = new Date()
    const activePasses = passes.filter(p => p.status === "ACTIVE")
    const overduePasses = activePasses.filter(p => new Date(p.expectedReturnTime) < now)
    const returnedPasses = passes.filter(p => p.status === "RETURNED" || p.status === "RETURNED_LATE")

    const filteredPasses = passes.filter(p => {
        const matchesQuery = 
            p.delegateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.phoneNumber.includes(searchQuery) ||
            p.passNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.reason.toLowerCase().includes(searchQuery.toLowerCase())

        if (statusFilter === "ALL") return matchesQuery
        if (statusFilter === "OVERDUE") return matchesQuery && p.status === "ACTIVE" && new Date(p.expectedReturnTime) < now
        return matchesQuery && p.status === statusFilter
    })

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
                                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Camp Gate Pass & Movement Tracker</h1>
                                <Badge className="bg-blue-600 text-white font-bold text-xs">Security Gate</Badge>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Regulate, authorize, and track temporary exits of residential delegates outside camp grounds.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button 
                            onClick={() => setShowCreateModal(true)}
                            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl gap-2 shadow-sm"
                        >
                            <Plus className="w-4 h-4" /> Issue Gate Pass
                        </Button>
                    </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <Card className="rounded-2xl border border-gray-200/80 shadow-xs bg-white">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Currently Outside Camp</p>
                                <p className="text-2xl font-black text-amber-600 mt-1">{activePasses.length}</p>
                            </div>
                            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                                <DoorOpen className="w-6 h-6" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border border-red-200 shadow-xs bg-red-50/40">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-red-600 uppercase tracking-wider">Overdue / Late Return</p>
                                <p className="text-2xl font-black text-red-700 mt-1">{overduePasses.length}</p>
                            </div>
                            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border border-gray-200/80 shadow-xs bg-white">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Safely Returned</p>
                                <p className="text-2xl font-black text-emerald-700 mt-1">{returnedPasses.length}</p>
                            </div>
                            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                                <UserCheck className="w-6 h-6" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border border-gray-200/80 shadow-xs bg-white">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Passes Issued</p>
                                <p className="text-2xl font-black text-gray-700 mt-1">{passes.length}</p>
                            </div>
                            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-500">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter Toolbar */}
                <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="relative w-full sm:w-80">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <Input 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search delegate, pass #, destination..."
                            className="pl-9 h-9 text-xs rounded-xl"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                        <Button 
                            size="sm" 
                            variant={statusFilter === "ACTIVE" ? "default" : "outline"}
                            onClick={() => setStatusFilter("ACTIVE")}
                            className="rounded-xl text-xs h-8 font-semibold shrink-0"
                        >
                            Outside Camp ({activePasses.length})
                        </Button>
                        <Button 
                            size="sm" 
                            variant={statusFilter === "OVERDUE" ? "default" : "outline"}
                            onClick={() => setStatusFilter("OVERDUE")}
                            className="rounded-xl text-xs h-8 font-semibold shrink-0 text-red-700 border-red-200 hover:bg-red-50"
                        >
                            Overdue ({overduePasses.length})
                        </Button>
                        <Button 
                            size="sm" 
                            variant={statusFilter === "RETURNED" ? "default" : "outline"}
                            onClick={() => setStatusFilter("RETURNED")}
                            className="rounded-xl text-xs h-8 font-semibold shrink-0"
                        >
                            Returned ({returnedPasses.length})
                        </Button>
                        <Button 
                            size="sm" 
                            variant={statusFilter === "ALL" ? "default" : "outline"}
                            onClick={() => setStatusFilter("ALL")}
                            className="rounded-xl text-xs h-8 font-semibold shrink-0"
                        >
                            All ({passes.length})
                        </Button>
                    </div>
                </div>

                {/* Gate Passes Table */}
                {loading ? (
                    <div className="bg-white rounded-2xl p-12 text-center text-gray-400 text-xs">
                        Loading gate pass records...
                    </div>
                ) : filteredPasses.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center space-y-3">
                        <DoorOpen className="w-10 h-10 text-gray-300 mx-auto" />
                        <p className="text-sm font-semibold text-gray-700">No gate passes found for this filter</p>
                        <p className="text-xs text-gray-400 max-w-sm mx-auto">
                            Ensure all delegates leaving camp for medical, errand, or official duty are issued an authorized gate pass.
                        </p>
                        <Button 
                            onClick={() => setShowCreateModal(true)}
                            size="sm"
                            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs mt-2"
                        >
                            <Plus className="w-3.5 h-3.5 mr-1.5" /> Issue First Gate Pass
                        </Button>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                        <th className="py-3 px-4">Pass # / Delegate</th>
                                        <th className="py-3 px-4">Reason & Destination</th>
                                        <th className="py-3 px-4">Exit Time</th>
                                        <th className="py-3 px-4">Expected Return</th>
                                        <th className="py-3 px-4">Status</th>
                                        <th className="py-3 px-4 text-right">Gate Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-xs">
                                    {filteredPasses.map(p => {
                                        const isOverdue = p.status === "ACTIVE" && new Date(p.expectedReturnTime) < now
                                        return (
                                            <tr key={p.id} className={`hover:bg-gray-50/50 transition-colors ${isOverdue ? 'bg-red-50/30' : ''}`}>
                                                <td className="py-3.5 px-4">
                                                    <div className="font-bold text-gray-900">{p.delegateName}</div>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <span className="px-2 py-0.5 bg-blue-50 text-blue-800 font-mono text-[10px] rounded-md font-bold">
                                                            {p.passNumber}
                                                        </span>
                                                        <span className="text-[11px] text-gray-500">{p.phoneNumber}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <div className="font-semibold text-gray-800">{p.reason}</div>
                                                    <div className="text-[11px] text-gray-500 flex items-center gap-1">
                                                        <MapPin className="w-3 h-3 text-gray-400" /> {p.destination}
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4 text-gray-600">
                                                    <div>{new Date(p.exitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                    <div className="text-[10px] text-gray-400">{new Date(p.exitTime).toLocaleDateString()}</div>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <div className={`font-semibold ${isOverdue ? 'text-red-700 font-bold animate-pulse' : 'text-gray-700'}`}>
                                                        {new Date(p.expectedReturnTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                    <div className="text-[10px] text-gray-400">{new Date(p.expectedReturnTime).toLocaleDateString()}</div>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    {isOverdue ? (
                                                        <Badge className="bg-red-100 text-red-800 border-red-200 font-bold text-[10px]">
                                                            ⚠️ OVERDUE
                                                        </Badge>
                                                    ) : p.status === "ACTIVE" ? (
                                                        <Badge className="bg-amber-100 text-amber-800 border-amber-200 font-bold text-[10px]">
                                                            Outside Camp
                                                        </Badge>
                                                    ) : p.status === "RETURNED_LATE" ? (
                                                        <Badge className="bg-orange-100 text-orange-800 border-orange-200 font-bold text-[10px]">
                                                            Returned (Late)
                                                        </Badge>
                                                    ) : p.status === "RETURNED" ? (
                                                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 font-bold text-[10px]">
                                                            Returned (Safe)
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-gray-100 text-gray-600 border-gray-200 font-bold text-[10px]">
                                                            Cancelled
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4 text-right space-x-1.5">
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline"
                                                        onClick={() => setActivePassBadge(p)}
                                                        className="h-8 px-2.5 text-xs rounded-lg font-semibold"
                                                    >
                                                        <Printer className="w-3.5 h-3.5 mr-1" /> Slip
                                                    </Button>

                                                    {p.status === "ACTIVE" && (
                                                        <>
                                                            <Button 
                                                                size="sm"
                                                                onClick={() => handleReturn(p.id, p.delegateName)}
                                                                className="h-8 px-2.5 text-xs rounded-lg font-bold bg-emerald-700 hover:bg-emerald-800 text-white"
                                                            >
                                                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Check In
                                                            </Button>
                                                            <Button 
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => handleCancel(p.id)}
                                                                className="h-8 px-2 text-xs rounded-lg text-gray-400 hover:text-red-600"
                                                            >
                                                                <Ban className="w-3.5 h-3.5" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Issue Gate Pass Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-gray-100 my-8">
                        <div className="flex items-center justify-between border-b pb-3">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                                    <DoorOpen className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-base">Issue Camp Gate Pass</h3>
                                    <p className="text-xs text-gray-500">Security Gate Exit Authorization</p>
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

                        <form onSubmit={handleCreatePass} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1 sm:col-span-2">
                                    <Label className="text-xs font-bold text-gray-700">Delegate Full Name *</Label>
                                    <Input 
                                        required 
                                        value={delegateName} 
                                        onChange={(e) => setDelegateName(e.target.value)}
                                        placeholder="e.g. Brother AbdulLateef Sanusi"
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
                                    <Label className="text-xs font-bold text-gray-700">Expected Absence Duration *</Label>
                                    <select
                                        value={expectedHours}
                                        onChange={(e) => setExpectedHours(e.target.value)}
                                        className="w-full h-9 rounded-xl border border-gray-300 bg-white px-3 text-xs focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="1">1 Hour</option>
                                        <option value="2">2 Hours</option>
                                        <option value="3">3 Hours</option>
                                        <option value="4">4 Hours</option>
                                        <option value="6">6 Hours</option>
                                        <option value="12">12 Hours (Half Day)</option>
                                        <option value="24">24 Hours (Full Day)</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-bold text-gray-700">Reason for Exit *</Label>
                                    <select
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        className="w-full h-9 rounded-xl border border-gray-300 bg-white px-3 text-xs focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="Official Assignment">Official Assignment</option>
                                        <option value="Medical Attention / Pharmacy">Medical Attention / Pharmacy</option>
                                        <option value="Urgent Family Matter">Urgent Family Matter</option>
                                        <option value="ATM / Bank / Logistics">ATM / Bank / Logistics</option>
                                        <option value="Camp Procurement">Camp Procurement / Market</option>
                                        <option value="Emergency Recall">Emergency Recall</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-bold text-gray-700">Destination *</Label>
                                    <Input 
                                        required 
                                        value={destination} 
                                        onChange={(e) => setDestination(e.target.value)}
                                        placeholder="e.g. General Hospital / Town ATM"
                                        className="h-9 text-xs rounded-xl"
                                    />
                                </div>

                                <div className="space-y-1 sm:col-span-2">
                                    <Label className="text-xs font-bold text-gray-700">Approval / Gate Notes</Label>
                                    <Textarea 
                                        value={notes} 
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Approved by Camp Marshal, vehicle plate number, or accompanying officers..."
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
                                    className="bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold h-9"
                                >
                                    {isSubmitting ? "Issuing..." : "Authorize Exit & Issue Pass"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Print Gate Pass Slip */}
            {activePassBadge && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-gray-200 text-center">
                        <div className="border-b pb-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-700">The Muslim Congress</p>
                            <h3 className="font-black text-gray-900 text-lg">CAMP GATE PASS</h3>
                            <p className="text-xs text-gray-500">Security Movement Permit</p>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2 text-left">
                            <div className="text-center pb-2 border-b border-gray-200">
                                <div className="text-2xl font-black font-mono text-blue-800">{activePassBadge.passNumber}</div>
                                <div className="font-bold text-gray-900 text-base">{activePassBadge.delegateName}</div>
                                <div className="text-xs text-gray-500">{activePassBadge.phoneNumber}</div>
                            </div>

                            <div className="text-xs space-y-1 pt-1">
                                <div><span className="text-gray-500">Reason:</span> <span className="font-bold text-gray-800">{activePassBadge.reason}</span></div>
                                <div><span className="text-gray-500">Destination:</span> <span className="font-bold text-gray-800">{activePassBadge.destination}</span></div>
                                <div><span className="text-gray-500">Exit Time:</span> <span className="font-medium text-gray-700">{new Date(activePassBadge.exitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
                                <div><span className="text-gray-500">Expected Return:</span> <span className="font-bold text-red-600">{new Date(activePassBadge.expectedReturnTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
                                <div><span className="text-gray-500">Approved By:</span> <span className="font-medium text-gray-700">{activePassBadge.approvedBy || "Camp Marshal"}</span></div>
                            </div>
                        </div>

                        <div className="flex items-center justify-center gap-2 pt-2">
                            <Button 
                                onClick={() => window.print()} 
                                className="bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl gap-1.5"
                            >
                                <Printer className="w-3.5 h-3.5" /> Print Pass
                            </Button>
                            <Button 
                                variant="outline" 
                                onClick={() => setActivePassBadge(null)}
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
