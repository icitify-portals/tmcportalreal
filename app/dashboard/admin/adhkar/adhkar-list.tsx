"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Search } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { deleteAdhkarCentre, type AdhkarCentreData } from "@/lib/actions/adhkar"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface AdhkarCentreListProps {
    initialCentres: AdhkarCentreData[]
}

export function AdhkarCentreList({ initialCentres }: AdhkarCentreListProps) {
    const [centres, setCentres] = useState(initialCentres)
    const [search, setSearch] = useState("")
    const [deleting, setDeleting] = useState<string | null>(null)
    const router = useRouter()

    const filtered = centres.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.lga.toLowerCase().includes(search.toLowerCase()) ||
        c.state.toLowerCase().includes(search.toLowerCase())
    )

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this centre?")) return
        setDeleting(id)
        const res = await deleteAdhkarCentre(id)
        if (res.success) {
            toast.success("Centre deleted")
            setCentres(centres.filter(c => c.id !== id))
            router.refresh()
        } else {
            toast.error("Failed to delete")
        }
        setDeleting(null)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search centres..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                />
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length > 0 ? filtered.map((centre) => (
                            <TableRow key={centre.id}>
                                <TableCell className="font-medium">
                                    {centre.name}
                                    <div className="text-xs text-muted-foreground">{centre.venue}</div>
                                </TableCell>
                                <TableCell>
                                    {centre.lga}, {centre.state}
                                    <div className="text-xs text-muted-foreground trunc max-w-[200px] truncate">{centre.address}</div>
                                </TableCell>
                                <TableCell>{centre.time}</TableCell>
                                <TableCell>
                                    <Badge variant={centre.isActive ? "default" : "secondary"}>
                                        {centre.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Link href={`/dashboard/admin/adhkar/${centre.id}`}>
                                            <Button variant="ghost" size="icon">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => handleDelete(centre.id)}
                                            disabled={deleting === centre.id}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    No centres found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
