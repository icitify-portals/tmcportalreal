"use client"

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
import { useState } from "react"
import { toast } from "sonner"
import { previewYearPlanner, importYearPlannerData } from "@/lib/actions/planner"
import { Upload } from "lucide-react"

export function UploadPlannerDialog() {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [step, setStep] = useState<'upload' | 'preview'>('upload')
    const [previewData, setPreviewData] = useState<any[]>([])

    // Reset when closed
    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen)
        if (!newOpen) {
            setStep('upload')
            setPreviewData([])
        }
    }

    async function onPreview(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsLoading(true)

        try {
            const formData = new FormData(event.currentTarget)
            const res = await previewYearPlanner(formData)

            if (res.success && res.data) {
                setPreviewData(res.data)
                setStep('preview')
                if (res.skipped > 0) {
                    toast.warning(`Found ${res.count} items, but skipped ${res.skipped} incomplete rows.`)
                } else {
                    toast.success(`Found ${res.count} items ready for import.`)
                }
            } else {
                toast.error(res.error || "Failed to parse file")
            }
        } catch (e) {
            toast.error("An error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    const handleRemove = (index: number) => {
        setPreviewData(prev => prev.filter((_, i) => i !== index))
    }

    async function onConfirmImport() {
        setIsLoading(true)
        try {
            const res = await importYearPlannerData(previewData)
            if (res.success) {
                toast.success(`Successfully imported ${res.count} programmes`)
                handleOpenChange(false)
            } else {
                toast.error(res.error || "Failed to import data")
            }
        } catch (e) {
            toast.error("Import failed")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Import Excel</Button>
            </DialogTrigger>
            <DialogContent className={step === 'preview' ? "max-w-[95vw] h-[90vh] flex flex-col" : "sm:max-w-[425px]"}>
                <DialogHeader>
                    <DialogTitle>{step === 'preview' ? 'Preview Import' : 'Import Year Planner'}</DialogTitle>
                    <DialogDescription>
                        {step === 'preview'
                            ? `Review the ${previewData.length} items below. Scroll horizontally to see all fields. Remove any unwanted rows.`
                            : 'Upload an Excel file (.xlsx) containing the year planner.'
                        }
                    </DialogDescription>
                </DialogHeader>

                {step === 'upload' ? (
                    <form onSubmit={onPreview} className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="file" className="text-right">Excel File</Label>
                            <Input
                                id="file"
                                name="file"
                                type="file"
                                accept=".xlsx, .xls"
                                className="col-span-3"
                                required
                            />
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? "Parsing..." : "Preview"}
                            </Button>
                        </DialogFooter>
                    </form>
                ) : (
                    <div className="flex-1 overflow-hidden flex flex-col gap-4">
                        <div className="flex-1 overflow-auto border rounded-md">
                            <table className="w-full text-sm whitespace-nowrap">
                                <thead className="bg-muted sticky top-0 z-10">
                                    <tr>
                                        <th className="p-2 text-left w-[50px]">Action</th>
                                        <th className="p-2 text-left">Office</th>
                                        <th className="p-2 text-left">Title</th>
                                        <th className="p-2 text-left">Format</th>
                                        <th className="p-2 text-left">Frequency</th>
                                        <th className="p-2 text-left">Objectives</th>
                                        <th className="p-2 text-left">Info</th>
                                        <th className="p-2 text-left">Date</th>
                                        <th className="p-2 text-left">Time</th>
                                        <th className="p-2 text-left">Venue</th>
                                        <th className="p-2 text-left">Budget</th>
                                        <th className="p-2 text-left">Committee</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewData.map((row, i) => (
                                        <tr key={i} className="border-t hover:bg-muted/50">
                                            <td className="p-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-100"
                                                    onClick={() => handleRemove(i)}
                                                    title="Remove row"
                                                >
                                                    <span className="sr-only">Remove</span>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                                </Button>
                                            </td>
                                            <td className="p-2">{row.officeName}</td>
                                            <td className="p-2 font-medium max-w-[200px] truncate" title={row.title}>{row.title}</td>
                                            <td className="p-2 text-xs">{row.format}</td>
                                            <td className="p-2 text-xs">{row.frequency}</td>
                                            <td className="p-2 text-xs max-w-[150px] truncate" title={row.objectives}>{row.objectives}</td>
                                            <td className="p-2 text-xs max-w-[150px] truncate" title={row.additionalInfo}>{row.additionalInfo}</td>
                                            <td className="p-2 text-xs">{new Date(row.startDate).toLocaleDateString()}</td>
                                            <td className="p-2 text-xs">{row.time}</td>
                                            <td className="p-2 text-xs max-w-[150px] truncate" title={row.venue}>{row.venue}</td>
                                            <td className="p-2 text-xs">{row.budget}</td>
                                            <td className="p-2 text-xs max-w-[150px] truncate" title={row.committee}>{row.committee}</td>
                                        </tr>
                                    ))}
                                    {previewData.length === 0 && (
                                        <tr>
                                            <td colSpan={12} className="p-8 text-center text-muted-foreground">
                                                No items to import.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <DialogFooter className="gap-2 shrink-0">
                            <Button variant="outline" onClick={() => setStep('upload')} disabled={isLoading}>
                                Back
                            </Button>
                            <Button onClick={onConfirmImport} disabled={isLoading || previewData.length === 0}>
                                {isLoading ? "Importing..." : `Confirm Import (${previewData.length})`}
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
