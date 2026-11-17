"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
    Store, 
    ArrowLeft, 
    Search, 
    Plus, 
    Phone, 
    MessageSquare, 
    CheckCircle2, 
    AlertCircle, 
    DollarSign, 
    ShieldCheck, 
    Trash2, 
    Edit, 
    ExternalLink 
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { 
    getProgrammeVendors, 
    createProgrammeVendor, 
    updateProgrammeVendor, 
    deleteProgrammeVendor 
} from "@/lib/actions/programme-camp-ops"

const VENDOR_CATEGORIES = [
    { value: "ALL", label: "All Categories" },
    { value: "BOOKS_MEDIA", label: "Books & Islamic Literature" },
    { value: "CLOTHING_ATTIRE", label: "Clothing, Abayas & Caps" },
    { value: "PERFUMERY_OILS", label: "Perfumery, Attar & Oils" },
    { value: "FOOD_BEVERAGES", label: "Food, Snacks & Drinks" },
    { value: "ELECTRONICS", label: "Electronics & Accessories" },
    { value: "HEALTH_HERBAL", label: "Health, Honey & Herbal" },
    { value: "SERVICES", label: "Services & Laundry" },
    { value: "OTHER", label: "Other Merchandise" },
]

export default function AdminProgrammeVendorsPage() {
    const params = useParams()
    const id = params.id as string

    const [vendors, setVendors] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [categoryFilter, setCategoryFilter] = useState("ALL")
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [editingVendor, setEditingVendor] = useState<any | null>(null)

    // Form state
    const [businessName, setBusinessName] = useState("")
    const [ownerName, setOwnerName] = useState("")
    const [phoneNumber, setPhoneNumber] = useState("")
    const [whatsappNumber, setWhatsappNumber] = useState("")
    const [email, setEmail] = useState("")
    const [category, setCategory] = useState("BOOKS_MEDIA")
    const [description, setDescription] = useState("")
    const [stallNumber, setStallNumber] = useState("")
    const [feePaid, setFeePaid] = useState("0")
    const [paymentStatus, setPaymentStatus] = useState("PAID")
    const [securityClearance, setSecurityClearance] = useState("APPROVED")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const loadData = async () => {
        setLoading(true)
        const res = await getProgrammeVendors(id)
        if (res.success) {
            setVendors(res.data)
        } else {
            toast.error(res.error || "Failed to load vendors")
        }
        setLoading(false)
    }

    useEffect(() => {
        if (id) loadData()
    }, [id])

    const handleCreateVendor = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!businessName.trim() || !ownerName.trim() || !phoneNumber.trim()) {
            toast.error("Business name, owner name, and phone are required")
            return
        }

        setIsSubmitting(true)
        const res = await createProgrammeVendor({
            programmeId: id,
            businessName,
            ownerName,
            phoneNumber,
            whatsappNumber,
            email,
            category,
            description,
            stallNumber,
            feePaid,
            paymentStatus,
            securityClearance,
        })

        if (res.success) {
            toast.success("Camp vendor registered successfully!")
            setShowCreateModal(false)
            resetForm()
            loadData()
        } else {
            toast.error(res.error || "Failed to register vendor")
        }
        setIsSubmitting(false)
    }

    const handleUpdateVendor = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingVendor) return

        setIsSubmitting(true)
        const res = await updateProgrammeVendor(editingVendor.id, {
            businessName,
            ownerName,
            phoneNumber,
            whatsappNumber,
            email,
            category,
            description,
            stallNumber,
            feePaid,
            paymentStatus,
            securityClearance,
        })

        if (res.success) {
            toast.success("Vendor details updated!")
            setEditingVendor(null)
            resetForm()
            loadData()
        } else {
            toast.error(res.error || "Failed to update vendor")
        }
        setIsSubmitting(false)
    }

    const handleDeleteVendor = async (vendorId: string, name: string) => {
        if (!confirm(`Are you sure you want to remove ${name} from camp vendor roster?`)) return
        const res = await deleteProgrammeVendor(vendorId)
        if (res.success) {
            toast.success("Vendor removed")
            loadData()
        } else {
            toast.error(res.error || "Failed to remove vendor")
        }
    }

    const resetForm = () => {
        setBusinessName("")
        setOwnerName("")
        setPhoneNumber("")
        setWhatsappNumber("")
        setEmail("")
        setCategory("BOOKS_MEDIA")
        setDescription("")
        setStallNumber("")
        setFeePaid("0")
        setPaymentStatus("PAID")
        setSecurityClearance("APPROVED")
    }

    const openEdit = (v: any) => {
        setEditingVendor(v)
        setBusinessName(v.businessName)
        setOwnerName(v.ownerName)
        setPhoneNumber(v.phoneNumber)
        setWhatsappNumber(v.whatsappNumber || v.phoneNumber)
        setEmail(v.email || "")
        setCategory(v.category)
        setDescription(v.description || "")
        setStallNumber(v.stallNumber || "")
        setFeePaid(v.feePaid || "0")
        setPaymentStatus(v.paymentStatus || "PENDING")
        setSecurityClearance(v.securityClearance || "APPROVED")
    }

    const filteredVendors = vendors.filter(v => {
        const matchesQuery = 
            v.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.phoneNumber.includes(searchQuery) ||
            (v.stallNumber && v.stallNumber.toLowerCase().includes(searchQuery.toLowerCase()))

        const matchesCategory = categoryFilter === "ALL" || v.category === categoryFilter
        return matchesQuery && matchesCategory
    })

    const totalStalls = vendors.filter(v => v.stallNumber).length
    const totalFees = vendors.reduce((acc, v) => acc + parseFloat(v.feePaid || "0"), 0)

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-7xl mx-auto pb-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
                    <div className="flex items-center gap-3">
                        <Link href={`/dashboard/admin/programmes`}>
                            <Button variant="ghost" size="icon" className="rounded-xl">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Camp Business & Vendor Hub</h1>
                                <Badge className="bg-purple-600 text-white font-bold text-xs">Camp Bazaar</Badge>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Register commercial stands, allocate stall spaces, monitor permits, and publish bazaar directory.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link href={`/programmes/${id}/vendors`} target="_blank">
                            <Button variant="outline" className="rounded-xl text-xs font-semibold gap-1.5">
                                <ExternalLink className="w-3.5 h-3.5" /> View Public Directory
                            </Button>
                        </Link>
                        <Button 
                            onClick={() => { resetForm(); setShowCreateModal(true); }}
                            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl gap-2 shadow-sm"
                        >
                            <Plus className="w-4 h-4" /> Register New Business
                        </Button>
                    </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="rounded-2xl border border-gray-200/80 shadow-xs bg-white">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Registered Vendors</p>
                                <p className="text-2xl font-black text-purple-700 mt-1">{vendors.length}</p>
                            </div>
                            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
                                <Store className="w-6 h-6" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border border-gray-200/80 shadow-xs bg-white">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Allocated Stalls</p>
                                <p className="text-2xl font-black text-emerald-700 mt-1">{totalStalls}</p>
                            </div>
                            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border border-gray-200/80 shadow-xs bg-white">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Stall Fees Collected</p>
                                <p className="text-2xl font-black text-blue-700 mt-1">₦{totalFees.toLocaleString()}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                                <DollarSign className="w-6 h-6" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search & Category Filter */}
                <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="relative w-full sm:w-80">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <Input 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search business, owner, phone, stall..."
                            className="pl-9 h-9 text-xs rounded-xl"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="h-9 rounded-xl border border-gray-300 bg-white px-3 text-xs focus:ring-2 focus:ring-emerald-500 font-medium"
                        >
                            {VENDOR_CATEGORIES.map(c => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Vendors Grid */}
                {loading ? (
                    <div className="bg-white rounded-2xl p-12 text-center text-gray-400 text-xs">
                        Loading camp vendor directory...
                    </div>
                ) : filteredVendors.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center space-y-3">
                        <Store className="w-10 h-10 text-gray-300 mx-auto" />
                        <p className="text-sm font-semibold text-gray-700">No camp vendors registered yet</p>
                        <p className="text-xs text-gray-400 max-w-sm mx-auto">
                            Register bookshops, Islamic clothiers, scent/oil sellers, and food stands operating within the camp bazaar.
                        </p>
                        <Button 
                            onClick={() => { resetForm(); setShowCreateModal(true); }}
                            size="sm"
                            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs mt-2"
                        >
                            <Plus className="w-3.5 h-3.5 mr-1.5" /> Register First Business
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredVendors.map(v => (
                            <Card key={v.id} className="rounded-2xl border border-gray-200/90 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
                                <CardContent className="p-5 space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <Badge className="bg-purple-100 text-purple-800 font-bold text-[10px] mb-1.5">
                                                {v.category.replace('_', ' ')}
                                            </Badge>
                                            <h3 className="text-base font-black text-gray-900 leading-tight">{v.businessName}</h3>
                                            <p className="text-xs text-gray-500 font-medium mt-0.5">Proprietor: {v.ownerName}</p>
                                        </div>
                                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 font-mono text-xs rounded-xl font-black border border-emerald-200 shrink-0">
                                            {v.stallNumber || "UNASSIGNED"}
                                        </span>
                                    </div>

                                    {v.description && (
                                        <p className="text-xs text-gray-600 line-clamp-2 italic bg-gray-50 p-2 rounded-xl">
                                            "{v.description}"
                                        </p>
                                    )}

                                    <div className="space-y-1.5 text-xs text-gray-600 pt-1 border-t">
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-400">Phone:</span>
                                            <span className="font-semibold text-gray-800">{v.phoneNumber}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-400">Stall Fee:</span>
                                            <span className="font-bold text-gray-900">
                                                ₦{parseFloat(v.feePaid || "0").toLocaleString()} 
                                                <Badge className={`ml-1 text-[9px] ${v.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                                    {v.paymentStatus}
                                                </Badge>
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>

                                <div className="p-3 bg-gray-50/80 border-t flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5">
                                        <a 
                                            href={`https://wa.me/${v.whatsappNumber?.replace(/\+/g, '') || v.phoneNumber}`} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                                            title="WhatsApp"
                                        >
                                            <MessageSquare className="w-4 h-4" />
                                        </a>
                                        <a 
                                            href={`tel:${v.phoneNumber}`}
                                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                                            title="Call"
                                        >
                                            <Phone className="w-4 h-4" />
                                        </a>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        <Button 
                                            size="sm" 
                                            variant="ghost" 
                                            onClick={() => openEdit(v)}
                                            className="h-8 px-2 text-xs font-semibold text-gray-600 hover:text-gray-900"
                                        >
                                            <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                                        </Button>
                                        <Button 
                                            size="sm" 
                                            variant="ghost" 
                                            onClick={() => handleDeleteVendor(v.id, v.businessName)}
                                            className="h-8 px-2 text-xs font-semibold text-red-500 hover:text-red-700"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Create / Edit Modal */}
            {(showCreateModal || editingVendor) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-gray-100 my-8">
                        <div className="flex items-center justify-between border-b pb-3">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
                                    <Store className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-base">
                                        {editingVendor ? "Edit Camp Vendor" : "Register Camp Business / Stall"}
                                    </h3>
                                    <p className="text-xs text-gray-500">Commercial Registration Desk</p>
                                </div>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => { setShowCreateModal(false); setEditingVendor(null); }}
                                className="rounded-full h-8 w-8 p-0"
                            >
                                ✕
                            </Button>
                        </div>

                        <form onSubmit={editingVendor ? handleUpdateVendor : handleCreateVendor} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1 sm:col-span-2">
                                    <Label className="text-xs font-bold text-gray-700">Business / Brand Name *</Label>
                                    <Input 
                                        required 
                                        value={businessName} 
                                        onChange={(e) => setBusinessName(e.target.value)}
                                        placeholder="e.g. Al-Bayan Islamic Bookshop & Attire"
                                        className="h-9 text-xs rounded-xl"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-bold text-gray-700">Proprietor / Owner Name *</Label>
                                    <Input 
                                        required 
                                        value={ownerName} 
                                        onChange={(e) => setOwnerName(e.target.value)}
                                        placeholder="e.g. Bro. Rasheed Adeleke"
                                        className="h-9 text-xs rounded-xl"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-bold text-gray-700">Category *</Label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full h-9 rounded-xl border border-gray-300 bg-white px-3 text-xs focus:ring-2 focus:ring-purple-500 font-medium"
                                    >
                                        <option value="BOOKS_MEDIA">Books & Islamic Literature</option>
                                        <option value="CLOTHING_ATTIRE">Clothing, Abayas & Caps</option>
                                        <option value="PERFUMERY_OILS">Perfumery, Attar & Oils</option>
                                        <option value="FOOD_BEVERAGES">Food, Snacks & Drinks</option>
                                        <option value="ELECTRONICS">Electronics & Accessories</option>
                                        <option value="HEALTH_HERBAL">Health, Honey & Herbal</option>
                                        <option value="SERVICES">Services & Laundry</option>
                                        <option value="OTHER">Other Merchandise</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-bold text-gray-700">Phone Number *</Label>
                                    <Input 
                                        required 
                                        value={phoneNumber} 
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        placeholder="08012345678"
                                        className="h-9 text-xs rounded-xl"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-bold text-gray-700">WhatsApp Number</Label>
                                    <Input 
                                        value={whatsappNumber} 
                                        onChange={(e) => setWhatsappNumber(e.target.value)}
                                        placeholder="08012345678"
                                        className="h-9 text-xs rounded-xl"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-bold text-gray-700">Assigned Stall / Booth Number</Label>
                                    <Input 
                                        value={stallNumber} 
                                        onChange={(e) => setStallNumber(e.target.value)}
                                        placeholder="e.g. STALL-A14"
                                        className="h-9 text-xs rounded-xl font-mono"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-bold text-gray-700">Stall Fee Paid (₦)</Label>
                                    <Input 
                                        type="number"
                                        value={feePaid} 
                                        onChange={(e) => setFeePaid(e.target.value)}
                                        placeholder="e.g. 5000"
                                        className="h-9 text-xs rounded-xl"
                                    />
                                </div>

                                <div className="space-y-1 sm:col-span-2">
                                    <Label className="text-xs font-bold text-gray-700">Products & Services Description</Label>
                                    <Textarea 
                                        value={description} 
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="List key items available for sale: Qurans, Tafseer books, jilbaabs, miswak, organic honey..."
                                        rows={2}
                                        className="text-xs rounded-xl"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => { setShowCreateModal(false); setEditingVendor(null); }}
                                    className="rounded-xl text-xs h-9 font-semibold"
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                    className="bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold h-9"
                                >
                                    {isSubmitting ? "Saving..." : editingVendor ? "Update Vendor" : "Register Business"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    )
}
