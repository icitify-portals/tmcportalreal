import { db } from "@/lib/db"
import { specialProgrammes, specialProgrammeFiles } from "@/lib/db/schema"
import { eq, asc } from "drizzle-orm"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
    Download,
    Play,
    ArrowLeft,
    Music,
    Video as VideoIcon,
    FileText,
    Calendar,
    Share2,
    Info,
    ExternalLink
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export const dynamic = 'force-dynamic'

export default async function SpecialProgrammeDetailPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const programmeData = await db.query.specialProgrammes.findFirst({
        where: eq(specialProgrammes.id, id),
    })

    if (!programmeData) notFound()

    // Manually fetch files to avoid LATERAL JOIN in older MariaDB
    const files = await db.query.specialProgrammeFiles.findMany({
        where: eq(specialProgrammeFiles.programmeId, id),
        orderBy: (files, { asc }) => [asc(files.order)]
    })

    const programme = { ...programmeData, files };

    return (
        <DashboardLayout>
            <div className="container mx-auto py-12 px-4 space-y-8">
                <div className="flex items-center gap-2 mb-4">
                    <Button variant="ghost" asChild size="sm">
                        <Link href="/programmes/special">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Library
                        </Link>
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Info & Description */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-none px-3 py-1 text-sm font-semibold">
                                    {programme.category.replace(/_/g, ' ')}
                                </Badge>
                                <Badge variant="outline" className="border-slate-200 text-slate-500 font-medium">
                                    Edition {programme.year}
                                </Badge>
                            </div>
                            <h1 className="text-4xl font-bold tracking-tight text-slate-900 leading-tight">
                                {programme.title}
                            </h1>
                            <div className="flex flex-wrap items-center gap-6 text-slate-500 text-sm py-2">
                                {programme.date && (
                                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                                        <Calendar className="h-4 w-4 text-green-600" />
                                        <span>{format(new Date(programme.date), 'PPPP')}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                                    <span className="font-semibold text-slate-700">{programme.files.length}</span>
                                    <span>Media Resources</span>
                                </div>
                            </div>
                        </div>

                        <div className="prose prose-slate max-w-none prose-lg">
                            <h3 className="text-xl font-semibold mb-3 flex items-center gap-2 text-green-800">
                                <Info className="h-5 w-5" />
                                Overview
                            </h3>
                            <div className="text-slate-600 leading-relaxed whitespace-pre-wrap bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                                {programme.description || "No detailed description provided for this archive edition."}
                            </div>
                        </div>

                        {programme.summary && (
                            <div className="space-y-4">
                                <h3 className="text-xl font-semibold text-green-800">Session Summary</h3>
                                <div className="p-6 bg-white border border-green-100 rounded-2xl shadow-sm italic text-slate-700 leading-relaxed">
                                    {programme.summary}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Media Files & Actions */}
                    <div className="space-y-6">
                        <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white">
                            <CardHeader className="bg-slate-900 text-white pb-8">
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <Library className="h-5 w-5 text-green-400" />
                                    Access Media
                                </CardTitle>
                                <CardDescription className="text-slate-400">
                                    Listen, Watch or Download resources.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="-mt-4 p-6 space-y-4">
                                {programme.files.length === 0 ? (
                                    <div className="text-center py-8 text-slate-400 italic">
                                        No media files attached to this record.
                                    </div>
                                ) : (
                                    programme.files.map((file) => (
                                        <div key={file.id} className="p-4 rounded-xl border border-slate-100 bg-white hover:border-green-200 hover:bg-green-50/30 transition-all group">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2.5 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-green-100 group-hover:text-green-700 transition-colors">
                                                        {file.type === 'AUDIO' && <Music className="h-5 w-5" />}
                                                        {file.type === 'VIDEO' && <VideoIcon className="h-5 w-5" />}
                                                        {file.type === 'DOCUMENT' && <FileText className="h-5 w-5" />}
                                                        {file.type === 'OTHER' && <ExternalLink className="h-5 w-5" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-800 leading-tight mb-1">
                                                            {file.title}
                                                        </p>
                                                        <p className="text-[10px] uppercase font-bold text-slate-400">
                                                            {file.type} FORMAT
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 mt-4">
                                                {file.type === 'AUDIO' || file.type === 'VIDEO' ? (
                                                    <Button size="sm" className="bg-green-600 hover:bg-green-700 shadow-md" asChild>
                                                        <a href={file.url} target="_blank" rel="noopener noreferrer">
                                                            <Play className="mr-2 h-3.5 w-3.5 fill-current" />
                                                            Play
                                                        </a>
                                                    </Button>
                                                ) : (
                                                    <Button size="sm" variant="outline" className="border-green-200 text-green-700 hover:bg-green-50" asChild>
                                                        <a href={file.url} target="_blank" rel="noopener noreferrer">
                                                            <ExternalLink className="mr-2 h-3.5 w-3.5" />
                                                            View
                                                        </a>
                                                    </Button>
                                                )}
                                                <Button size="sm" variant="outline" className="text-slate-600" asChild>
                                                    <a href={file.url} download>
                                                        <Download className="mr-2 h-3.5 w-3.5" />
                                                        Download
                                                    </a>
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>

                        <div className="p-6 rounded-3xl bg-green-50 border border-green-100 text-green-800 space-y-3">
                            <h4 className="font-bold flex items-center gap-2">
                                <Share2 className="h-4 w-4" />
                                Spread the Knowledge
                            </h4>
                            <p className="text-sm text-green-700/80 leading-relaxed">
                                Share this resource with others who might benefit from this {programme.category.replace(/_/g, ' ').toLowerCase()}.
                            </p>
                            <Button className="w-full bg-white text-green-700 hover:bg-green-100 border-none shadow-sm">
                                Copy Share Link
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}

function Library({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="m16 6 4 14" />
            <path d="M12 6v14" />
            <path d="M8 8v12" />
            <path d="M4 4v16" />
        </svg>
    )
}
