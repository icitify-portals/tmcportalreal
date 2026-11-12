"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
    Receipt, 
    Download, 
    HeartHandshake, 
    Layers, 
    Users, 
    CheckCircle2, 
    ExternalLink,
    FileSpreadsheet
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { toast } from "sonner"
import Link from "next/link"

interface NitpAuditExportCardProps {
    programme: {
        id: string
        title: string
        amount?: string | number | null
    }
    registrations: any[]
    sponsorshipPools: any[]
    bulkGroups: any[]
}

export function NitpAuditExportCard({
    programme,
    registrations,
    sponsorshipPools = [],
    bulkGroups = [],
}: NitpAuditExportCardProps) {
    const [isExporting, setIsExporting] = useState(false)

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
    let totalSponsorSeats = 0
    let claimedSponsorSeats = 0
    let paidPoolsCount = 0

    for (const pool of sponsorshipPools) {
        const tot = parseFloat(String(pool.totalAmount || "0"))
        if (pool.status === "PAID") {
            poolsPaidRevenue += tot
            paidPoolsCount++
        }
        totalSponsorSeats += pool.seatCount || 0
        claimedSponsorSeats += pool.seatsClaimed || 0
    }

    // 3. Bulk Groups breakdown
    let bulkPaidRevenue = 0
    let totalBulkAttendees = 0
    let paidBulkCount = 0

    for (const bg of bulkGroups) {
        const tot = parseFloat(String(bg.totalAmount || "0"))
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

    const handleExportAudit = () => {
        setIsExporting(true)
        try {
            const rows: string[] = []

            // Title Block
            rows.push([esc(`${programme.title} - COMPREHENSIVE FINANCIAL AUDIT REPORT`)].join(","))
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
            const safeTitle = programme.title.toLowerCase().replace(/[^a-z0-9]/g, "_").substring(0, 30)
            link.setAttribute("href", url)
            link.setAttribute("download", `${safeTitle}_financial_audit_${new Date().toISOString().split("T")[0]}.csv`)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
            toast.success("Comprehensive NITP Financial Audit CSV downloaded!")
        } catch (err) {
            console.error("Export error:", err)
            toast.error("Failed to generate export file")
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <Card className="border border-emerald-700/40 bg-gradient-to-br from-emerald-950/90 via-slate-900 to-emerald-950 text-white shadow-xl overflow-hidden">
            <CardHeader className="pb-4 border-b border-emerald-800/40 bg-emerald-950/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[11px] font-bold">
                                National Programme Audit
                            </Badge>
                            <Badge variant="outline" className="border-emerald-600 text-emerald-200 text-[11px]">
                                NITP 1448
                            </Badge>
                        </div>
                        <CardTitle className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                            <Receipt className="h-6 w-6 text-emerald-400" />
                            {programme.title}
                        </CardTitle>
                        <CardDescription className="text-emerald-200/90 text-xs">
                            Comprehensive financial audit and inflow reconciliation across Direct Attendees, Sponsorship Pools, and Bulk Groups.
                        </CardDescription>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            onClick={handleExportAudit}
                            disabled={isExporting}
                            className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-xs h-9 shadow-md"
                        >
                            <Download className="h-4 w-4 mr-1.5" />
                            {isExporting ? "Generating CSV..." : "Download Full Audit (CSV/Excel)"}
                        </Button>
                        <Button
                            variant="outline"
                            asChild
                            className="border-emerald-500/50 bg-emerald-900/40 hover:bg-emerald-800 text-white font-semibold text-xs h-9"
                        >
                            <Link href={`/dashboard/admin/programmes/${programme.id}/registrations?tab=financial-audit`}>
                                <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Open Programme Audit Tab
                            </Link>
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pt-5 space-y-5">
                {/* Reconciled Total Display */}
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 p-4 rounded-xl bg-emerald-900/30 border border-emerald-700/40">
                    <div>
                        <span className="text-xs uppercase font-bold text-emerald-300 tracking-wider">
                            Total Verified Inflow Collected
                        </span>
                        <div className="text-2xl sm:text-3xl font-black text-white mt-0.5">
                            {formatCurrency(grandTotalRevenue)}
                        </div>
                    </div>
                    <div className="text-xs text-emerald-200/80">
                        {registrations.length} registered participants &bull; {paidPoolsCount} donor pools &bull; {paidBulkCount} bulk packages
                    </div>
                </div>

                {/* Breakdown Pills */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-900/80 border border-emerald-800/40 rounded-xl space-y-1">
                        <div className="flex items-center justify-between text-xs text-emerald-300 font-semibold">
                            <span className="flex items-center gap-1.5">
                                <Users className="h-3.5 w-3.5" /> Direct Attendees
                            </span>
                            <span>{grandTotalRevenue > 0 ? ((directPaidRevenue / grandTotalRevenue) * 100).toFixed(1) : 0}%</span>
                        </div>
                        <div className="text-lg font-bold text-white">{formatCurrency(directPaidRevenue + partialRevenue)}</div>
                        <div className="text-[11px] text-muted-foreground">{directPaidCount} paid tickets &bull; {partialPaidCount} deposits</div>
                    </div>

                    <div className="p-3 bg-slate-900/80 border border-purple-800/40 rounded-xl space-y-1">
                        <div className="flex items-center justify-between text-xs text-purple-300 font-semibold">
                            <span className="flex items-center gap-1.5">
                                <HeartHandshake className="h-3.5 w-3.5" /> Sponsorship Pools
                            </span>
                            <span>{grandTotalRevenue > 0 ? ((poolsPaidRevenue / grandTotalRevenue) * 100).toFixed(1) : 0}%</span>
                        </div>
                        <div className="text-lg font-bold text-white">{formatCurrency(poolsPaidRevenue)}</div>
                        <div className="text-[11px] text-muted-foreground">{paidPoolsCount} pools &bull; {totalSponsorSeats} seats donated ({claimedSponsorSeats} claimed)</div>
                    </div>

                    <div className="p-3 bg-slate-900/80 border border-blue-800/40 rounded-xl space-y-1">
                        <div className="flex items-center justify-between text-xs text-blue-300 font-semibold">
                            <span className="flex items-center gap-1.5">
                                <Layers className="h-3.5 w-3.5" /> Bulk Delegations
                            </span>
                            <span>{grandTotalRevenue > 0 ? ((bulkPaidRevenue / grandTotalRevenue) * 100).toFixed(1) : 0}%</span>
                        </div>
                        <div className="text-lg font-bold text-white">{formatCurrency(bulkPaidRevenue)}</div>
                        <div className="text-[11px] text-muted-foreground">{paidBulkCount} bulk packages &bull; {totalBulkAttendees} delegate seats</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
