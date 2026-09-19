"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { format } from "date-fns"

interface ViewAssetDialogProps {
    asset: any
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ViewAssetDialog({ asset, open, onOpenChange }: ViewAssetDialogProps) {
    if (!asset) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">{asset.name}</DialogTitle>
                    <DialogDescription>
                        Detailed profile and maintenance history.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-6 py-4">
                    <div className="space-y-4">
                        <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Category</h4>
                            <Badge variant="outline" className="mt-1">{asset.category}</Badge>
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Condition</h4>
                            <Badge variant={
                                asset.condition === 'GOOD' || asset.condition === 'NEW' ? 'default' :
                                asset.condition === 'FAIR' ? 'secondary' : 'destructive'
                            } className="mt-1">
                                {asset.condition}
                            </Badge>
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                            <p className="mt-1 font-medium">{asset.status}</p>
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Location</h4>
                            <p className="mt-1">{asset.location || 'N/A'}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Custodian</h4>
                            <p className="mt-1">{asset.custodian?.name || 'Unassigned'}</p>
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Serial Number</h4>
                            <p className="mt-1">{asset.serialNumber || 'N/A'}</p>
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Purchase Price</h4>
                            <p className="mt-1">{formatCurrency(parseFloat(asset.purchasePrice || "0"))}</p>
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Current Value</h4>
                            <p className="mt-1 font-bold">{formatCurrency(parseFloat(asset.currentValue || "0"))}</p>
                        </div>
                    </div>
                </div>

                {asset.description && (
                    <div className="mt-2 mb-6">
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
                        <div className="bg-muted/50 p-4 rounded-md text-sm whitespace-pre-wrap">
                            {asset.description}
                        </div>
                    </div>
                )}

                <div className="mt-6 border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">Maintenance History</h3>
                    
                    {!asset.maintenanceLogs || asset.maintenanceLogs.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No maintenance records found.</p>
                    ) : (
                        <div className="space-y-4">
                            {asset.maintenanceLogs.map((log: any) => (
                                <div key={log.id} className="bg-card border rounded-lg p-4 shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline">{log.type}</Badge>
                                            <span className="text-sm font-medium">{format(new Date(log.date), 'PPP')}</span>
                                        </div>
                                        <span className="font-bold text-sm">
                                            {formatCurrency(parseFloat(log.cost || "0"))}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-2">{log.description}</p>
                                    
                                    <div className="mt-3 text-xs flex justify-between text-muted-foreground">
                                        <span>Performed by: {log.performedBy || 'Unknown'}</span>
                                        {log.nextServiceDate && (
                                            <span>Next service: {format(new Date(log.nextServiceDate), 'PPP')}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
