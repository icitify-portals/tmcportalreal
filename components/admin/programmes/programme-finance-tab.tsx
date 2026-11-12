"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
    Receipt, 
    DollarSign, 
    HeartHandshake, 
    Layers, 
    CheckCircle2, 
    RefreshCw, 
    Loader2, 
    ExternalLink,
    TrendingUp,
    Users,
    Download
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { syncAllProgrammePayments } from "@/lib/actions/programmes"
import { toast } from "sonner"
import Link from "next/link"

interface ProgrammeFinanceTabProps {
    programmeId: string
    programmeTitle: string
    programmeAmount?: string | number | null
    registrations: any[]
    sponsorshipPools?: any[]
    bulkGroups?: any[]
}

export function ProgrammeFinanceTab({
    programmeId,
    programmeTitle,
    programmeAmount = "0.00",
    registrations,
    sponsorshipPools = [],
    bulkGroups = [],
}: ProgrammeFinanceTabProps) {
    const [isSyncing, setIsSyncing] = useState(false)

    const handleSync = async () => {
        setIsSyncing(true)
        try {
            const res = await syncAllProgrammePayments(programmeId)
            if (res.success) {
                toast.success(res.message)
                window.location.reload()
            } else {
                toast.error(res.error || "Failed to reconcile payments")
            }
        } catch (e) {
            toast.error("An error occurred during synchronization")
        } finally {
            setIsSyncing(false)
        }
    }

    // 1. Direct registrations breakdown
    let directPaidRevenue = 0
    let partialRevenue = 0
    let directPaidCount = 0
    let partialPaidCount = 0

    for (const r of registrations) {
        const amt = parseFloat(String(r.amountPaid || "0"))
        const isPaid = r.status === "PAID" || r.status === "ATTENDED"
        const isPartial = r.status === "PARTIALLY_PAID" || (!isPaid && amt > 0)

        // Exclude pool and bulk claim seats to avoid double-counting
        if (!r.sponsorPoolId && !r.bulkGroupId) {
            if (isPaid) {
                directPaidRevenue += amt
                directPaidCount++
            } else if (isPartial) {
                partialRevenue += amt
                partialPaidCount++
            }
        }
    }

    // 2. Sponsorship Pools breakdown
    let poolsPaidRevenue = 0
    let poolsTotalPledged = 0
    let totalSponsorSeats = 0
    let claimedSponsorSeats = 0
    let paidPoolsCount = 0

    for (const pool of sponsorshipPools) {
        const tot = parseFloat(String(pool.totalAmount || "0"))
        poolsTotalPledged += tot
        if (pool.status === "PAID") {
            poolsPaidRevenue += tot
            paidPoolsCount++
        }
        totalSponsorSeats += pool.seatCount || 0
        claimedSponsorSeats += pool.seatsClaimed || 0
    }

    // 3. Bulk Groups breakdown
    let bulkPaidRevenue = 0
    let bulkTotalInvoiced = 0
    let totalBulkAttendees = 0
    let paidBulkCount = 0

    for (const bg of bulkGroups) {
        const tot = parseFloat(String(bg.totalAmount || "0"))
        bulkTotalInvoiced += tot
        if (bg.status === "PAID") {
            bulkPaidRevenue += tot
            paidBulkCount++
        }
        totalBulkAttendees += bg.attendeeCount || 0
    }

    // 4. Combined Grand Total Revenue
    const grandTotalRevenue = directPaidRevenue + partialRevenue + poolsPaidRevenue + bulkPaidRevenue

    const esc = (val: any) => {
        if (val === null || val === undefined) return '""'
        const str = String(val).replace(/"/g, '""')
        return `"${str}"`
    }

    const exportComprehensiveAudit = () => {
        const rows: string[] = []

        // Title Block
        rows.push([esc(`${programmeTitle} - COMPREHENSIVE FINANCIAL AUDIT REPORT`)].join(","))
        rows.push([esc("Generated At"), esc(new Date().toLocaleString("en-NG")), esc("Currency"), esc("NGN")].join(","))
        rows.push([esc("Total Reconciled Inflow"), esc(grandTotalRevenue.toFixed(2)), esc("Total Registrations"), esc(registrations.length)].join(","))
        rows.push("") // Blank line

        // 1. Executive Summary Table
        rows.push([esc("=== SECTION 1: INFLOW CHANNELS SUMMARY ===")].join(","))
        rows.push([esc("Inflow Channel"), esc("Records / Volume"), esc("Amount Collected (NGN)"), esc("Share (%)"), esc("Audit Status")].join(","))
        rows.push([
            esc("Direct Attendee Registrations"),
            esc(`${directPaidCount} paid tickets`),
            esc(directPaidRevenue.toFixed(2)),
            esc(grandTotalRevenue > 0 ? ((directPaidRevenue / grandTotalRevenue) * 100).toFixed(2) + "%" : "0%"),
            esc("Verified")
        ].join(","))
        rows.push([
            esc("Sponsorship Pools"),
            esc(`${paidPoolsCount} pools (${totalSponsorSeats} seats donated, ${claimedSponsorSeats} claimed)`),
            esc(poolsPaidRevenue.toFixed(2)),
            esc(grandTotalRevenue > 0 ? ((poolsPaidRevenue / grandTotalRevenue) * 100).toFixed(2) + "%" : "0%"),
            esc("Verified")
        ].join(","))
        rows.push([
            esc("Bulk Group Delegations"),
            esc(`${paidBulkCount} bulk groups (${totalBulkAttendees} delegate seats)`),
            esc(bulkPaidRevenue.toFixed(2)),
            esc(grandTotalRevenue > 0 ? ((bulkPaidRevenue / grandTotalRevenue) * 100).toFixed(2) + "%" : "0%"),
            esc("Verified")
        ].join(","))
        if (partialRevenue > 0) {
            rows.push([
                esc("Partially Paid Deposits"),
                esc(`${partialPaidCount} deposits`),
                esc(partialRevenue.toFixed(2)),
                esc(grandTotalRevenue > 0 ? ((partialRevenue / grandTotalRevenue) * 100).toFixed(2) + "%" : "0%"),
                esc("Partial")
            ].join(","))
        }
        rows.push([
            esc("GRAND TOTAL VERIFIED INFLOW"),
            esc(`${registrations.length} registrations`),
            esc(grandTotalRevenue.toFixed(2)),
            esc("100.00%"),
            esc("AUDITED")
        ].join(","))
        rows.push("") // Blank line

        // 2. Sponsorship Pools Detailed
        rows.push([esc("=== SECTION 2: SPONSORSHIP POOLS (PHILANTHROPISTS & DONORS) ===")].join(","))
        rows.push([
            esc("Sponsor Name"),
            esc("Sponsor Email"),
            esc("Sponsor Phone"),
            esc("Sponsor Code"),
            esc("Seats Donated"),
            esc("Seats Claimed"),
            esc("Seats Remaining"),
            esc("Amount Per Seat (NGN)"),
            esc("Total Amount (NGN)"),
            esc("Payment Reference"),
            esc("Status"),
            esc("Date Created")
        ].join(","))

        for (const pool of sponsorshipPools) {
            const seatsLeft = Math.max(0, (pool.seatCount || 0) - (pool.seatsClaimed || 0))
            const created = pool.createdAt ? new Date(pool.createdAt).toISOString().replace("T", " ").substring(0, 19) : ""
            rows.push([
                esc(pool.sponsorName || "Anonymous Sponsor"),
                esc(pool.sponsorEmail || ""),
                esc(pool.sponsorPhone || ""),
                esc(pool.sponsorCode || ""),
                esc(pool.seatCount || 0),
                esc(pool.seatsClaimed || 0),
                esc(seatsLeft),
                esc(parseFloat(String(pool.amountPerSeat || "0")).toFixed(2)),
                esc(parseFloat(String(pool.totalAmount || "0")).toFixed(2)),
                esc(pool.paymentRef || ""),
                esc(pool.status || "PENDING"),
                esc(created)
            ].join(","))
        }
        rows.push("") // Blank line

        // 3. Bulk Group Delegations Detailed
        rows.push([esc("=== SECTION 3: BULK GROUP DELEGATIONS (BRANCHES & LGAS) ===")].join(","))
        rows.push([
            esc("Paymaster / Chapter"),
            esc("Paymaster Email"),
            esc("Paymaster Phone"),
            esc("Attendee Count"),
            esc("Amount Per Attendee (NGN)"),
            esc("Total Amount (NGN)"),
            esc("Payment Reference"),
            esc("Status"),
            esc("Date Created")
        ].join(","))

        for (const bg of bulkGroups) {
            const created = bg.createdAt ? new Date(bg.createdAt).toISOString().replace("T", " ").substring(0, 19) : ""
            rows.push([
                esc(bg.paymasterName || "Group Paymaster"),
                esc(bg.paymasterEmail || ""),
                esc(bg.paymasterPhone || ""),
                esc(bg.attendeeCount || 0),
                esc(parseFloat(String(bg.amountPerAttendee || "0")).toFixed(2)),
                esc(parseFloat(String(bg.totalAmount || "0")).toFixed(2)),
                esc(bg.paymentRef || ""),
                esc(bg.status || "PENDING"),
                esc(created)
            ].join(","))
        }
        rows.push("") // Blank line

        // 4. Detailed Registrations / Attendees
        rows.push([esc("=== SECTION 4: INDIVIDUAL ATTENDEE REGISTRATIONS ===")].join(","))
        rows.push([
            esc("Attendee Name"),
            esc("Email"),
            esc("Phone"),
            esc("Gender"),
            esc("State"),
            esc("LGA"),
            esc("Branch"),
            esc("Membership ID"),
            esc("Channel / Source"),
            esc("Sponsor Pool / Group"),
            esc("Amount Paid (NGN)"),
            esc("Registration Status"),
            esc("Registered Date")
        ].join(","))

        for (const r of registrations) {
            let channel = "Direct Self-Paid"
            let refGroup = ""
            if (r.sponsorPoolId) {
                channel = "Sponsored Seat"
                const matchingPool = sponsorshipPools.find(p => p.id === r.sponsorPoolId)
                refGroup = matchingPool ? `${matchingPool.sponsorCode} (${matchingPool.sponsorName})` : r.sponsorPoolId
            } else if (r.bulkGroupId) {
                channel = "Bulk Delegation"
                const matchingBg = bulkGroups.find(b => b.id === r.bulkGroupId)
                refGroup = matchingBg ? (matchingBg.paymasterName || "Bulk Group") : r.bulkGroupId
            }

            const regDate = r.registeredAt ? new Date(r.registeredAt).toISOString().replace("T", " ").substring(0, 19) : ""

            rows.push([
                esc(r.name || ""),
                esc(r.email || ""),
                esc(r.phone || ""),
                esc(r.gender || ""),
                esc(r.state || ""),
                esc(r.lga || ""),
                esc(r.branch || ""),
                esc(r.memberId || ""),
                esc(channel),
                esc(refGroup),
                esc(parseFloat(String(r.amountPaid || "0")).toFixed(2)),
                esc(r.status || "PENDING"),
                esc(regDate)
            ].join(","))
        }

        const csvContent = "\uFEFF" + rows.join("\r\n")
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        const safeTitle = programmeTitle.toLowerCase().replace(/[^a-z0-9]/g, "_").substring(0, 30)
        link.setAttribute("href", url)
        link.setAttribute("download", `${safeTitle}_financial_audit_${new Date().toISOString().split("T")[0]}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        toast.success("Comprehensive Financial Audit CSV downloaded!")
    }

    const exportSponsorshipPoolsOnly = () => {
        const rows: string[] = []
        rows.push([
            esc("Sponsor Name"),
            esc("Sponsor Email"),
            esc("Sponsor Phone"),
            esc("Sponsor Code"),
            esc("Seats Donated"),
            esc("Seats Claimed"),
            esc("Seats Remaining"),
            esc("Amount Per Seat (NGN)"),
            esc("Total Amount (NGN)"),
            esc("Payment Reference"),
            esc("Status"),
            esc("Date Created")
        ].join(","))

        for (const pool of sponsorshipPools) {
            const seatsLeft = Math.max(0, (pool.seatCount || 0) - (pool.seatsClaimed || 0))
            const created = pool.createdAt ? new Date(pool.createdAt).toISOString().replace("T", " ").substring(0, 19) : ""
            rows.push([
                esc(pool.sponsorName || "Anonymous Sponsor"),
                esc(pool.sponsorEmail || ""),
                esc(pool.sponsorPhone || ""),
                esc(pool.sponsorCode || ""),
                esc(pool.seatCount || 0),
                esc(pool.seatsClaimed || 0),
                esc(seatsLeft),
                esc(parseFloat(String(pool.amountPerSeat || "0")).toFixed(2)),
                esc(parseFloat(String(pool.totalAmount || "0")).toFixed(2)),
                esc(pool.paymentRef || ""),
                esc(pool.status || "PENDING"),
                esc(created)
            ].join(","))
        }

        const csvContent = "\uFEFF" + rows.join("\r\n")
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute("download", `sponsorship_pools_${new Date().toISOString().split("T")[0]}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        toast.success("Sponsorship pools exported!")
    }

    const exportBulkGroupsOnly = () => {
        const rows: string[] = []
        rows.push([
            esc("Paymaster / Chapter"),
            esc("Paymaster Email"),
            esc("Paymaster Phone"),
            esc("Attendee Count"),
            esc("Amount Per Attendee (NGN)"),
            esc("Total Amount (NGN)"),
            esc("Payment Reference"),
            esc("Status"),
            esc("Date Created")
        ].join(","))

        for (const bg of bulkGroups) {
            const created = bg.createdAt ? new Date(bg.createdAt).toISOString().replace("T", " ").substring(0, 19) : ""
            rows.push([
                esc(bg.paymasterName || "Group Paymaster"),
                esc(bg.paymasterEmail || ""),
                esc(bg.paymasterPhone || ""),
                esc(bg.attendeeCount || 0),
                esc(parseFloat(String(bg.amountPerAttendee || "0")).toFixed(2)),
                esc(parseFloat(String(bg.totalAmount || "0")).toFixed(2)),
                esc(bg.paymentRef || ""),
                esc(bg.status || "PENDING"),
                esc(created)
            ].join(","))
        }

        const csvContent = "\uFEFF" + rows.join("\r\n")
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute("download", `bulk_delegations_${new Date().toISOString().split("T")[0]}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        toast.success("Bulk delegations exported!")
    }

    return (
        <div className="space-y-6">
            {/* Top Revenue Summary Banner */}
            <div className="rounded-2xl border border-emerald-800/50 bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-950 p-6 text-white shadow-lg">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 max-w-2xl">
                        <div className="flex items-center gap-2">
                            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-xs font-semibold px-2.5 py-0.5">
                                Verified Financial Audit
                            </Badge>
                            <Badge variant="outline" className="border-emerald-600 text-emerald-200 text-xs">
                                All Inflow Channels
                            </Badge>
                        </div>
                        <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                            Total Verified Inflow: {formatCurrency(grandTotalRevenue)}
                        </h3>
                        <p className="text-sm text-emerald-200/90 leading-relaxed">
                            Comprehensive reconciliation combining Direct Attendees, Philanthropist Sponsorship Pools, and Bulk Delegations.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            onClick={exportComprehensiveAudit}
                            className="bg-white hover:bg-slate-100 text-emerald-950 font-bold text-xs h-9 shadow-sm"
                        >
                            <Download className="h-4 w-4 mr-1.5 text-emerald-700" /> Download Audit (CSV/Excel)
                        </Button>
                        <Button 
                            onClick={handleSync}
                            disabled={isSyncing}
                            variant="outline"
                            className="border-emerald-600 bg-emerald-900/60 hover:bg-emerald-800 text-white font-semibold text-xs h-9 shadow-xs"
                        >
                            {isSyncing ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Reconciling...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-1.5" /> Reconcile Payments
                                </>
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            asChild
                            className="border-emerald-500/60 bg-emerald-950/60 hover:bg-emerald-800 text-white font-semibold text-xs h-9"
                        >
                            <Link href={`/dashboard/admin/programmes/${programmeId}/analytics`}>
                                <TrendingUp className="h-4 w-4 mr-1.5 text-emerald-400" /> Full Analytics
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Sub-channel Pill Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-emerald-800/40 mt-5">
                    <div className="p-3 bg-emerald-900/40 border border-emerald-700/40 rounded-xl space-y-0.5">
                        <div className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">Direct Attendees</div>
                        <div className="text-lg font-black text-white">{formatCurrency(directPaidRevenue + partialRevenue)}</div>
                        <div className="text-[10px] text-emerald-300/80">{directPaidCount} paid &bull; {partialPaidCount} deposits</div>
                    </div>

                    <div className="p-3 bg-emerald-900/40 border border-emerald-700/40 rounded-xl space-y-0.5">
                        <div className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">Sponsorship Pools</div>
                        <div className="text-lg font-black text-white">{formatCurrency(poolsPaidRevenue)}</div>
                        <div className="text-[10px] text-purple-200/80">{paidPoolsCount} paid pools &bull; {totalSponsorSeats} seats total</div>
                    </div>

                    <div className="p-3 bg-emerald-900/40 border border-emerald-700/40 rounded-xl space-y-0.5">
                        <div className="text-[11px] font-bold text-blue-300 uppercase tracking-wider">Bulk Delegations</div>
                        <div className="text-lg font-black text-white">{formatCurrency(bulkPaidRevenue)}</div>
                        <div className="text-[10px] text-blue-200/80">{paidBulkCount} paid packages &bull; {totalBulkAttendees} delegate seats</div>
                    </div>
                </div>
            </div>

            {/* Financial Audit Channel Summary Table */}
            <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                <CardHeader className="pb-3 border-b bg-slate-50/50 dark:bg-slate-950/50">
                    <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                        <Receipt className="h-4 w-4 text-emerald-600" />
                        Inflow Channel Breakdown
                    </CardTitle>
                    <CardDescription>
                        Reconciliation of collections across all gateway and registration channels.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                    <div className="overflow-x-auto rounded-lg border">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[11px] tracking-wider border-b">
                                <tr>
                                    <th className="py-2.5 px-4 text-left">Channel</th>
                                    <th className="py-2.5 px-4 text-center">Volume / Records</th>
                                    <th className="py-2.5 px-4 text-right">Collected (NGN)</th>
                                    <th className="py-2.5 px-4 text-right">% Contribution</th>
                                    <th className="py-2.5 px-4 text-center">Audit Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                <tr>
                                    <td className="py-3 px-4">
                                        <div className="font-bold text-slate-900">Direct Attendee Registrations</div>
                                        <div className="text-xs text-muted-foreground">Self-paid tickets by members and guests</div>
                                    </td>
                                    <td className="py-3 px-4 text-center text-slate-700 font-medium">{directPaidCount} paid tickets</td>
                                    <td className="py-3 px-4 text-right font-bold text-emerald-700">{formatCurrency(directPaidRevenue)}</td>
                                    <td className="py-3 px-4 text-right text-slate-600">
                                        {grandTotalRevenue > 0 ? ((directPaidRevenue / grandTotalRevenue) * 100).toFixed(1) : 0}%
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <Badge className="bg-green-100 text-green-800 border-green-300 text-[10px]">Verified</Badge>
                                    </td>
                                </tr>

                                <tr>
                                    <td className="py-3 px-4">
                                        <div className="font-bold text-slate-900">Sponsorship Pools</div>
                                        <div className="text-xs text-muted-foreground">
                                            {totalSponsorSeats} seats sponsored ({claimedSponsorSeats} claimed, {Math.max(0, totalSponsorSeats - claimedSponsorSeats)} available)
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-center text-slate-700 font-medium">{paidPoolsCount} donor pools</td>
                                    <td className="py-3 px-4 text-right font-bold text-purple-700">{formatCurrency(poolsPaidRevenue)}</td>
                                    <td className="py-3 px-4 text-right text-slate-600">
                                        {grandTotalRevenue > 0 ? ((poolsPaidRevenue / grandTotalRevenue) * 100).toFixed(1) : 0}%
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <Badge className="bg-purple-100 text-purple-800 border-purple-300 text-[10px]">Paid Pools</Badge>
                                    </td>
                                </tr>

                                <tr>
                                    <td className="py-3 px-4">
                                        <div className="font-bold text-slate-900">Bulk Group Delegations</div>
                                        <div className="text-xs text-muted-foreground">Branch and LGA packages ({totalBulkAttendees} delegate seats)</div>
                                    </td>
                                    <td className="py-3 px-4 text-center text-slate-700 font-medium">{paidBulkCount} bulk packages</td>
                                    <td className="py-3 px-4 text-right font-bold text-blue-700">{formatCurrency(bulkPaidRevenue)}</td>
                                    <td className="py-3 px-4 text-right text-slate-600">
                                        {grandTotalRevenue > 0 ? ((bulkPaidRevenue / grandTotalRevenue) * 100).toFixed(1) : 0}%
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <Badge className="bg-blue-100 text-blue-800 border-blue-300 text-[10px]">Paid Groups</Badge>
                                    </td>
                                </tr>

                                {partialRevenue > 0 && (
                                    <tr>
                                        <td className="py-3 px-4">
                                            <div className="font-bold text-slate-900">Partially Paid Deposits</div>
                                            <div className="text-xs text-muted-foreground">Installment deposits towards registration</div>
                                        </td>
                                        <td className="py-3 px-4 text-center text-slate-700 font-medium">{partialPaidCount} deposits</td>
                                        <td className="py-3 px-4 text-right font-bold text-amber-700">{formatCurrency(partialRevenue)}</td>
                                        <td className="py-3 px-4 text-right text-slate-600">
                                            {grandTotalRevenue > 0 ? ((partialRevenue / grandTotalRevenue) * 100).toFixed(1) : 0}%
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px]">Partial</Badge>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            <tfoot className="bg-slate-50 font-bold border-t">
                                <tr>
                                    <td className="py-3.5 px-4 text-slate-900 font-extrabold uppercase text-xs">
                                        Grand Total Reconciled Revenue
                                    </td>
                                    <td className="py-3.5 px-4 text-center text-slate-800">
                                        {registrations.length} Registrations
                                    </td>
                                    <td className="py-3.5 px-4 text-right text-emerald-950 font-black text-base">
                                        {formatCurrency(grandTotalRevenue)}
                                    </td>
                                    <td className="py-3.5 px-4 text-right text-slate-900">100.0%</td>
                                    <td className="py-3.5 px-4 text-center">
                                        <Badge className="bg-emerald-700 text-white font-bold text-[10px]">Audited</Badge>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Clarification note */}
                    <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 text-xs text-emerald-900 leading-relaxed space-y-1">
                        <div className="font-bold flex items-center gap-1.5 text-emerald-950">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                            Why Attendee Table Sum differs from Total Gateway Collection:
                        </div>
                        <p>
                            The attendee list strictly counts individuals who have completed their personal registration records. When donors purchase <strong>Sponsorship Pools</strong> or chapters pay for <strong>Bulk Delegations</strong>, the payment enters Paystack and the bank account immediately, but attendee rows are populated as attendees claim seats. The Grand Total above reconciles every kobo collected across all channels.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Sponsorship Pools Table */}
            {sponsorshipPools.length > 0 && (
                <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                    <CardHeader className="pb-3 border-b bg-purple-50/30">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <CardTitle className="text-base font-bold flex items-center gap-2 text-purple-950">
                                <HeartHandshake className="h-4 w-4 text-purple-600" />
                                Sponsorship Pools ({sponsorshipPools.length})
                            </CardTitle>
                            <div className="flex items-center gap-2">
                                <Button size="sm" variant="outline" onClick={exportSponsorshipPoolsOnly} className="h-7 text-xs border-purple-300 text-purple-900 bg-white hover:bg-purple-50">
                                    <Download className="h-3.5 w-3.5 mr-1 text-purple-700" /> Export Pools CSV
                                </Button>
                                <Badge variant="outline" className="border-purple-300 text-purple-800 font-bold">
                                    Total: {formatCurrency(poolsPaidRevenue)}
                                </Badge>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-3">
                        <div className="overflow-x-auto rounded-lg border">
                            <table className="w-full text-xs">
                                <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] border-b">
                                    <tr>
                                        <th className="py-2 px-3 text-left">Sponsor Name</th>
                                        <th className="py-2 px-3 text-center">Sponsor Code</th>
                                        <th className="py-2 px-3 text-center">Seats Donated</th>
                                        <th className="py-2 px-3 text-center">Claimed</th>
                                        <th className="py-2 px-3 text-right">Amount Paid</th>
                                        <th className="py-2 px-3 text-center">Payment Ref</th>
                                        <th className="py-2 px-3 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {sponsorshipPools.map((pool: any) => (
                                        <tr key={pool.id} className="hover:bg-slate-50/50">
                                            <td className="py-2.5 px-3 font-semibold text-slate-900">{pool.sponsorName || "Anonymous Sponsor"}</td>
                                            <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-700">{pool.sponsorCode}</td>
                                            <td className="py-2.5 px-3 text-center">{pool.seatCount} seats</td>
                                            <td className="py-2.5 px-3 text-center">{pool.seatsClaimed || 0}</td>
                                            <td className="py-2.5 px-3 text-right font-bold text-slate-900">{formatCurrency(parseFloat(pool.totalAmount || "0"))}</td>
                                            <td className="py-2.5 px-3 text-center font-mono text-[10px] text-muted-foreground">{pool.paymentRef || "—"}</td>
                                            <td className="py-2.5 px-3 text-center">
                                                <Badge variant={pool.status === "PAID" ? "default" : "secondary"} className="text-[10px]">
                                                    {pool.status}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Bulk Delegations Table */}
            {bulkGroups.length > 0 && (
                <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                    <CardHeader className="pb-3 border-b bg-blue-50/30">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <CardTitle className="text-base font-bold flex items-center gap-2 text-blue-950">
                                <Layers className="h-4 w-4 text-blue-600" />
                                Bulk Group Delegations ({bulkGroups.length})
                            </CardTitle>
                            <div className="flex items-center gap-2">
                                <Button size="sm" variant="outline" onClick={exportBulkGroupsOnly} className="h-7 text-xs border-blue-300 text-blue-900 bg-white hover:bg-blue-50">
                                    <Download className="h-3.5 w-3.5 mr-1 text-blue-700" /> Export Groups CSV
                                </Button>
                                <Badge variant="outline" className="border-blue-300 text-blue-800 font-bold">
                                    Total: {formatCurrency(bulkPaidRevenue)}
                                </Badge>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-3">
                        <div className="overflow-x-auto rounded-lg border">
                            <table className="w-full text-xs">
                                <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] border-b">
                                    <tr>
                                        <th className="py-2 px-3 text-left">Paymaster / Chapter</th>
                                        <th className="py-2 px-3 text-center">Attendees</th>
                                        <th className="py-2 px-3 text-right">Per Attendee</th>
                                        <th className="py-2 px-3 text-right">Total Amount</th>
                                        <th className="py-2 px-3 text-center">Payment Ref</th>
                                        <th className="py-2 px-3 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {bulkGroups.map((bg: any) => (
                                        <tr key={bg.id} className="hover:bg-slate-50/50">
                                            <td className="py-2.5 px-3 font-semibold text-slate-900">{bg.paymasterName || "Group Paymaster"}</td>
                                            <td className="py-2.5 px-3 text-center">{bg.attendeeCount || 0} seats</td>
                                            <td className="py-2.5 px-3 text-right">{formatCurrency(parseFloat(bg.amountPerAttendee || "0"))}</td>
                                            <td className="py-2.5 px-3 text-right font-bold text-slate-900">{formatCurrency(parseFloat(bg.totalAmount || "0"))}</td>
                                            <td className="py-2.5 px-3 text-center font-mono text-[10px] text-muted-foreground">{bg.paymentRef || "—"}</td>
                                            <td className="py-2.5 px-3 text-center">
                                                <Badge variant={bg.status === "PAID" ? "default" : "secondary"} className="text-[10px]">
                                                    {bg.status}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
