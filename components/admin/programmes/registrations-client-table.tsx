"use client"

import { useState } from "react"
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Printer, UserCheck, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { ClientCurrency } from "@/components/ui/client-currency"
import { MarkAttendanceButton } from "@/components/admin/programmes/mark-attendance-button"
import { DeleteRegistrationButton } from "@/components/admin/programmes/delete-registration-button"
import { markAttendanceAction, sendSelectedCertificatesAction } from "@/lib/actions/programmes"
import { toast } from "sonner"

export function RegistrationsClientTable({ 
    registrations, 
    programmeId 
}: { 
    registrations: any[], 
    programmeId: string 
}) {
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [isBulkLoading, setIsBulkLoading] = useState(false)

    const toggleAll = () => {
        if (selectedIds.length === registrations.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(registrations.map(r => r.id))
        }
    }

    const toggleId = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id))
        } else {
            setSelectedIds([...selectedIds, id])
        }
    }

    const handleBulkMarkAttended = async () => {
        if (selectedIds.length === 0) return
        
        setIsBulkLoading(true)
        try {
            let successCount = 0
            for (const id of selectedIds) {
                const reg = registrations.find(r => r.id === id)
                if (reg && reg.status !== 'ATTENDED') {
                    const result = await markAttendanceAction(id, 'ATTENDED')
                    if (result.success) successCount++
                }
            }
            toast.success(`Marked ${successCount} participants as attended`)
            setSelectedIds([])
            // We should refresh the page data here, but since it's a server component parent, 
            // a router.refresh() would be needed.
            window.location.reload()
        } catch (error) {
            toast.error("An error occurred during bulk update")
        } finally {
            setIsBulkLoading(false)
        }
    }

    const handleBulkSendCertificates = async () => {
        if (selectedIds.length === 0) return
        
        setIsBulkLoading(true)
        try {
            const result = await sendSelectedCertificatesAction(selectedIds)
            if (result.success) {
                toast.success(`Successfully sent ${result.count} certificates`)
                setSelectedIds([])
            } else {
                toast.error(result.error || "Failed to send certificates")
            }
        } catch (error) {
            toast.error("An error occurred during bulk sending")
        } finally {
            setIsBulkLoading(false)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {selectedIds.length > 0 && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full animate-in fade-in slide-in-from-left-4">
                            <span className="text-xs font-bold text-blue-700">{selectedIds.length} SELECTED</span>
                            <div className="flex items-center gap-1">
                                <Button 
                                    size="sm" 
                                    onClick={handleBulkMarkAttended}
                                    disabled={isBulkLoading}
                                    className="h-7 px-3 bg-blue-600 hover:bg-blue-700 text-[10px] font-bold uppercase tracking-wider"
                                >
                                    {isBulkLoading ? "Updating..." : "Mark Attended"}
                                    {!isBulkLoading && <CheckCircle2 className="ml-1.5 h-3 w-3" />}
                                </Button>
                                <Button 
                                    size="sm" 
                                    onClick={handleBulkSendCertificates}
                                    disabled={isBulkLoading}
                                    variant="outline"
                                    className="h-7 px-3 border-blue-600 text-blue-600 hover:bg-blue-50 text-[10px] font-bold uppercase tracking-wider"
                                >
                                    {isBulkLoading ? "Sending..." : "Send Certificates"}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
                <div className="text-xs text-muted-foreground font-medium">
                    Showing {registrations.length} registrations
                </div>
            </div>
            
            <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
                <Table>
                    <TableHeader className="bg-gray-50/50">
                        <TableRow>
                            <TableHead className="w-[40px] px-4">
                                <Checkbox 
                                    checked={selectedIds.length === registrations.length && registrations.length > 0}
                                    onCheckedChange={toggleAll}
                                />
                            </TableHead>
                            <TableHead className="w-[50px] font-bold text-gray-700 uppercase text-[11px] tracking-widest">S/N</TableHead>
                            <TableHead className="w-[120px] font-bold text-gray-700 uppercase text-[11px] tracking-widest">Mem. ID</TableHead>
                            <TableHead className="font-bold text-gray-700 uppercase text-[11px] tracking-widest">Name/Email</TableHead>
                            <TableHead className="font-bold text-gray-700 uppercase text-[11px] tracking-widest">Phone</TableHead>
                            <TableHead className="font-bold text-gray-700 uppercase text-[11px] tracking-widest">Type</TableHead>
                            <TableHead className="font-bold text-gray-700 uppercase text-[11px] tracking-widest">Payment</TableHead>
                            <TableHead className="font-bold text-gray-700 uppercase text-[11px] tracking-widest">Check-In</TableHead>
                            <TableHead className="font-bold text-gray-700 uppercase text-[11px] tracking-widest">Status</TableHead>
                            <TableHead className="text-right font-bold text-gray-700 uppercase text-[11px] tracking-widest">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {registrations.map((reg, index) => (
                            <TableRow key={reg.id} className="hover:bg-gray-50/80 transition-colors border-b last:border-0">
                                <TableCell className="px-4">
                                    <Checkbox 
                                        checked={selectedIds.includes(reg.id)}
                                        onCheckedChange={() => toggleId(reg.id)}
                                    />
                                </TableCell>
                                <TableCell className="py-4 text-gray-500 font-medium text-xs">{index + 1}</TableCell>
                                <TableCell className="py-4 text-black font-semibold uppercase text-xs tracking-wider">{reg.member?.memberId || 'Guest'}</TableCell>
                                <TableCell className="py-4">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-900 text-sm">{reg.name}</span>
                                        <span className="text-[10px] text-gray-500 font-medium">{reg.email}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="py-4 text-black font-medium text-sm">{reg.phone || 'N/A'}</TableCell>
                                <TableCell className="py-4">
                                    <Badge variant={reg.userId ? "outline" : "secondary"} className="font-bold uppercase tracking-tighter text-[9px] px-2 py-0.5">
                                        {reg.userId ? "Member" : "Guest"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="py-4">
                                    <ClientCurrency amount={parseFloat(reg.amountPaid || "0")} className="font-bold text-black text-sm" />
                                </TableCell>
                                <TableCell className="py-4">
                                    {reg.checkInTime ? (
                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-bold text-green-700 text-sm">{format(new Date(reg.checkInTime), "HH:mm")}</span>
                                            <span className="text-[9px] text-gray-400 uppercase font-bold tracking-tighter">By: {reg.checkInBy || 'Self'}</span>
                                        </div>
                                    ) : (
                                        <span className="text-gray-200">—</span>
                                    )}
                                </TableCell>
                                <TableCell className="py-4">
                                    <Badge 
                                        variant={reg.status === 'PAID' || reg.status === 'ATTENDED' ? 'default' : 'secondary'} 
                                        className={`font-black uppercase tracking-tighter text-[9px] px-2 py-0.5 ${
                                            reg.status === 'ATTENDED' ? 'bg-green-600' : 
                                            reg.status === 'PAID' ? 'bg-blue-600' : ''
                                        }`}
                                    >
                                        {reg.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="py-4 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-blue-50" asChild title="Print Access Slip">
                                            <Link href={`/programmes/registrations/${reg.id}/slip`} target="_blank">
                                                <Printer className="h-4 w-4 text-blue-600" />
                                            </Link>
                                        </Button>
                                        {(reg.status === 'PAID' || reg.status === 'REGISTERED' || reg.status === 'ATTENDED') && (
                                            <MarkAttendanceButton registrationId={reg.id} status={reg.status} userName={reg.name} />
                                        )}
                                        <DeleteRegistrationButton registrationId={reg.id} userName={reg.name} />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
