"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Loader2, Image as ImageIcon, Signature, Building2, UserCircle } from "lucide-react"
import { approveProgrammeState, approveProgrammeNational, rejectProgramme, getRecentCertificateAssets } from "@/lib/actions/programmes"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileUpload as FileUploadInput } from "@/components/ui/file-upload"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { useEffect } from "react"

interface ReviewActionsProps {
    programmeId: string
    status: string
    hasCertificate?: boolean
}

export function ReviewActions({ programmeId, status, hasCertificate }: ReviewActionsProps) {
    const [isApproving, setIsApproving] = useState(false)
    const [isRejecting, setIsRejecting] = useState(false)
    const [rejectionReason, setRejectionReason] = useState("")
    const [openReject, setOpenReject] = useState(false)
    const [openApprove, setOpenApprove] = useState(false)

    // Certificate Branding State
    const [certTemplateType, setCertTemplateType] = useState("TMC_ONLY")
    const [tmcSignature, setTmcSignature] = useState("")
    const [tmcSignatory, setTmcSignatory] = useState("")
    const [partnerName, setPartnerName] = useState("")
    const [partnerLogo, setPartnerLogo] = useState("")
    const [partnerSignature, setPartnerSignature] = useState("")
    const [partnerSignatory, setPartnerSignatory] = useState("")

    const [isPublic, setIsPublic] = useState(true)

    // Asset Library
    const [assets, setAssets] = useState<any>({ signatures: [], signatories: [], partnerLogos: [], partnerSignatures: [], partnerNames: [] })

    const [mounted, setMounted] = useState(false)
    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (mounted && openApprove && status === 'PENDING_NATIONAL') {
            getRecentCertificateAssets().then(setAssets)
        }
    }, [openApprove, status, mounted])

    if (!mounted) {
        return (
            <div className="flex gap-2 mt-4 pt-4 border-t">
                <Button size="sm" disabled>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                </Button>
            </div>
        )
    }

    async function handleApprove() {
        setIsApproving(true)
        try {
            let res
            if (status === 'PENDING_STATE') {
                res = await approveProgrammeState(programmeId)
            } else if (status === 'PENDING_NATIONAL') {
                const certData = hasCertificate ? {
                    certTemplateType,
                    certTmcSignature: tmcSignature,
                    certTmcSignatory: tmcSignatory,
                    certPartnerName: partnerName,
                    certPartnerLogo: partnerLogo,
                    certPartnerSignature: partnerSignature,
                    certPartnerSignatory: partnerSignatory
                } : null
                res = await approveProgrammeNational(programmeId, certData, isPublic)
            }
            
            if (res?.success) {
                toast.success("Programme approved")
                setOpenApprove(false)
            } else {
                toast.error(res?.error || "Approval failed")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setIsApproving(false)
        }
    }

    async function handleReject() {
        if (!rejectionReason.trim()) {
            toast.error("Please provide a reason for rejection")
            return
        }

        setIsRejecting(true)
        try {
            const res = await rejectProgramme(programmeId, rejectionReason)
            if (res.success) {
                toast.success("Programme rejected")
                setOpenReject(false)
            } else {
                toast.error(res.error || "Rejection failed")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setIsRejecting(false)
        }
    }

    return (
        <div className="flex gap-2 mt-4 pt-4 border-t" suppressHydrationWarning>
            {status === 'PENDING_STATE' ? (
                <Button 
                    size="sm" 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={handleApprove}
                    disabled={isApproving || isRejecting}
                >
                    {isApproving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                    Approve (State)
                </Button>
            ) : (
                <Dialog open={openApprove} onOpenChange={setOpenApprove}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700" disabled={isApproving || isRejecting}>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Review & Approve
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Finalize Approval</DialogTitle>
                            <DialogDescription>
                                {hasCertificate 
                                    ? "This programme requested certificates. Please configure the branding and signature details before final approval."
                                    : "Review and approve this programme for publication."}
                            </DialogDescription>
                        </DialogHeader>

                        {hasCertificate && (
                            <div className="space-y-6 py-4">
                                <div className="space-y-2">
                                    <Label>Certificate Template</Label>
                                    <Select value={certTemplateType} onValueChange={setCertTemplateType}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="TMC_ONLY">TMC Only (Standard)</SelectItem>
                                            <SelectItem value="PARTNER_ONLY">Partner Only (Hosted)</SelectItem>
                                            <SelectItem value="BOTH">Partnership (TMC & Partner)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {(certTemplateType === 'TMC_ONLY' || certTemplateType === 'BOTH') && (
                                    <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
                                        <h3 className="text-xs font-bold uppercase flex items-center gap-2"><Building2 className="w-3 h-3" /> TMC Branding</h3>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>TMC Signatory Title</Label>
                                                <Input placeholder="e.g. National Amir" value={tmcSignatory} onChange={(e) => setTmcSignatory(e.target.value)} />
                                                <AssetLibrary items={assets.signatories} onSelect={setTmcSignatory} label="Recent Signatories" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>TMC Signature</Label>
                                                <div className="flex gap-2">
                                                    <Input placeholder="Signature URL" value={tmcSignature} onChange={(e) => setTmcSignature(e.target.value)} />
                                                    <FileUploadInput onUploadComplete={setTmcSignature} label="Upload" accept="image/*" />
                                                </div>
                                                <AssetLibrary items={assets.signatures} onSelect={setTmcSignature} label="Recent Signatures" isImage />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {(certTemplateType === 'PARTNER_ONLY' || certTemplateType === 'BOTH') && (
                                    <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
                                        <h3 className="text-xs font-bold uppercase flex items-center gap-2"><ImageIcon className="w-3 h-3" /> Partner Branding</h3>
                                        <div className="space-y-2">
                                            <Label>Partner Organization Name</Label>
                                            <Input placeholder="e.g. Al-Hikmah University" value={partnerName} onChange={(e) => setPartnerName(e.target.value)} />
                                            <AssetLibrary items={assets.partnerNames} onSelect={setPartnerName} label="Recent Partners" />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Partner Signatory Title</Label>
                                                <Input placeholder="e.g. Vice Chancellor" value={partnerSignatory} onChange={(e) => setPartnerSignatory(e.target.value)} />
                                                <AssetLibrary items={assets.partnerSignatories} onSelect={setPartnerSignatory} label="Recent Signatories" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Partner Logo</Label>
                                                <div className="flex gap-2">
                                                    <Input placeholder="Logo URL" value={partnerLogo} onChange={(e) => setPartnerLogo(e.target.value)} />
                                                    <FileUploadInput onUploadComplete={setPartnerLogo} label="Upload" accept="image/*" />
                                                </div>
                                                <AssetLibrary items={assets.partnerLogos} onSelect={setPartnerLogo} label="Recent Logos" isImage />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="py-2 flex items-center gap-2">
                            <input 
                                type="checkbox" 
                                id="make-public" 
                                checked={isPublic} 
                                onChange={(e) => setIsPublic(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-600"
                            />
                            <Label htmlFor="make-public" className="cursor-pointer font-medium">Make this programme visible on the Public Portal</Label>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setOpenApprove(false)} disabled={isApproving}>Cancel</Button>
                            <Button className="bg-green-600 hover:bg-green-700" onClick={handleApprove} disabled={isApproving}>
                                {isApproving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Final Approve
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            <Dialog open={openReject} onOpenChange={setOpenReject}>
                <DialogTrigger asChild>
                    <Button size="sm" variant="destructive">
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Programme</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejecting this programme. This will be visible to the submitting officer.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea 
                            placeholder="Reason for rejection..." 
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpenReject(false)} disabled={isRejecting}>Cancel</Button>
                        <Button variant="destructive" onClick={handleReject} disabled={isRejecting}>
                            {isRejecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm Rejection
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function AssetLibrary({ items, onSelect, label, isImage }: { items: string[], onSelect: (val: string) => void, label: string, isImage?: boolean }) {
    if (!items || items.length === 0) return null
    return (
        <div className="mt-1">
            <span className="text-[10px] text-muted-foreground block mb-1">{label} (click to reuse):</span>
            <ScrollArea className="h-12 w-full border rounded-md bg-white/50">
                <div className="flex gap-2 p-1">
                    {items.map((item, i) => (
                        <button 
                            key={i} 
                            type="button"
                            onClick={() => onSelect(item)}
                            className="shrink-0 h-8 px-2 border rounded hover:bg-muted flex items-center justify-center overflow-hidden"
                        >
                            {isImage ? (
                                <img src={item} alt="Asset" className="h-6 w-auto object-contain" />
                            ) : (
                                <span className="text-[10px] truncate max-w-[100px]">{item}</span>
                            )}
                        </button>
                    ))}
                </div>
            </ScrollArea>
        </div>
    )
}
