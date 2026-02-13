"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings, RefreshCcw, Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { updateOrganizationBankDetails, syncSubaccount } from "@/lib/actions/payment-settings"
import { useRouter } from "next/navigation"

interface SubaccountManagerProps {
    organization: any
    banks: { name: string, code: string }[]
}

export function SubaccountManager({ organization, banks }: SubaccountManagerProps) {
    const [loading, setLoading] = useState(false)
    const [syncing, setSyncing] = useState(false)
    const [open, setOpen] = useState(false)
    const router = useRouter()

    const [bankDetails, setBankDetails] = useState({
        bankName: organization.bankName || "",
        bankCode: organization.bankCode || "",
        accountNumber: organization.accountNumber || "",
    })

    const handleSaveDetails = async () => {
        try {
            setLoading(true)
            const result = await updateOrganizationBankDetails(organization.id, bankDetails)
            if (result.success) {
                toast.success("Bank details updated locally")
                router.refresh()
            } else {
                toast.error(result.error)
            }
        } finally {
            setLoading(false)
        }
    }

    const handleSync = async () => {
        try {
            setSyncing(true)
            const result = await syncSubaccount(organization.id)
            if (result.success) {
                toast.success(`Connected to Paystack! Code: ${result.subaccountCode}`)
                router.refresh()
                setOpen(false)
            } else {
                toast.error(result.error)
            }
        } finally {
            setSyncing(false)
        }
    }

    return (
        <div className="flex items-center gap-2">
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Configure
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Bank Details: {organization.name}</DialogTitle>
                        <DialogDescription>
                            Enter bank details to create a Paystack subaccount for this jurisdiction.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="bank">Settlement Bank</Label>
                            <Select 
                                value={bankDetails.bankCode} 
                                onValueChange={(val) => {
                                    const bank = banks.find(b => b.code === val)
                                    setBankDetails(prev => ({ ...prev, bankCode: val, bankName: bank?.name || "" }))
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select bank" />
                                </SelectTrigger>
                                <SelectContent>
                                    {banks.map((bank) => (
                                        <SelectItem key={bank.code} value={bank.code}>
                                            {bank.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="account_number">Account Number</Label>
                            <Input
                                id="account_number"
                                maxLength={10}
                                value={bankDetails.accountNumber}
                                onChange={(e) => setBankDetails(prev => ({ ...prev, accountNumber: e.target.value }))}
                            />
                        </div>
                    </div>
                    <DialogFooter className="flex flex-col gap-2 sm:flex-row">
                        <Button 
                            variant="secondary" 
                            onClick={handleSaveDetails} 
                            disabled={loading || syncing}
                            className="w-full sm:w-auto"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            Save Locally
                        </Button>
                        <Button 
                            onClick={handleSync} 
                            disabled={syncing || !bankDetails.bankCode || bankDetails.accountNumber.length !== 10}
                            className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                        >
                            {syncing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCcw className="h-4 w-4 mr-2" />}
                            Sync with Paystack
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {organization.paystackSubaccountCode && (
                 <Button variant="ghost" size="sm" className="text-blue-600" asChild>
                    <a href={`https://dashboard.paystack.com/#/subaccounts/${organization.paystackSubaccountCode}`} target="_blank" rel="noreferrer">
                        View on Paystack
                    </a>
                </Button>
            )}
        </div>
    )
}
