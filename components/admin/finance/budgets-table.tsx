"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import * as XLSX from "xlsx"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function BudgetsTable({ budgets, approveAction }: { budgets: any[], approveAction: (id: string) => Promise<any> }) {
    const handleExport = () => {
        // Flatten data for export
        const exportData = budgets.map(b => ({
            "Budget Title": b.title,
            "Year": b.year,
            "Total Amount": parseFloat(b.totalAmount),
            "Status": b.status,
            "Created By": b.creator?.name || 'Unknown',
            "Approved By": b.approver?.name || 'Pending',
            "Date Created": new Date(b.createdAt).toLocaleDateString(),
            "Line Items Count": b.items?.length || 0
        }))

        const worksheet = XLSX.utils.json_to_sheet(exportData)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, "Budgets")
        XLSX.writeFile(workbook, `budgets_${new Date().toISOString().split('T')[0]}.xlsx`)
    }

    if (!budgets || budgets.length === 0) {
        return (
            <div className="p-8 text-center text-muted-foreground border rounded-md bg-card">
                No budgets found for this organization. Create one to get started.
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button onClick={handleExport} variant="outline" size="sm">
                    Export to Excel
                </Button>
            </div>
            
            <div className="border rounded-md bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Year</TableHead>
                            <TableHead>Total Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created By</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {budgets.map(budget => (
                            <TableRow key={budget.id}>
                                <TableCell className="font-medium max-w-[200px] truncate" title={budget.title}>
                                    {budget.title}
                                </TableCell>
                                <TableCell>{budget.year}</TableCell>
                                <TableCell>{formatCurrency(parseFloat(budget.totalAmount))}</TableCell>
                                <TableCell>
                                    <Badge variant={budget.status === 'APPROVED' ? 'default' : 'secondary'}>
                                        {budget.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>{budget.creator?.name || 'Unknown'}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="sm">View Items</Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                            <DialogHeader>
                                                <DialogTitle>{budget.title} - Line Items</DialogTitle>
                                                <DialogDescription>Total: {formatCurrency(parseFloat(budget.totalAmount))}</DialogDescription>
                                            </DialogHeader>
                                            <div className="border rounded-md p-4 mt-4">
                                                <ul className="space-y-2">
                                                    {budget.items?.map((item: any) => (
                                                        <li key={item.id} className="flex justify-between text-sm border-b pb-2 last:border-0 last:pb-0">
                                                            <div>
                                                                <span className="font-semibold">{item.category}:</span> {item.description}
                                                            </div>
                                                            <span className="font-medium">{formatCurrency(parseFloat(item.amount))}</span>
                                                        </li>
                                                    ))}
                                                    {(!budget.items || budget.items.length === 0) && (
                                                        <li className="text-muted-foreground text-center">No line items found.</li>
                                                    )}
                                                </ul>
                                            </div>
                                        </DialogContent>
                                    </Dialog>

                                    {budget.status !== 'APPROVED' && (
                                        <Button size="sm" onClick={async () => {
                                            await approveAction(budget.id)
                                        }}>
                                            Approve
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
