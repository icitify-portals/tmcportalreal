"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Edit, Trash2, Search, ExternalLink, Building2 } from "lucide-react"
import Link from "next/link"
import { deleteOrgan, toggleOrganActive } from "@/lib/actions/organs"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export type OrganData = {
    id: string
    name: string
    description: string | null
    websiteUrl: string | null
    logoUrl: string | null
    category: string | null
    order: number | null
    isActive: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
}

interface OrgansListProps {
    initialOrgans: OrganData[]
}

export function OrgansList({ initialOrgans }: OrgansListProps) {
    const [organs, setOrgans] = useState(initialOrgans)
    const [search, setSearch] = useState("")
    const [deleting, setDeleting] = useState<string | null>(null)
    const [toggling, setToggling] = useState<string | null>(null)
    const router = useRouter()

    const filtered = organs.filter(o =>
        o.name.toLowerCase().includes(search.toLowerCase()) ||
        (o.category ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (o.description ?? "").toLowerCase().includes(search.toLowerCase())
    )

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) return
        setDeleting(id)
        const res = await deleteOrgan(id)
        if (res.success) {
            toast.success("Organ deleted")
            setOrgans(organs.filter(o => o.id !== id))
            router.refresh()
        } else {
            toast.error("Failed to delete organ")
        }
        setDeleting(null)
    }

    const handleToggle = async (id: string, current: boolean) => {
        setToggling(id)
        const res = await toggleOrganActive(id, !current)
        if (res.success) {
            toast.success(`Organ ${!current ? "activated" : "deactivated"}`)
            setOrgans(organs.map(o => o.id === id ? { ...o, isActive: !current } : o))
            router.refresh()
        } else {
            toast.error("Failed to update status")
        }
        setToggling(null)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search organs by name, category..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                />
            </div>

            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead>Organ</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Website</TableHead>
                            <TableHead>Order</TableHead>
                            <TableHead>Active</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length > 0 ? filtered.map((organ) => (
                            <TableRow key={organ.id} className="hover:bg-muted/30 transition-colors">
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        {organ.logoUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={organ.logoUrl} alt={organ.name} className="h-8 w-8 rounded object-contain border bg-white p-0.5" />
                                        ) : (
                                            <div className="h-8 w-8 rounded bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm shrink-0">
                                                {organ.name.charAt(0)}
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-medium">{organ.name}</p>
                                            {organ.description && (
                                                <p className="text-xs text-muted-foreground line-clamp-1 max-w-[220px]">{organ.description}</p>
                                            )}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {organ.category ? (
                                        <Badge variant="outline" className="capitalize">{organ.category}</Badge>
                                    ) : (
                                        <span className="text-muted-foreground text-xs">—</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {organ.websiteUrl ? (
                                        <a
                                            href={organ.websiteUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                        >
                                            <ExternalLink className="h-3 w-3" />
                                            Visit
                                        </a>
                                    ) : (
                                        <span className="text-muted-foreground text-xs">No URL</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <span className="text-sm text-muted-foreground">{organ.order ?? 0}</span>
                                </TableCell>
                                <TableCell>
                                    <Switch
                                        checked={organ.isActive ?? true}
                                        onCheckedChange={() => handleToggle(organ.id, organ.isActive ?? true)}
                                        disabled={toggling === organ.id}
                                        aria-label="Toggle active"
                                    />
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Link href={`/dashboard/admin/organs/${organ.id}/edit`}>
                                            <Button variant="ghost" size="icon" title="Edit">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => handleDelete(organ.id, organ.name)}
                                            disabled={deleting === organ.id}
                                            title="Delete"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-12">
                                    <Building2 className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                                    <p className="text-muted-foreground">
                                        {search ? "No organs match your search" : "No organs added yet"}
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
