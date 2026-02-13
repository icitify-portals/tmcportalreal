export const dynamic = 'force-dynamic'

import { getServerSession } from "@/lib/session"
import { db } from "@/lib/db"
import { documents, users, organizations } from "@/lib/db/schema"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, File, Image, FileArchive, Download, Eye, Plus, Search } from "lucide-react"
import { desc, eq, inArray } from "drizzle-orm"
import Link from "next/link"
import { format } from "date-fns"


export default async function DocumentsPage() {
    const session = await getServerSession()

    const rawDocs = await db.query.documents.findMany({
        orderBy: [desc(documents.createdAt)],
        limit: 100,
    })

    const userIds = [...new Set(rawDocs.map(d => d.userId).filter(Boolean))] as string[]
    const orgIds = [...new Set(rawDocs.map(d => d.organizationId).filter(Boolean))] as string[]

    const usersData = userIds.length > 0 ? await db.query.users.findMany({
        where: (u, { inArray }) => inArray(u.id, userIds),
        columns: { id: true, name: true }
    }) : []

    const orgsData = orgIds.length > 0 ? await db.query.organizations.findMany({
        where: (o, { inArray }) => inArray(o.id, orgIds),
        columns: { id: true, name: true }
    }) : []

    const docsList = rawDocs.map(doc => ({
        ...doc,
        owner: usersData.find(u => u.id === doc.userId)?.name ||
            orgsData.find(o => o.id === doc.organizationId)?.name ||
            "System"
    }))

    const getFileIcon = (type: string) => {
        if (type.includes('image')) return <Image className="h-4 w-4" />
        if (type.includes('pdf')) return <FileText className="h-4 w-4" />
        if (type.includes('zip') || type.includes('rar')) return <FileArchive className="h-4 w-4" />
        return <File className="h-4 w-4" />
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <FileText className="h-8 w-8 text-primary" />
                            Documents
                        </h1>
                        <p className="text-muted-foreground">Manage certificates, IDs, and shared organization files</p>
                    </div>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Upload Document
                    </Button>
                </div>

                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            className="w-full pl-10 pr-4 py-2 border rounded-md bg-background text-sm"
                            placeholder="Search documents by name or owner..."
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {docsList.map((doc) => (
                        <Card key={doc.id} className="group overflow-hidden">
                            <CardHeader className="p-4 bg-muted/20 border-b relative">
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="secondary" size="icon" className="h-7 w-7"><Eye className="h-3.5 w-3.5" /></Button>
                                    <Button variant="secondary" size="icon" className="h-7 w-7"><Download className="h-3.5 w-3.5" /></Button>
                                </div>
                                <div className="bg-background w-10 h-10 rounded-md flex items-center justify-center border shadow-sm mb-2">
                                    {getFileIcon(doc.fileType)}
                                </div>
                                <CardTitle className="text-sm truncate" title={doc.fileName}>
                                    {doc.fileName}
                                </CardTitle>
                                <CardDescription className="text-[10px] uppercase font-bold text-primary/70">
                                    {doc.documentType}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 text-xs space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Owner:</span>
                                    <span className="font-medium truncate ml-2">{doc.owner}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Size:</span>
                                    <span>{(doc.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t mt-2">
                                    <span className="text-muted-foreground italic">
                                        {format(new Date(doc.createdAt!), 'PP')}
                                    </span>
                                    {doc.isPublic ? (
                                        <Badge variant="outline" className="text-[9px] h-4">Public</Badge>
                                    ) : (
                                        <Badge variant="secondary" className="text-[9px] h-4">Private</Badge>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {docsList.length === 0 && (
                        <div className="col-span-full py-24 text-center border-2 border-dashed rounded-lg opacity-40">
                            <FileText className="h-12 w-12 mx-auto mb-2" />
                            <p>No documents uploaded yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    )
}
