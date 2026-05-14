"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { locationData } from "@/lib/location-data"

interface MockJurisdictionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    level: "STATE" | "LOCAL_GOVERNMENT" | "BRANCH"
    onConfirm: (data: { state?: string; lga?: string; branch?: string }) => void
}

export function MockJurisdictionDialog({ open, onOpenChange, level, onConfirm }: MockJurisdictionDialogProps) {
    const [state, setState] = useState<string>("")
    const [lga, setLga] = useState<string>("")
    const [branch, setBranch] = useState<string>("")

    const states = Object.keys(locationData)
    const selectedStateData = state ? (locationData as any)[state] : null
    const lgas = selectedStateData ? selectedStateData.lgas : []
    const selectedLgaData = lga ? lgas.find((l: any) => l.name === lga) : null
    const branches = selectedLgaData ? selectedLgaData.branches : []

    useEffect(() => {
        if (open) {
            // Reset on open or load from cookies? For now just reset
            setState("")
            setLga("")
            setBranch("")
        }
    }, [open])

    const handleConfirm = () => {
        onConfirm({ state, lga, branch })
        onOpenChange(false)
    }

    const isValid = () => {
        if (level === "STATE") return !!state
        if (level === "LOCAL_GOVERNMENT") return !!state && !!lga
        if (level === "BRANCH") return !!state && !!lga && !!branch
        return false
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Select Mock Jurisdiction</DialogTitle>
                    <DialogDescription>
                        Choose the {level.toLowerCase().replace("_", " ")} you want to view the portal as.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>State</Label>
                        <Select value={state} onValueChange={(v) => { setState(v); setLga(""); setBranch(""); }}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select State" />
                            </SelectTrigger>
                            <SelectContent>
                                {states.map(s => (
                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {(level === "LOCAL_GOVERNMENT" || level === "BRANCH") && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                            <Label>LGA</Label>
                            <Select value={lga} onValueChange={(v) => { setLga(v); setBranch(""); }} disabled={!state}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select LGA" />
                                </SelectTrigger>
                                <SelectContent>
                                    {lgas.map((l: any) => (
                                        <SelectItem key={l.name} value={l.name}>{l.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {level === "BRANCH" && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                            <Label>Branch</Label>
                            <Select value={branch} onValueChange={setBranch} disabled={!lga}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Branch" />
                                </SelectTrigger>
                                <SelectContent>
                                    {branches.map((b: string) => (
                                        <SelectItem key={b} value={b}>{b}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleConfirm} disabled={!isValid()} className="bg-green-700 hover:bg-green-800">
                        Confirm View
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
