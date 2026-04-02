"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Loader2, Download, Trash2, Database, ShieldAlert, History, UploadCloud, RefreshCw } from "lucide-react"
import { getBackups, createBackup, deleteBackup } from "@/lib/actions/backup"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ClientDate } from "@/components/ui/client-date"

export default function BackupsPage() {
    const [backups, setBackups] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [creating, setCreating] = useState(false)

    const fetchBackups = async () => {
        setLoading(true)
        try {
            const data = await getBackups()
            setBackups(data)
        } catch (error) {
            toast.error("Failed to fetch backups")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchBackups()
    }, [])

    const handleCreateBackup = async () => {
        setCreating(true)
        toast.info("Generating backup... this may take a few minutes for large files.")
        try {
            const res = await createBackup()
            if (res.success) {
                toast.success("Backup created successfully")
                fetchBackups()
            } else {
                toast.error(res.error || "Backup failed")
            }
        } catch (error) {
            toast.error("An unexpected error occurred")
        } finally {
            setCreating(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this backup record?")) return
        try {
            const res = await deleteBackup(id)
            if (res.success) {
                toast.success("Record deleted")
                fetchBackups()
            } else {
                toast.error(res.error)
            }
        } catch (error) {
            toast.error("Failed to delete")
        }
    }

    const formatSize = (bytes: number) => {
        if (!bytes) return "0 B"
        const k = 1024
        const sizes = ["B", "KB", "MB", "GB"]
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    }

    return (
        <DashboardLayout>
            <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Backup & Disaster Recovery</h1>
                    <p className="text-muted-foreground">Manage your database and file backups safely.</p>
                </div>
                <Button 
                    onClick={handleCreateBackup} 
                    disabled={creating}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                    {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
                    Generate Manual Backup
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-800 dark:text-blue-300">
                            <ShieldAlert className="h-4 w-4" />
                            Data Safety
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-blue-700 dark:text-blue-400">Regular backups ensure your organization's data can be recovered in case of accidental loss or system failure.</p>
                    </CardContent>
                </Card>
                <Card className="bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-green-800 dark:text-green-300">
                            <UploadCloud className="h-4 w-4" />
                            Cloud Storage
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-green-700 dark:text-green-400">Backups are automatically pushed to Wasabi/S3 if configured in your environment variables.</p>
                    </CardContent>
                </Card>
                <Card className="bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-amber-800 dark:text-amber-300">
                            <History className="h-4 w-4" />
                            Retention
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-amber-700 dark:text-amber-400">Manual backups are kept indefinitely until deleted. Automated backups follow your retention policy.</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Backup History</CardTitle>
                            <CardDescription>A list of recently generated backups.</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" onClick={fetchBackups} disabled={loading}>
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading && backups.length === 0 ? (
                        <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                    ) : backups.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">No backups found. Create one to get started.</div>
                    ) : (
                        <div className="relative overflow-x-auto border rounded-md">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">Name</th>
                                        <th className="px-6 py-3 font-medium">Type</th>
                                        <th className="px-6 py-3 font-medium">Size</th>
                                        <th className="px-6 py-3 font-medium">Status</th>
                                        <th className="px-6 py-3 font-medium">Created</th>
                                        <th className="px-6 py-3 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {backups.map((b) => (
                                        <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-6 py-4 font-medium">{b.name}</td>
                                            <td className="px-6 py-4">
                                                <Badge variant="outline" className="text-[10px]">{b.type}</Badge>
                                            </td>
                                            <td className="px-6 py-4 text-muted-foreground">{formatSize(b.size)}</td>
                                            <td className="px-6 py-4 text-[10px]">
                                                {b.status === 'COMPLETED' ? (
                                                    <span className="inline-flex items-center rounded-full border px-2 py-0.5 font-medium bg-green-100 text-green-800 border-transparent dark:bg-green-900/30 dark:text-green-400">
                                                        COMPLETED
                                                    </span>
                                                ) : b.status === 'FAILED' ? (
                                                    <Badge variant="destructive">FAILED</Badge>
                                                ) : (
                                                    <Badge variant="secondary">{b.status}</Badge>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-xs text-muted-foreground">
                                                <ClientDate date={b.createdAt} />
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                {(b.databaseUrl || b.filesUrl) ? (
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Download">
                                                        <a href={b.databaseUrl} target="_blank" rel="noopener noreferrer"><Download className="h-4 w-4" /></a>
                                                    </Button>
                                                ) : null}
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => handleDelete(b.id)} title="Delete">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
            </div>
        </DashboardLayout>
    )
}
