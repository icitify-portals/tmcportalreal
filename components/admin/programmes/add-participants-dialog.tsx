"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Search, X, UserPlus, Users, Mail, Phone, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { searchUsers } from "@/lib/actions/users"
import { bulkAdminEnrollAction } from "@/lib/actions/programmes"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface AddParticipantsDialogProps {
    programmeId: string
    programmeTitle: string
}

interface Participant {
    id?: string // For existing users
    name: string
    email: string
    phone?: string
    gender?: string
    isMember: boolean
}

export function AddParticipantsDialog({ programmeId, programmeTitle }: AddParticipantsDialogProps) {
    const [open, setOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [selectedParticipants, setSelectedParticipants] = useState<Participant[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Guest form state
    const [guestName, setGuestName] = useState("")
    const [guestEmail, setGuestEmail] = useState("")
    const [guestPhone, setGuestPhone] = useState("")
    const [guestGender, setGuestGender] = useState("MALE")

    const handleSearch = async () => {
        if (searchQuery.length < 2) return
        setIsSearching(true)
        try {
            const results = await searchUsers(searchQuery)
            setSearchResults(results)
        } catch (error) {
            toast.error("Failed to search users")
        } finally {
            setIsSearching(false)
        }
    }

    const addMember = (user: any) => {
        if (selectedParticipants.some(p => p.email === user.email)) {
            toast.error("Participant already added to list")
            return
        }
        setSelectedParticipants([
            ...selectedParticipants,
            {
                userId: user.id,
                name: user.name,
                email: user.email,
                isMember: true
            }
        ])
        setSearchQuery("")
        setSearchResults([])
    }

    const addGuest = () => {
        if (!guestName || !guestEmail) {
            toast.error("Name and Email are required for guests")
            return
        }
        if (selectedParticipants.some(p => p.email === guestEmail)) {
            toast.error("Participant already added to list")
            return
        }
        setSelectedParticipants([
            ...selectedParticipants,
            {
                name: guestName,
                email: guestEmail,
                phone: guestPhone,
                gender: guestGender,
                isMember: false
            }
        ])
        // Reset guest form
        setGuestName("")
        setGuestEmail("")
        setGuestPhone("")
    }

    const removeParticipant = (email: string) => {
        setSelectedParticipants(selectedParticipants.filter(p => p.email !== email))
    }

    const handleSubmit = async () => {
        if (selectedParticipants.length === 0) return
        setIsSubmitting(true)
        try {
            const result = await bulkAdminEnrollAction(programmeId, selectedParticipants)
            if (result.success) {
                toast.success(`Successfully enrolled ${result.count} participants`)
                setOpen(false)
                setSelectedParticipants([])
                window.location.reload()
            } else {
                toast.error(result.error || "Failed to enroll participants")
            }
        } catch (error) {
            toast.error("An error occurred during enrollment")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Participants
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-emerald-800">
                        <Users className="h-5 w-5" />
                        Direct Enrollment
                    </DialogTitle>
                    <DialogDescription>
                        Register participants for <strong>{programmeTitle}</strong>. 
                        They will be marked as PAID and ATTENDED.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4 overflow-hidden">
                    {/* Search Section */}
                    <div className="space-y-3">
                        <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Search Existing Members</Label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search by name or email..."
                                    className="pl-9 h-10 border-emerald-100 focus:border-emerald-500"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                />
                            </div>
                            <Button onClick={handleSearch} disabled={isSearching} variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                                {isSearching ? "..." : "Search"}
                            </Button>
                        </div>
                        
                        {searchResults.length > 0 && (
                            <div className="border rounded-md divide-y bg-gray-50/50 max-h-[150px] overflow-y-auto">
                                {searchResults.map((user) => (
                                    <div key={user.id} className="flex items-center justify-between p-2 hover:bg-emerald-50/50 transition-colors">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold">{user.name}</span>
                                            <span className="text-[10px] text-gray-500">{user.email}</span>
                                        </div>
                                        <Button size="sm" variant="ghost" onClick={() => addMember(user)} className="h-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100">
                                            <Plus className="h-3.5 w-3.5 mr-1" /> Add
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Manual Guest Entry Section */}
                    <div className="space-y-3 p-4 border rounded-lg bg-gray-50/30">
                        <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Add Guest (Manually)</Label>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Input 
                                    placeholder="Full Name" 
                                    value={guestName} 
                                    onChange={(e) => setGuestName(e.target.value)} 
                                    className="h-9 text-sm"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Input 
                                    placeholder="Email Address" 
                                    type="email" 
                                    value={guestEmail} 
                                    onChange={(e) => setGuestEmail(e.target.value)} 
                                    className="h-9 text-sm"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Input 
                                    placeholder="Phone Number" 
                                    value={guestPhone} 
                                    onChange={(e) => setGuestPhone(e.target.value)} 
                                    className="h-9 text-sm"
                                />
                            </div>
                            <div className="flex gap-2">
                                <select 
                                    value={guestGender} 
                                    onChange={(e) => setGuestGender(e.target.value)}
                                    className="h-9 flex-1 px-3 py-1 text-sm rounded-md border border-input bg-background"
                                >
                                    <option value="MALE">Male</option>
                                    <option value="FEMALE">Female</option>
                                </select>
                                <Button onClick={addGuest} className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 font-bold h-9">
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Selected List Section */}
                    <div className="space-y-3 flex-1 flex flex-col min-h-0">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Participants to Enroll ({selectedParticipants.length})</Label>
                            {selectedParticipants.length > 0 && (
                                <Button variant="ghost" size="sm" onClick={() => setSelectedParticipants([])} className="h-6 text-[10px] text-red-500 hover:text-red-700 hover:bg-red-50">
                                    Clear All
                                </Button>
                            )}
                        </div>
                        <ScrollArea className="flex-1 border rounded-md bg-white">
                            <div className="p-2 space-y-2">
                                {selectedParticipants.length === 0 ? (
                                    <div className="py-8 text-center text-gray-400 text-sm italic">
                                        No participants added yet.
                                    </div>
                                ) : (
                                    selectedParticipants.map((p, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2 rounded-md bg-emerald-50/30 border border-emerald-100/50">
                                            <div className="flex items-center gap-3">
                                                <Badge variant={p.isMember ? "default" : "outline"} className="h-5 text-[9px] font-bold uppercase">
                                                    {p.isMember ? "Member" : "Guest"}
                                                </Badge>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-gray-800">{p.name}</span>
                                                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                                        <span className="flex items-center gap-1"><Mail className="h-2.5 w-2.5" /> {p.email}</span>
                                                        {p.phone && <span className="flex items-center gap-1"><Phone className="h-2.5 w-2.5" /> {p.phone}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <Button size="icon" variant="ghost" onClick={() => removeParticipant(p.email)} className="h-7 w-7 text-gray-400 hover:text-red-500">
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                </div>

                <DialogFooter className="border-t pt-4">
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSubmit} 
                        disabled={isSubmitting || selectedParticipants.length === 0}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                    >
                        {isSubmitting ? "Enrolling..." : "Confirm Enrollment"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
