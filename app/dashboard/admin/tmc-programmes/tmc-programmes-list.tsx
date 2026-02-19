"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Edit, Trash2, Search, BookOpen } from "lucide-react"
import Link from "next/link"
import { deleteTmcProgramme, toggleTmcProgrammeActive } from "@/lib/actions/tmc-programmes"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export type TmcProgrammeData = {
    id: string
    title: string
    description: string | null
    iconName: string | null
    category: string | null
    order: number | null
    isActive: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
}

interface TmcProgrammesListProps {
    initialProgrammes: TmcProgrammeData[]
}

const categoryColors: Record<string, string> = {
    Spiritual: "bg-violet-100 text-violet-700 border-violet-200",
    Social: "bg-sky-100 text-sky-700 border-sky-200",
    Health: "bg-rose-100 text-rose-700 border-rose-200",
    Economic: "bg-amber-100 text-amber-700 border-amber-200",
    Humanitarian: "bg-emerald-100 text-emerald-700 border-emerald-200",
}

export function TmcProgrammesList({ initialProgrammes }: TmcProgrammesListProps) {
    const [programmes, setProgrammes] = useState(initialProgrammes)
    const [search, setSearch] = useState("")
    const [deleting, setDeleting] = useState<string | null>(null)
    const [toggling, setToggling] = useState<string | null>(null)
    const router = useRouter()

    const filtered = programmes.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        (p.category ?? "").toLowerCase().includes(search.toLowerCase())
    )

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
        setDeleting(id)
        const res = await deleteTmcProgramme(id)
        if (res.success) {
            toast.success("Programme deleted")
            setProgrammes(programmes.filter(p => p.id !== id))
            router.refresh()
        } else toast.error("Failed to delete")
        setDeleting(null)
    }

    const handleToggle = async (id: string, current: boolean) => {
        setToggling(id)
        const res = await toggleTmcProgrammeActive(id, !current)
        if (res.success) {
            toast.success(`Programme ${!current ? "activated" : "deactivated"}`)
            setProgrammes(programmes.map(p => p.id === id ? { ...p, isActive: !current } : p))
            router.refresh()
        } else toast.error("Failed to update status")
        setToggling(null)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search programmes..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="max-w-sm"
                />
            </div>
            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead>Programme</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Order</TableHead>
                            <TableHead>Active</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length > 0 ? filtered.map(p => (
                            <TableRow key={p.id} className="hover:bg-muted/30 transition-colors">
                                <TableCell>
                                    <div>
                                        <p className="font-semibold">{p.title}</p>
                                        {p.description && (
                                            <p className="text-xs text-muted-foreground line-clamp-1 max-w-[280px] mt-0.5">{p.description}</p>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {p.category ? (
                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${categoryColors[p.category] ?? "bg-gray-100 text-gray-700"}`}>
                                            {p.category}
                                        </span>
                                    ) : <span className="text-muted-foreground text-xs">—</span>}
                                </TableCell>
                                <TableCell>
                                    <span className="text-sm text-muted-foreground">{p.order ?? 0}</span>
                                </TableCell>
                                <TableCell>
                                    <Switch
                                        checked={p.isActive ?? true}
                                        onCheckedChange={() => handleToggle(p.id, p.isActive ?? true)}
                                        disabled={toggling === p.id}
                                    />
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Link href={`/dashboard/admin/tmc-programmes/${p.id}/edit`}>
                                            <Button variant="ghost" size="icon" title="Edit">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="ghost" size="icon"
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => handleDelete(p.id, p.title)}
                                            disabled={deleting === p.id}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-12">
                                    <BookOpen className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                                    <p className="text-muted-foreground">
                                        {search ? "No programmes match your search" : "No programmes yet"}
                                    </p>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
