"use client"

import { useState, useEffect } from "react"
import { getProgrammeMaterials } from "@/lib/actions/programmes"
import { Button } from "@/components/ui/button"
import { FileText, Download } from "lucide-react"

export function ProgrammeMaterialsDownload({ programmeId }: { programmeId: string }) {
    const [materials, setMaterials] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        getProgrammeMaterials(programmeId).then(mats => {
            setMaterials(mats)
            setIsLoading(false)
        })
    }, [programmeId])

    if (isLoading || materials.length === 0) return null

    return (
        <div className="w-full space-y-2 mt-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Programme Materials</p>
            <div className="flex flex-col gap-2">
                {materials.map((mat) => (
                    <Button 
                        key={mat.id} 
                        variant="outline" 
                        size="sm" 
                        asChild 
                        className="w-full justify-start text-left font-normal border-green-200 text-green-700 hover:bg-green-50"
                    >
                        <a href={mat.url} target="_blank" rel="noreferrer">
                            <FileText className="mr-2 h-4 w-4 shrink-0" />
                            <span className="truncate">{mat.title}</span>
                            <Download className="ml-auto h-4 w-4 opacity-50 shrink-0" />
                        </a>
                    </Button>
                ))}
            </div>
        </div>
    )
}
