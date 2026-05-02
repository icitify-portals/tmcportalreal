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
        <div className="space-y-4 border border-emerald-800/40 p-4 rounded-md bg-emerald-950/20 mt-4">
            <div>
                <h3 className="text-sm font-bold text-emerald-100 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Programme Materials Manager
                </h3>
                <p className="text-xs text-emerald-200/80">Upload and manage post-programme materials (slides, docs). These will be emailed to attendees.</p>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-4">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                </div>
            ) : (
                <div className="space-y-4">
                    {materials.length > 0 ? (
                        <div className="space-y-2">
                            {materials.map((mat) => (
                                <div key={mat.id} className="flex items-center justify-between p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-md">
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-4 h-4 text-emerald-400" />
                                        <a href={mat.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-emerald-300 hover:underline">
                                            {mat.title}
                                        </a>
                                    </div>
                                    <Button 
                                        type="button" 
                                        variant="ghost" 
                                        size="sm" 
                                        className="text-red-400 hover:bg-red-950/40 hover:text-red-300"
                                        onClick={() => handleDelete(mat.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-4 border border-dashed border-emerald-800/40 rounded-md bg-emerald-950/10">
                            <p className="text-sm text-emerald-100/60">No materials uploaded yet.</p>
                        </div>
                    )}

                    <div className="flex flex-col md:flex-row items-center justify-between p-3 border border-emerald-800/40 rounded-md bg-emerald-950/30 gap-4">
                        <div>
                            <p className="text-xs font-semibold text-emerald-100 uppercase tracking-wider">Quick Multiple Uploads</p>
                            <p className="text-[11px] text-emerald-300">Upload multiple files at once. The filename will automatically be used as the material title.</p>
                        </div>
                        <FileUpload 
                            multiple={true}
                            onUploadComplete={() => {}}
                            onUploadMultipleComplete={async (urls, files) => {
                                setIsAdding(true)
                                try {
                                    for (let i = 0; i < urls.length; i++) {
                                        await addProgrammeMaterial({
                                            programmeId,
                                            title: files[i]?.name || `Material ${i + 1}`,
                                            url: urls[i],
                                            fileType: "DOCUMENT"
                                        })
                                    }
                                    toast.success(`${urls.length} materials uploaded successfully`)
                                    fetchMaterials()
                                } catch (err) {
                                    toast.error("Error adding some files")
                                } finally {
                                    setIsAdding(false)
                                }
                            }}
                            label="Choose Multiple Files"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-2 items-start p-3 border border-emerald-800/40 rounded-md bg-emerald-950/30">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-emerald-100">Title</label>
                            <Input 
                                placeholder="e.g. Day 1 Slides" 
                                value={newTitle} 
                                onChange={(e) => setNewTitle(e.target.value)} 
                                className="border-emerald-800/40 bg-emerald-950/20 text-emerald-100"
                            />
                        </div>
                        
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-emerald-100">File Upload</label>
                            <div className="flex items-center gap-2">
                                <Input 
                                    placeholder="File URL" 
                                    value={newUrl} 
                                    onChange={(e) => setNewUrl(e.target.value)} 
                                    className="border-emerald-800/40 bg-emerald-950/20 text-emerald-100"
                                />
                                <FileUpload 
                                    onUploadComplete={async (url, file) => {
                                        setNewUrl(url)
                                        const title = newTitle || file?.name || "Untitled Material"
                                        setIsAdding(true)
                                        try {
                                            const res = await addProgrammeMaterial({
                                                programmeId,
                                                title,
                                                url,
                                                fileType: "DOCUMENT"
                                            })
                                            if (res.success) {
                                                toast.success(`"${title}" added successfully`)
                                                setNewTitle("")
                                                setNewUrl("")
                                                fetchMaterials()
                                            } else {
                                                toast.error(res.error || "Failed to add material")
                                            }
                                        } catch (error) {
                                            toast.error("An unexpected error occurred")
                                        } finally {
                                            setIsAdding(false)
                                        }
                                    }} 
                                    label="Upload"
                                />
                            </div>
                        </div>

                        <div className="pt-5">
                            <Button 
                                type="button" 
                                onClick={handleAdd}
                                disabled={isAdding || !newTitle || !newUrl}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
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
