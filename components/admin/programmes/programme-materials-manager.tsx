"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Trash2, FileText, Loader2 } from "lucide-react"
import { FileUpload } from "@/components/ui/file-upload"
import { getProgrammeMaterials, addProgrammeMaterial, deleteProgrammeMaterial } from "@/lib/actions/programmes"
import { toast } from "sonner"

export function ProgrammeMaterialsManager({ programmeId }: { programmeId: string }) {
    const [materials, setMaterials] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isAdding, setIsAdding] = useState(false)
    const [newTitle, setNewTitle] = useState("")
    const [newUrl, setNewUrl] = useState("")

    useEffect(() => {
        fetchMaterials()
    }, [programmeId])

    const fetchMaterials = async () => {
        setIsLoading(true)
        try {
            const mats = await getProgrammeMaterials(programmeId)
            setMaterials(mats)
        } catch (error) {
            toast.error("Failed to load materials")
        } finally {
            setIsLoading(false)
        }
    }

    const handleAdd = async () => {
        if (!newTitle || !newUrl) {
            toast.error("Please provide both title and file")
            return
        }

        setIsAdding(true)
        try {
            const result = await addProgrammeMaterial({
                programmeId,
                title: newTitle,
                url: newUrl,
                fileType: "DOCUMENT"
            })

            if (result.success) {
                toast.success("Material added")
                setNewTitle("")
                setNewUrl("")
                fetchMaterials()
            } else {
                toast.error(result.error || "Failed to add material")
            }
        } catch (error) {
            toast.error("An unexpected error occurred")
        } finally {
            setIsAdding(false)
        }
    }

    const handleDelete = async (materialId: string) => {
        if (!confirm("Are you sure you want to delete this material?")) return

        try {
            const result = await deleteProgrammeMaterial(materialId, programmeId)
            if (result.success) {
                toast.success("Material deleted")
                fetchMaterials()
            } else {
                toast.error(result.error || "Failed to delete material")
            }
        } catch (error) {
            toast.error("An unexpected error occurred")
        }
    }

    return (
        <div className="space-y-4 border p-4 rounded-md bg-green-50/30 mt-4">
            <div>
                <h3 className="text-sm font-bold text-black flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Programme Materials Manager
                </h3>
                <p className="text-xs text-black">Upload and manage post-programme materials (slides, docs). These will be emailed to attendees.</p>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-4">
                    <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                </div>
            ) : (
                <div className="space-y-4">
                    {materials.length > 0 ? (
                        <div className="space-y-2">
                            {materials.map((mat) => (
                                <div key={mat.id} className="flex items-center justify-between p-3 bg-white border rounded-md">
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-4 h-4 text-green-600" />
                                        <a href={mat.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-green-700 hover:underline">
                                            {mat.title}
                                        </a>
                                    </div>
                                    <Button 
                                        type="button" 
                                        variant="ghost" 
                                        size="sm" 
                                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                        onClick={() => handleDelete(mat.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-4 border border-dashed rounded-md bg-white/50">
                            <p className="text-sm text-gray-500">No materials uploaded yet.</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-2 items-start p-3 border rounded-md bg-white">
                        <div className="space-y-1">
                            <label className="text-xs font-medium">Title</label>
                            <Input 
                                placeholder="e.g. Day 1 Slides" 
                                value={newTitle} 
                                onChange={(e) => setNewTitle(e.target.value)} 
                            />
                        </div>
                        
                        <div className="space-y-1">
                            <label className="text-xs font-medium">File Upload</label>
                            <div className="flex items-center gap-2">
                                <Input 
                                    placeholder="File URL" 
                                    value={newUrl} 
                                    onChange={(e) => setNewUrl(e.target.value)} 
                                />
                                <FileUpload 
                                    onUploadComplete={(url) => setNewUrl(url)} 
                                    label="Upload"
                                />
                            </div>
                        </div>

                        <div className="pt-5">
                            <Button 
                                type="button" 
                                onClick={handleAdd}
                                disabled={isAdding || !newTitle || !newUrl}
                                className="w-full bg-green-600 hover:bg-green-700 text-white"
                            >
                                {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                <span className="ml-2">Add</span>
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
