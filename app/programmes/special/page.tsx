import { db } from "@/lib/db"
import { specialProgrammes } from "@/lib/db/schema"
import { eq, desc, and } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Play, Download, Calendar, Music, Video, FileText, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export const dynamic = 'force-dynamic'

const CATEGORIES = [
    { id: 'TESKIYAH_WORKSHOP', label: 'Teskiyah Workshops', color: 'bg-indigo-500' },
    { id: 'FRIDAY_KHUTHBAH', label: 'Friday Khuthbahs', color: 'bg-emerald-500' },
    { id: 'PRESS_RELEASE', label: 'Press Releases', color: 'bg-blue-500' },
    { id: 'STATE_OF_THE_NATION', label: 'State of the Nation', color: 'bg-amber-500' },
]

export default async function SpecialProgrammesGalleryPage({
    searchParams
}: {
    searchParams: Promise<{ category?: string, year?: string }>
}) {
    const { category: selectedCategory, year: selectedYear } = await searchParams

    const conditions = [eq(specialProgrammes.isPublished, true)]
    if (selectedCategory) conditions.push(eq(specialProgrammes.category, selectedCategory as any))
    if (selectedYear) conditions.push(eq(specialProgrammes.year, parseInt(selectedYear)))

    const items = await db.select().from(specialProgrammes)
        .where(and(...conditions))
        .orderBy(desc(specialProgrammes.year), desc(specialProgrammes.createdAt))

    return (
        <DashboardLayout>
            <div className="container mx-auto py-12 px-4 space-y-8">
                <div className="text-center space-y-4 max-w-3xl mx-auto">
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-green-800">
                        Resource Library & Archives
                    </h1>
                    <p className="text-xl text-muted-foreground">
                        Access our collection of Teskiyah workshops, Friday sermons, press releases, and national addresses.
                    </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-4 py-4">
                    <Button variant={!selectedCategory ? "default" : "outline"} asChild className={!selectedCategory ? "bg-green-700 hover:bg-green-800" : ""}>
                        <Link href="/programmes/special">All Series</Link>
                    </Button>
                    {CATEGORIES.map((cat) => (
                        <Button
                            key={cat.id}
                            variant={selectedCategory === cat.id ? "default" : "outline"}
                            asChild
                            className={selectedCategory === cat.id ? "bg-green-700 hover:bg-green-800" : ""}
                        >
                            <Link href={`/programmes/special?category=${cat.id}`}>
                                {cat.label}
                            </Link>
                        </Button>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.length === 0 ? (
                        <div className="col-span-full text-center py-20 border-2 border-dashed rounded-3xl bg-muted/30">
                            <Library className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-20" />
                            <h3 className="text-2xl font-bold text-muted-foreground">No records found</h3>
                            <p className="text-muted-foreground">Try adjusting your filters or check back later.</p>
                        </div>
                    ) : (
                        items.map((item) => (
                            <Card key={item.id} className="group overflow-hidden flex flex-col h-full border-green-50 shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl">
                                <div className="relative aspect-video overflow-hidden bg-green-900/10">
                                    {item.imageUrl ? (
                                        <img
                                            src={item.imageUrl}
                                            alt={item.title}
                                            className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-green-700/20">
                                            <Library className="h-20 w-20" />
                                        </div>
                                    )}
                                    <div className="absolute top-4 left-4">
                                        <Badge className="bg-white/90 text-green-800 hover:bg-white border-none shadow-sm backdrop-blur-sm">
                                            {item.year} Edition
                                        </Badge>
                                    </div>
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Button variant="outline" className="text-white border-white hover:bg-white/20" asChild>
                                            <Link href={`/programmes/special/${item.id}`}>
                                                Explore Content
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                                <CardHeader>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge className={`${CATEGORIES.find(c => c.id === item.category)?.color || 'bg-slate-500'} text-xs uppercase tracking-wider`}>
                                            {item.category.replace(/_/g, ' ')}
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-xl line-clamp-2 leading-tight group-hover:text-green-700 transition-colors">
                                        {item.title}
                                    </CardTitle>
                                    <CardDescription className="line-clamp-3">
                                        {item.description}
                                    </CardDescription>
                                </CardHeader>
                                <CardFooter className="mt-auto pt-4 border-t border-slate-50">
                                    <Button className="w-full bg-green-600 hover:bg-green-700 group/btn" asChild>
                                        <Link href={`/programmes/special/${item.id}`}>
                                            Play & Download
                                            <Play className="ml-2 h-4 w-4 fill-current group-hover/btn:scale-125 transition-transform" />
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))
                    )}
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
