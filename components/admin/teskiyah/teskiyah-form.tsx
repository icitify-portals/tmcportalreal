"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { locationData } from "@/lib/location-data"
import { saveTeskiyahCentre, getTeskiyahCentres } from "@/lib/actions/teskiyah"
import { toast } from "sonner"
import { Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"

const allStates = Object.keys(locationData)

export function TeskiyahForm({ editId }: { editId?: string }) {
    const router = useRouter()

    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(false)

    // Form State
    const [name, setName] = useState("")
    const [venue, setVenue] = useState("")
    const [address, setAddress] = useState("")
    const [time, setTime] = useState("")
    const [contactNumber, setContactNumber] = useState("")

    // Location State
    const [state, setState] = useState("")
    const [lga, setLga] = useState("")
    const [branch, setBranch] = useState("")

    // Derived Data
    const lgas = useMemo(() => {
        if (!state) return []
        return locationData[state as keyof typeof locationData]?.lgas || []
    }, [state])

    const branches = useMemo(() => {
        if (!lga) return []
        return lgas.find((l: any) => l.name === lga)?.branches || []
    }, [lga, lgas])

    // Load existing data if editing
    useEffect(() => {
        if (editId) {
            const loadData = async () => {
                setFetching(true)
                const res = await getTeskiyahCentres({ limit: 500 }) // In real app, fetch single by ID
                if (res.success && res.data) {
                    const item = res.data.find(c => c.id === editId)
                    if (item) {
                        setName(item.name)
                        setVenue(item.venue)
                        setAddress(item.address)
                        setTime(item.time)
                        setContactNumber(item.contactNumber || "")
                        setState(item.state)
                        setLga(item.lga)
                        setBranch(item.branch || "")
                    }
                }
                setFetching(false)
            }
            loadData()
        }
    }, [editId])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!state || !lga) {
            toast.error("State and LGA are required")
            return
        }

        setLoading(true)
        const res = await saveTeskiyahCentre({
            id: editId || undefined,
            name,
            venue,
            address,
            time,
            contactNumber,
            state,
            lga,
            branch: branch || undefined,
            isActive: true
        })

        if (res.success) {
            toast.success(editId ? "Centre updated" : "Centre created")
            router.push("/dashboard/admin/teskiyah")
        } else {
            toast.error(res.error || "Something went wrong")
        }
        setLoading(false)
    }

    if (fetching) {
        return <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Centre Details</CardTitle>
                <CardDescription>Enter the details for the Teskiyah gathering location.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label>Centre Name</Label>
                        <Input placeholder="e.g. TMC Alausa Centre" value={name} onChange={e => setName(e.target.value)} required />
                    </div>

                    <div className="space-y-2">
                        <Label>Venue Name</Label>
                        <Input placeholder="e.g. Alausa Secretariat Mosque" value={venue} onChange={e => setVenue(e.target.value)} required />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>State</Label>
                            <Select value={state} onValueChange={v => { setState(v); setLga(""); setBranch("") }}>
                                <SelectTrigger><SelectValue placeholder="Select State" /></SelectTrigger>
                                <SelectContent>
                                    {allStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>LGA</Label>
                            <Select value={lga} onValueChange={v => { setLga(v); setBranch("") }} disabled={!state}>
                                <SelectTrigger><SelectValue placeholder="Select LGA" /></SelectTrigger>
                                <SelectContent>
                                    {lgas.map((l: any) => <SelectItem key={l.name} value={l.name}>{l.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Branch (Optional)</Label>
                        <Select value={branch} onValueChange={setBranch} disabled={!lga}>
                            <SelectTrigger><SelectValue placeholder="Select Branch (if applicable)" /></SelectTrigger>
                            <SelectContent>
                                {branches.map((b: string) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Full Address</Label>
                        <Textarea placeholder="Street address, landmarks..." value={address} onChange={e => setAddress(e.target.value)} required />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Schedule (Time)</Label>
                            <Input placeholder="e.g. Sundays 4:00 PM" value={time} onChange={e => setTime(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Contact Number (Optional)</Label>
                            <Input placeholder="080..." value={contactNumber} onChange={e => setContactNumber(e.target.value)} />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-4">
                        <Link href="/dashboard/admin/teskiyah">
                            <Button variant="outline" type="button">Cancel</Button>
                        </Link>
                        <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Centre"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
