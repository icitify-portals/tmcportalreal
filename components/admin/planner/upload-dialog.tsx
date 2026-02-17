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
            <DialogContent className={step === 'preview' ? "sm:max-w-[900px]" : "sm:max-w-[425px]"}>
                <DialogHeader>
                    <DialogTitle>{step === 'preview' ? 'Preview Import' : 'Import Year Planner'}</DialogTitle>
                    <DialogDescription>
                        {step === 'preview'
                            ? 'Review the data below. Columns like "Committee" are excluded. Click Confirm to save.'
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
                    <div className="space-y-4">
                        <div className="max-h-[60vh] overflow-auto border rounded-md">
                            <table className="w-full text-sm">
                                <thead className="bg-muted sticky top-0">
                                    <tr>
                                        <th className="p-2 text-left">Office</th>
                                        <th className="p-2 text-left">Title</th>
                                        <th className="p-2 text-left">Format</th>
                                        <th className="p-2 text-left">Date</th>
                                        <th className="p-2 text-left">Venue</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewData.slice(0, 100).map((row, i) => (
                                        <tr key={i} className="border-t hover:bg-muted/50">
                                            <td className="p-2">{row.officeName}</td>
                                            <td className="p-2 font-medium">{row.title}</td>
                                            <td className="p-2 text-xs">{row.format}</td>
                                            <td className="p-2 text-xs">{new Date(row.startDate).toLocaleDateString()}</td>
                                            <td className="p-2 text-xs truncate max-w-[150px]">{row.venue}</td>
                                        </tr>
                                    ))}
                                    {previewData.length > 100 && (
                                        <tr>
                                            <td colSpan={5} className="p-2 text-center text-muted-foreground">
                                                ... and {previewData.length - 100} more items
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <DialogFooter className="gap-2">
                            <Button variant="outline" onClick={() => setStep('upload')} disabled={isLoading}>
                                Back
                            </Button>
                            <Button onClick={onConfirmImport} disabled={isLoading}>
                                {isLoading ? "Importing..." : `Confirm Import (${previewData.length})`}
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
