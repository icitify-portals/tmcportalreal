"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AssetActions } from "./asset-actions"

interface AssetsTableProps {
    assets: any[]
    organizationId: string
}

export function AssetsTable({ assets, organizationId }: AssetsTableProps) {
    const [search, setSearch] = useState("")
    const [categoryFilter, setCategoryFilter] = useState("ALL")
    const [statusFilter, setStatusFilter] = useState("ALL")

    const filteredAssets = assets.filter((asset) => {
        const matchesSearch = asset.name?.toLowerCase().includes(search.toLowerCase()) || 
                              asset.serialNumber?.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = categoryFilter === "ALL" || asset.category === categoryFilter;
        const matchesStatus = statusFilter === "ALL" || asset.status === statusFilter;

        return matchesSearch && matchesCategory && matchesStatus;
    });

    if (assets.length === 0) {
        return (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">No assets found for this jurisdiction.</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex gap-4 flex-col sm:flex-row">
                <Input 
                    placeholder="Search by name or serial..." 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                />
                
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Categories</SelectItem>
                        <SelectItem value="FURNITURE">Furniture</SelectItem>
                        <SelectItem value="ELECTRONICS">Electronics</SelectItem>
                        <SelectItem value="VEHICLE">Vehicle</SelectItem>
                        <SelectItem value="PROPERTY">Property</SelectItem>
                        <SelectItem value="EQUIPMENT">Equipment</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Statuses</SelectItem>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="IN_MAINTENANCE">In Maintenance</SelectItem>
                        <SelectItem value="DISPOSED">Disposed</SelectItem>
                        <SelectItem value="STOLEN">Stolen</SelectItem>
                        <SelectItem value="ARCHIVED">Archived</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Asset Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Condition / Status</TableHead>
                            <TableHead>Jurisdiction</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead className="text-right">Current Value</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredAssets.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                                    No assets match your filters.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredAssets.map((asset) => (
                                <TableRow key={asset.id}>
                                    <TableCell className="font-medium">
                                        <span className="block">{asset.name}</span>
                                        <span className="text-xs text-muted-foreground">{asset.serialNumber}</span>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{asset.category}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1 items-start">
                                            <Badge variant={
                                                asset.condition === 'GOOD' || asset.condition === 'NEW' ? 'default' :
                                                    asset.condition === 'FAIR' ? 'secondary' : 'destructive'
                                            }>
                                                {asset.condition}
                                            </Badge>
                                            <span className="text-[10px] text-muted-foreground uppercase">{asset.status}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm">{asset.organizationName}</span>
                                        <span className="ml-2 text-xs text-muted-foreground block">{asset.organizationLevel}</span>
                                    </TableCell>
                                    <TableCell>{asset.location || 'N/A'}</TableCell>
                                    <TableCell className="text-right" suppressHydrationWarning>
                                        {formatCurrency(parseFloat(asset.currentValue || "0"))}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <AssetActions asset={asset} organizationId={organizationId} />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
