"use client"

import { useState, useEffect, Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, Loader2, Save, UserPlus, Search, Image as ImageIcon, Upload, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { RichTextEditor } from "@/components/admin/cms/rich-text-editor"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function OfficialAppointmentForm({ initialOrgId }: { initialOrgId?: string }) {
    const router = useRouter()

    const [loading, setLoading] = useState(false)
    const [searching, setSearching] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [users, setUsers] = useState<any[]>([])
    const [organizations, setOrganizations] = useState<any[]>([])
    const [searchQuery, setSearchQuery] = useState("")

    const [form, setForm] = useState({
        userId: "",
        organizationId: initialOrgId || "",
        position: "",
        positionLevel: "",
        termStart: undefined as Date | undefined,
        termEnd: undefined as Date | undefined,
        image: "",
        bio: "",
    })

    // Fetch authorized organizations for the current user
    useEffect(() => {
        setMounted(true)
        const fetchOrgs = async () => {
            try {
                const res = await fetch("/api/organizations/authorized")
                if (res.ok) {
                    const data = await res.json()
                    setOrganizations(data)
                }
            } catch (error) {
                console.error("Failed to fetch organizations:", error)
            }
        }
        fetchOrgs()
    }, [])

    const searchUsers = async () => {
        if (!searchQuery.trim()) return
        setSearching(true)
        try {
            const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`)
            if (res.ok) {
                const data = await res.json()
                setUsers(data)
            }
        } catch (error) {
            toast.error("Failed to search users")
        } finally {
            setSearching(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.userId || !form.organizationId || !form.position || !form.positionLevel) {
            toast.error("Please fill in all required fields")
            return
        }

        setLoading(true)
        try {
            const res = await fetch("/api/officials", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            })

            if (res.ok) {
                toast.success("Official added successfully")
                router.push("/dashboard/admin/officials")
                router.refresh()
            } else {
                const error = await res.json()
                toast.error(error.message || "Failed to add official")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Select Member</CardTitle>
                    <CardDescription>Search and select the user who will be appointed as an official</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or email..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchUsers())}
                            />
                        </div>
                        <Button type="button" variant="secondary" onClick={searchUsers} disabled={searching}>
                            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                        </Button>
                    </div>

                    {users.length > 0 && (
                        <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                            {users.map((user) => (
                                <div
                                    key={user.id}
                                    className={cn(
                                        "p-3 flex items-center justify-between cursor-pointer hover:bg-muted transition-colors",
                                        form.userId === user.id && "bg-primary/5 border-l-4 border-l-primary"
                                    )}
                                    onClick={() => setForm({ ...form, userId: user.id })}
                                >
                                    <div>
                                        <p className="text-sm font-medium">{user.name}</p>
                                        <p className="text-xs text-muted-foreground">{user.email}</p>
                                    </div>
                                    {form.userId === user.id && (
                                        <Badge variant="default">Selected</Badge>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Appointment Details</CardTitle>
                    <CardDescription>Specify the position, organization, and term for this official</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Organization / Jurisdiction</Label>
                        <Select value={form.organizationId} onValueChange={(v) => setForm({ ...form, organizationId: v })}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Organization" />
                            </SelectTrigger>
                            <SelectContent>
                                {organizations.map((org) => (
                                    <SelectItem key={org.id} value={org.id}>
                                        {org.name} ({org.level})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Position Title</Label>
                        <Input
                            placeholder="e.g. Amir, Secretary, ICT Officer"
                            value={form.position}
                            onChange={(e) => setForm({ ...form, position: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Official Level</Label>
                        <Select value={form.positionLevel} onValueChange={(v) => setForm({ ...form, positionLevel: v })}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Level" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="NATIONAL">National</SelectItem>
                                <SelectItem value="STATE">State</SelectItem>
                                <SelectItem value="LOCAL_GOVERNMENT">Local Government</SelectItem>
                                <SelectItem value="BRANCH">Branch</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Term Start Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !form.termStart && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    <span suppressHydrationWarning>
                                        {form.termStart && mounted ? format(form.termStart, "PPP") : <span>Pick a date</span>}
                                    </span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={form.termStart}
                                    onSelect={(date) => setForm({ ...form, termStart: date || new Date() })}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Profile & Bio</CardTitle>
                    <CardDescription>Additional information about the official that will be displayed on their public profile</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <Label>Official Portrait (Optional)</Label>
                        <div className="flex items-center gap-6">
                            <Avatar className="h-24 w-24 border">
                                <AvatarImage src={form.image} />
                                <AvatarFallback className="bg-muted text-muted-foreground">
                                    <ImageIcon className="h-10 w-10" />
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col gap-2">
                                <div className="flex gap-2">
                                    <label className="cursor-pointer">
                                        <div className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3">
                                            <Upload className="mr-2 h-4 w-4" />
                                            Upload Portrait
                                        </div>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0]
                                                if (!file) return
                                                const formData = new FormData()
                                                formData.append("file", file)
                                                formData.append("category", "officials")
                                                try {
                                                    const res = await fetch("/api/upload", { method: "POST", body: formData })
                                                    const data = await res.json()
                                                    if (data.success) {
                                                        setForm({ ...form, image: data.url })
                                                        toast.success("Portrait uploaded")
                                                    }
                                                } catch (err) {
                                                    toast.error("Upload failed")
                                                }
                                            }}
                                        />
                                    </label>
                                    {form.image && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setForm({ ...form, image: "" })}
                                        >
                                            <X className="mr-2 h-4 w-4" /> Remove
                                        </Button>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">Recommended: Square image (1:1), Max 2MB.</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                        <Label>Biography / Personal Profile</Label>
                        <RichTextEditor
                            content={form.bio}
                            onChange={(content) => setForm({ ...form, bio: content })}
                        />
                        <p className="text-xs text-muted-foreground">This content will be shown on the public executive profile page.</p>
                    </div>

                    <div className="flex justify-end gap-4">
                        <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Official
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    )
}
