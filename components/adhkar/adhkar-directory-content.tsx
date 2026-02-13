"use client"

import { useState, useMemo, useEffect } from "react"
import { PageHeader } from "@/components/PageHeader"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { locationData } from "@/lib/location-data"
import { Clock, MapPin, Phone, Download, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getAdhkarCentres, type AdhkarCentreData } from "@/lib/actions/adhkar"
import { toast } from "sonner"

const allStates = Object.keys(locationData)

export default function AdhkarDirectoryContent() {
    const [searchTerm, setSearchTerm] = useState("")
    const [stateFilter, setStateFilter] = useState("all")
    const [lgaFilter, setLgaFilter] = useState("all")
    const [centres, setCentres] = useState<AdhkarCentreData[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchCentres = async () => {
            setLoading(true)
            const res = await getAdhkarCentres()
            if (res.success && res.data) {
                setCentres(res.data)
            } else {
                toast.error("Failed to load directory")
            }
            setLoading(false)
        }
        fetchCentres()
    }, [])

    const lgasForState = useMemo(() => {
        if (stateFilter === "all") return []
        return locationData[stateFilter as keyof typeof locationData]?.lgas.map((l: any) => l.name) || []
    }, [stateFilter])

    const filteredCentres = useMemo(() => {
        return centres.filter(centre => {
            const matchesSearch = searchTerm === "" ||
                centre.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                centre.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
                centre.address.toLowerCase().includes(searchTerm.toLowerCase())

            const matchesState = stateFilter === "all" || centre.state === stateFilter
            const matchesLga = lgaFilter === "all" || centre.lga === lgaFilter

            return matchesSearch && matchesState && matchesLga
        })
    }, [centres, searchTerm, stateFilter, lgaFilter])

    const handleDownloadPdf = async () => {
        const jsPDF = (await import("jspdf")).default
        await import("jspdf-autotable")
        const doc = new jsPDF()

        doc.setFontSize(18)
        doc.text(`Adhkar Centre Directory`, 14, 22)

        const tableColumn = ["Name", "Venue", "Address", "Schedule", "Contact", "Location"]
        const tableRows: string[][] = []

        filteredCentres.forEach(centre => {
            const location = [centre.state, centre.lga].filter(Boolean).join(" > ")
            const centreData = [
                centre.name,
                centre.venue,
                centre.address,
                centre.time,
                centre.contactNumber || "N/A",
                location
            ]
            tableRows.push(centreData)
        })

            ; (doc as any).autoTable({
                head: [tableColumn],
                body: tableRows,
                startY: 35,
            })

        doc.save(`adhkar-centre-directory.pdf`)
    }

    return (
        <div className="flex flex-col min-h-screen">
            <PageHeader />
            <main className="flex-1 bg-muted/20">
                <section className="py-12 md:py-16 text-center bg-background border-b">
                    <div className="container">
                        <h1 className="text-4xl font-bold tracking-tight text-green-800 dark:text-green-500">Adhkar Centre Directory</h1>
                        <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
                            Find a spiritual gathering near you. Join us for remembrance of Allah.
                        </p>
                    </div>
                </section>
                <section className="py-8">
                    <div className="container space-y-6">
                        <Card className="border-none shadow-md">
                            <CardContent className="p-6 flex flex-col md:flex-row gap-4 items-end md:items-center">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search by name, venue..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-9"
                                        />
                                    </div>
                                    <Select value={stateFilter} onValueChange={v => { setStateFilter(v); setLgaFilter("all") }}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="All States" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All States</SelectItem>
                                            {allStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <Select value={lgaFilter} onValueChange={setLgaFilter} disabled={stateFilter === "all"}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="All LGAs" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All LGAs</SelectItem>
                                            {lgasForState.map((lga: string) => <SelectItem key={lga} value={lga}>{lga}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button
                                    onClick={handleDownloadPdf}
                                    disabled={loading || filteredCentres.length === 0}
                                    className="w-full md:w-auto bg-green-700 hover:bg-green-800"
                                >
                                    <Download className="mr-2 h-4 w-4" /> Download PDF
                                </Button>
                            </CardContent>
                        </Card>

                        {loading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700 mx-auto"></div>
                                <p className="mt-4 text-muted-foreground">Loading directory...</p>
                            </div>
                        ) : filteredCentres.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredCentres.map(centre => (
                                    <Card key={centre.id} className="hover:shadow-lg transition-shadow duration-300">
                                        <CardHeader>
                                            <CardTitle className="text-lg font-bold text-green-800 dark:text-green-400">{centre.name}</CardTitle>
                                            <CardDescription className="font-medium text-foreground">{centre.venue}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-3 text-sm text-muted-foreground">
                                            <div className="flex items-start gap-2">
                                                <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-green-600" />
                                                <span>{centre.address}, {centre.lga}, {centre.state}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 shrink-0 text-green-600" />
                                                <span>{centre.time}</span>
                                            </div>
                                            {centre.contactNumber && (
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-4 w-4 shrink-0 text-green-600" />
                                                    <span>{centre.contactNumber}</span>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 bg-muted/50 rounded-xl border-dashed border-2">
                                <p className="text-lg font-medium text-muted-foreground">No centres found matching your criteria.</p>
                                <Button variant="link" onClick={() => { setSearchTerm(""); setStateFilter("all"); setLgaFilter("all") }}>
                                    Clear Filters
                                </Button>
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    )
}
