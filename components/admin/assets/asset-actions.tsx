"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Eye, Edit, Wrench, Trash2 } from "lucide-react"
import { ViewAssetDialog } from "./view-asset-dialog"
import { EditAssetDialog } from "./edit-asset-dialog"
import { RecordMaintenanceDialog } from "./record-maintenance-dialog"
import { getAssetById, deleteAsset } from "@/lib/actions/assets"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface AssetActionsProps {
    asset: any
    organizationId: string
}

export function AssetActions({ asset, organizationId }: AssetActionsProps) {
    const [viewOpen, setViewOpen] = useState(false)
    const [editOpen, setEditOpen] = useState(false)
    const [maintenanceOpen, setMaintenanceOpen] = useState(false)
    const [fullAssetData, setFullAssetData] = useState<any>(null)
    const router = useRouter()

    const loadFullAsset = async () => {
        if (!fullAssetData) {
            const data = await getAssetById(asset.id)
            setFullAssetData(data)
            return data
        }
        return fullAssetData
    }

    const handleView = async () => {
        await loadFullAsset()
        setViewOpen(true)
    }

    const handleEdit = async () => {
        await loadFullAsset()
        setEditOpen(true)
    }

    const handleMaintenance = async () => {
        await loadFullAsset()
        setMaintenanceOpen(true)
    }

    const handleDelete = async () => {
        if (window.confirm("Are you sure you want to delete this asset? This action cannot be undone.")) {
            const result = await deleteAsset(asset.id)
            if (result.success) {
                toast.success("Asset deleted")
                router.refresh()
            } else {
                toast.error(result.error || "Failed to delete asset")
            }
        }
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={handleView}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleEdit}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Asset
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleMaintenance}>
                        <Wrench className="mr-2 h-4 w-4" />
                        Record Maintenance
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Asset
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {fullAssetData && (
                <>
                    <ViewAssetDialog 
                        asset={fullAssetData} 
                        open={viewOpen} 
                        onOpenChange={setViewOpen} 
                    />
                    <EditAssetDialog 
                        asset={fullAssetData} 
                        organizationId={organizationId} 
                        open={editOpen} 
                        onOpenChange={setEditOpen} 
                    />
                    <RecordMaintenanceDialog 
                        asset={fullAssetData} 
                        open={maintenanceOpen} 
                        onOpenChange={setMaintenanceOpen} 
                    />
                </>
            )}
        </>
    )
}
