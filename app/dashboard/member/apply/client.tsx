"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch, useFieldArray } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Loader2, Check, ChevronRight, ChevronLeft, Home, LogOut, Save, Trash2, Plus, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from "next/link"
import { nigerianStatesAndLgas } from "@/lib/nigeria-data"
import { countries } from "@/lib/countries"
import { locationData } from "@/lib/location-data"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

const genotypes = ['AA', 'AS', 'AC', 'SS', 'SC'];
const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const qualifications = [
    "High School / Secondary School",
    "Diploma / Certificate",
    "Bachelor's Degree",
    "Master's Degree",
    "Doctorate (Ph.D.)",
    "Professional Qualification",
    "Other"
];

const occupations = [
    "Student",
    "Unemployed",
    "Self-Employed / Business Owner",
    "Civil Servant",
    "Private Sector Employee",
    "Healthcare Professional",
    "Education Professional",
    "IT Professional",
    "Legal Professional",
    "Engineering Professional",
    "Artisan / Skilled Trade",
    "Agriculture / Farming",
    "Other"
];


const STORAGE_KEY = "tmc_membership_form_data"

// Form schemas
// Form schemas
const biodataBase = z.object({
    fullName: z.string().min(1, "Full name is required"),
    country: z.string().min(1, "Country is required"),
    state: z.string().min(1, "State is required"),
    local_government_area: z.string().min(1, "LGA is required"),
    branch: z.string().min(1, "Branch is required"),
    date_of_birth: z.string().min(1, "Date of birth is required"),
    state_of_origin: z.string().min(1, "State of origin is required"),
    lga_of_origin: z.string().min(1, "LGA of origin is required"),
    whatsapp_number: z.string().min(1, "WhatsApp number is required"),
    maritalStatus: z.enum(["SINGLE", "MARRIED"]),
    dateOfMarriage: z.string().optional(),
    numberOfWives: z.coerce.number().min(1).max(4).optional(),
    numChildrenMale: z.coerce.number().min(0).optional(),
    numChildrenFemale: z.coerce.number().min(0).optional(),
    // Contact moved here
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    emergencyContactName: z.string().min(2, "Emergency contact name is required"),
    emergencyContactPhone: z.string().min(10, "Emergency contact phone is required"),
    nextOfKinName: z.string().min(2, "Next of Kin name is required"),
    nextOfKinPhone: z.string().min(10, "Next of Kin phone is required"),
    nextOfKinAddress: z.string().min(5, "Next of Kin address is required"),
})

const healthInfoSchema = z.object({
    genotype: z.string().min(1, 'Genotype is required'),
    blood_group: z.string().min(1, 'Blood group is required'),
    specific_ailment: z.string().optional(),
    hospital: z.string().optional(),
    doctorName: z.string().optional(),
    doctorPhone: z.string().optional(),
})

const educationSchema = z.object({
    institution: z.string().min(1, "Institution name is required"),
    course: z.string(), // Removed min(1) to allow empty string for legacy data compatibility
    degreeClass: z.string().min(1, "Class of Degree is required"),
    yearAdmitted: z.coerce.number().min(1900, "Invalid year").max(new Date().getFullYear(), "Future year not allowed"),
    yearGraduated: z.coerce.number().min(1900, "Invalid year").max(new Date().getFullYear(), "Future year not allowed"),
})

const professionalSchema = z.object({
    qualification: z.string().min(1, 'Qualification is required'),
    occupation: z.string().min(1, 'Occupation is required'),
    specialization: z.string().min(1, 'Specialization is required'),
    years_of_experience: z.coerce.number().min(0, 'Years of experience must be a positive number'),
    membership_duration: z.coerce.number().min(0, 'Membership duration must be a positive number'),
    educationHistory: z.array(educationSchema).optional(),
})

const combinedSchema = biodataBase.merge(healthInfoSchema).merge(professionalSchema).refine((data) => {
    if (data.maritalStatus === "MARRIED") {
        return !!data.dateOfMarriage && !!data.numberOfWives
    }
    return true
}, {
    message: "Date of marriage and number of wives are required",
    path: ["dateOfMarriage"],
})

type FormData = z.infer<typeof combinedSchema>

const steps = [
    { id: 1, name: "Biodata", description: "Personal, Contact & Location" },
    { id: 2, name: "Health", description: "Medical Information" },
    { id: 3, name: "Professional", description: "Work & Education" },
    { id: 4, name: "Review", description: "Review and Submit" },
]

const defaultValues: Partial<FormData> = {
    fullName: "",
    country: "",
    state: "",
    local_government_area: "",
    branch: "",
    date_of_birth: "",
    state_of_origin: "",
    lga_of_origin: "",
    whatsapp_number: "",
    maritalStatus: "SINGLE",
    dateOfMarriage: "",
    numberOfWives: 1, // Default to 1 if married
    numChildrenMale: 0,
    numChildrenFemale: 0,
    phone: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    nextOfKinName: "",
    nextOfKinPhone: "",
    nextOfKinAddress: "",
    occupation: "",
    qualification: "",
    specialization: "",
    years_of_experience: 0,
    membership_duration: 0,
    educationHistory: [],
    genotype: "",
    blood_group: "",
    specific_ailment: "",
    hospital: "",
}

export default function MembershipApplicationClientPage() {
    const router = useRouter()
    const { data: session } = useSession()
    const [step, setStep] = useState(1)
    const [isLoading, setIsLoading] = useState(false)
    const [isLoaded, setIsLoaded] = useState(false)
    const [memberStatus, setMemberStatus] = useState<string | null>(null)
    const [rejectionReason, setRejectionReason] = useState<string | null>(null)

    const form = useForm<FormData>({
        resolver: zodResolver(combinedSchema) as any,
        mode: "onChange",
        defaultValues,
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "educationHistory",
    })


    // Load saved data on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
            try {
                const parsed = JSON.parse(saved)

                // DATA MIGRATION: Ensure educationHistory has 'course' field
                if (parsed.educationHistory && Array.isArray(parsed.educationHistory)) {
                    parsed.educationHistory = parsed.educationHistory.map((edu: any) => ({
                        ...edu,
                        course: edu.course || ""
                    }))
                }

                form.reset({ ...defaultValues, ...parsed })
                // Also try to restore step if saved? For now just data.
                toast.info("Resumed from your saved progress.")
                if (parsed.status) setMemberStatus(parsed.status)
                if (parsed.rejectionReason) setRejectionReason(parsed.rejectionReason)
            } catch (e) {
                console.error("Failed to load saved form", e)
            }
        }
        setIsLoaded(true)
    }, [form])

    // Pre-fill name and country from session when available
    useEffect(() => {
        if (isLoaded && session?.user) {
            if (session.user.name && !form.getValues("fullName")) {
                form.setValue("fullName", session.user.name)
            }
            // Pre-fill country if available and not already set manually (or from save)
            if (session.user.country && !form.getValues("country")) {
                form.setValue("country", session.user.country)
            } else if (!form.getValues("country")) {
                // Default fallback if not in session?
                form.setValue("country", "Nigeria")
            }
        }
    }, [session, form, isLoaded])

    // Auto-save logic (Debounced ideally, but direct for simplicity or on step change)
    const formValues = useWatch({ control: form.control })

    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...formValues, status: memberStatus, rejectionReason }))
        }
    }, [formValues, isLoaded, memberStatus, rejectionReason])

    // Cascading Select Logic
    const { control, setValue, trigger, getValues } = form

    const selectedStateOfResidence = useWatch({ control, name: 'state' })
    const selectedLgaOfResidence = useWatch({ control, name: 'local_government_area' })
    const selectedStateOfOrigin = useWatch({ control, name: 'state_of_origin' })
    const maritalStatus = useWatch({ control, name: 'maritalStatus' })
    const numChildrenMale = useWatch({ control, name: 'numChildrenMale' }) || 0
    const numChildrenFemale = useWatch({ control, name: 'numChildrenFemale' }) || 0
    const totalChildren = Number(numChildrenMale) + Number(numChildrenFemale)

    const statesOfOrigin = nigerianStatesAndLgas.map((s) => s.state)
    const residenceStates = Object.keys(locationData)

    const lgasForSelectedStateOfResidence = selectedStateOfResidence
        ? locationData[selectedStateOfResidence as keyof typeof locationData]?.lgas || []
        : []

    const branchesForSelectedLga = lgasForSelectedStateOfResidence?.find(lga => lga.name === selectedLgaOfResidence)?.branches || []

    const lgasForSelectedStateOfOrigin = nigerianStatesAndLgas.find(s => s.state === selectedStateOfOrigin)?.lgas || []

    // Reset dependent fields when parent changes - careful with auto-load
    // Only reset if interaction happens? useWatch won't distinguish.
    // We'll rely on user manually correcting if data is stale, or simple resets.
    // Actually, disabling the aggressive resets for now to avoid clearing restored data
    // unless we are sure it's a user change.
    // For now, let's keep the resets but maybe guard them?
    // Simplest is to let them run. Restored data should be consistent.

    useEffect(() => {
        if (!isLoaded) return
        // Re-checking consistency could be done here
    }, [selectedStateOfResidence, isLoaded])


    const nextStep = async () => {
        let isValid = false

        if (step === 1) isValid = await trigger([
            "fullName", "country", "state", "local_government_area", "branch",
            "date_of_birth", "state_of_origin", "lga_of_origin", "whatsapp_number",
            "maritalStatus", "dateOfMarriage", "numberOfWives", "numChildrenMale", "numChildrenFemale",
            "phone", "emergencyContactName", "emergencyContactPhone", "nextOfKinName", "nextOfKinPhone", "nextOfKinAddress"
        ])
        if (step === 2) isValid = await trigger(["genotype", "blood_group", "specific_ailment", "hospital", "doctorName", "doctorPhone"])
        if (step === 3) isValid = await trigger(["occupation", "qualification", "specialization", "years_of_experience", "membership_duration"])

        if (isValid) setStep((s) => s + 1)
    }

    const prevStep = () => setStep((s) => s - 1)

    const handleSaveAndExit = () => {
        // Data is already auto-saved to localStorage due to useEffect
        // Just notify and sign out (or redirect)
        toast.success("Progress saved. You can resume later on this device.")
        router.push("/") // Or sign out
        // User asked for "Sign Out and Save".
    }

    const handleSignOut = async () => {
        // Data is auto-saved
        localStorage.setItem(STORAGE_KEY, JSON.stringify(form.getValues())) // Force save just in case
        await signOut({ callbackUrl: "/" })
    }

    async function onSubmit(data: FormData) {
        setIsLoading(true)
        try {
            const response = await fetch("/api/members/apply", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || "Failed to submit application")
            }

            // Assuming the API returns the member's status and rejection reason if applicable
            if (result.status === "REJECTED" && result.rejectionReason) {
                setMemberStatus(result.status)
                setRejectionReason(result.rejectionReason)
                toast.error("Your application was rejected. Please review the feedback and resubmit.")
                // Do not clear local storage or redirect, allow user to edit
            } else {
                // Application is PENDING or ACTIVE
                localStorage.removeItem(STORAGE_KEY) // Clear saved data on successful submission
                setMemberStatus(result.status)
                setRejectionReason(null) // Clear any previous rejection reason
                toast.success("Application submitted successfully!")
                router.push("/dashboard/member")
                router.refresh()
            }
        } catch (error: any) {
            console.error(error)
            toast.error(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <DashboardLayout>
            <div className="container max-w-3xl py-8">
                {/* Header with Navigation - Removed Home link as Sidebar handles it */}
                <div className="flex justify-end items-center mb-6 border-b pb-4">
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handleSaveAndExit}>
                            <Save className="w-4 h-4 mr-2" />
                            Save & Exit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                            <LogOut className="w-4 h-4 mr-2" />
                            Sign Out
                        </Button>
                    </div>
                </div>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Membership Application</h1>
                    <p className="text-muted-foreground">Complete the form below to join our community.</p>
                </div>

                {memberStatus === "REJECTED" && rejectionReason && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Application Rejected</AlertTitle>
                        <AlertDescription>
                            Your application was returned for the following reason: <br />
                            <span className="font-semibold">{rejectionReason}</span>
                            <br />
                            Please update the necessary information below and resubmit.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Progress Steps */}
                <div className="mb-8">
                    <div className="flex justify-between relative">
                        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -z-10" />
                        {steps.map((s) => (
                            <div key={s.id} className="flex flex-col items-center bg-background px-2">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-sm font-medium transition-colors ${step >= s.id
                                        ? "border-green-600 bg-green-600 text-white"
                                        : "border-gray-300 text-gray-500"
                                        } `}
                                >
                                    {step > s.id ? <Check className="w-4 h-4" /> : s.id}
                                </div>
                                <span className={`text-xs mt-1 ${step >= s.id ? "text-green-600 font-medium" : "text-gray-500"} `}>
                                    {s.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
                        console.error("Submission blocked by validation:", JSON.stringify(errors, null, 2));
                        console.log("Current Form Values:", form.getValues());

                        toast.error("Please check previous steps for missing information.");

                        // Auto-navigate to error step
                        if (errors.educationHistory || errors.occupation || errors.qualification || errors.specialization) {
                            setStep(3)
                        } else if (errors.genotype || errors.blood_group) {
                            setStep(2)
                        } else if (errors.fullName || errors.phone || errors.maritalStatus || errors.dateOfMarriage) {
                            setStep(1)
                        } else {
                            // Default fallback
                            setStep(1)
                        }
                    })}>
                        <Card>
                            <CardHeader>
                                <CardTitle>{steps[step - 1].name}</CardTitle>
                                <CardDescription>{steps[step - 1].description}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">

                                {/* Step 1: Biodata & Contact */}
                                {step === 1 && (
                                    <>
                                        <FormField
                                            control={control}
                                            name="fullName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Full Name (as in NIN and BVN)</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Enter your full name" {...field} />
                                                    </FormControl>
                                                    <FormDescription>
                                                        Use your official name as it appears on your NIN or BVN.
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField
                                                control={control}
                                                name="date_of_birth"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Date of Birth</FormLabel>
                                                        <FormControl>
                                                            <Input type="date" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={control}
                                                name="whatsapp_number"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>WhatsApp Number</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="+234..." {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        {/* Marital Status Section */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField
                                                control={control}
                                                name="maritalStatus"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Marital Status</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select status" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="SINGLE">Single</SelectItem>
                                                                <SelectItem value="MARRIED">Married</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {maritalStatus === "MARRIED" && (
                                                <>
                                                    <FormField
                                                        control={control}
                                                        name="dateOfMarriage"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Date of Marriage</FormLabel>
                                                                <FormControl>
                                                                    <Input type="date" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={control}
                                                        name="numberOfWives"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Number of Wives</FormLabel>
                                                                <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                                                                    <FormControl>
                                                                        <SelectTrigger>
                                                                            <SelectValue placeholder="Select" />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent>
                                                                        <SelectItem value="1">1</SelectItem>
                                                                        <SelectItem value="2">2</SelectItem>
                                                                        <SelectItem value="3">3</SelectItem>
                                                                        <SelectItem value="4">4</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </>
                                            )}
                                        </div>

                                        {maritalStatus === "MARRIED" && (
                                            <div className="p-4 border rounded-md bg-gray-50 dark:bg-gray-900/50 space-y-4">
                                                <h4 className="font-medium text-sm">Children Information</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                                    <FormField
                                                        control={control}
                                                        name="numChildrenMale"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Male Children</FormLabel>
                                                                <FormControl>
                                                                    <Input type="number" min="0" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={control}
                                                        name="numChildrenFemale"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Female Children</FormLabel>
                                                                <FormControl>
                                                                    <Input type="number" min="0" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <div>
                                                        <FormLabel>Total Children</FormLabel>
                                                        <div className="h-10 flex items-center px-3 border rounded-md bg-white dark:bg-gray-950 text-muted-foreground">
                                                            {totalChildren}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField
                                                control={control}
                                                name="country"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Country of Residence</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} readOnly disabled className="bg-muted" />
                                                        </FormControl>
                                                        <FormDescription>Pre-filled from signup.</FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={control}
                                                name="state"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>State of Residence</FormLabel>
                                                        <Select onValueChange={(value) => {
                                                            field.onChange(value);
                                                            form.setValue("local_government_area", "");
                                                            form.setValue("branch", "");
                                                        }} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select state" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {residenceStates.map((state) => (
                                                                    <SelectItem key={state} value={state}>
                                                                        {state}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField
                                                control={control}
                                                name="local_government_area"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>LGA of Residence</FormLabel>
                                                        <Select onValueChange={(value) => {
                                                            field.onChange(value);
                                                            form.setValue("branch", "");
                                                        }} value={field.value} disabled={!selectedStateOfResidence}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select LGA" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {lgasForSelectedStateOfResidence.map((lga) => (
                                                                    <SelectItem key={lga.name} value={lga.name}>
                                                                        {lga.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={control}
                                                name="branch"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Branch</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value} disabled={!selectedLgaOfResidence || branchesForSelectedLga.length === 0}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select branch" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {branchesForSelectedLga.map((branch) => (
                                                                    <SelectItem key={branch} value={branch}>
                                                                        {branch}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField
                                                control={control}
                                                name="state_of_origin"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>State of Origin</FormLabel>
                                                        <Select onValueChange={(value) => {
                                                            field.onChange(value);
                                                            form.setValue("lga_of_origin", "");
                                                        }} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select state of origin" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {statesOfOrigin.map((state) => (
                                                                    <SelectItem key={state} value={state}>
                                                                        {state}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={control}
                                                name="lga_of_origin"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>LGA of Origin</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value} disabled={!selectedStateOfOrigin}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select LGA of origin" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {lgasForSelectedStateOfOrigin.map((lga) => (
                                                                    <SelectItem key={lga} value={lga}>
                                                                        {lga}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        {/* New Contact Sections - Emergency & Next of Kin */}
                                        {/* Re-added Phone here as requested by user to merge contact */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4 mt-4">
                                            <FormField
                                                control={control}
                                                name="phone"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Primary Phone Number</FormLabel>
                                                        <FormControl>
                                                            <Input type="tel" placeholder="08012345678" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="space-y-4 border-t pt-4 mt-6">
                                            <h3 className="font-medium">Emergency Contact</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <FormField
                                                    control={control}
                                                    name="emergencyContactName"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Name</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="Contact person name" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={control}
                                                    name="emergencyContactPhone"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Phone Number</FormLabel>
                                                            <FormControl>
                                                                <Input type="tel" placeholder="Contact person phone" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-4 border-t pt-4 mt-4">
                                            <h3 className="font-medium">Next of Kin</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <FormField
                                                    control={control}
                                                    name="nextOfKinName"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Name</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="Next of Kin Name" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={control}
                                                    name="nextOfKinPhone"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Phone Number</FormLabel>
                                                            <FormControl>
                                                                <Input type="tel" placeholder="Next of Kin Phone" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <FormField
                                                control={control}
                                                name="nextOfKinAddress"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Address</FormLabel>
                                                        <FormControl>
                                                            <Textarea placeholder="Next of Kin Address" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </>
                                )}

                                {/* Step 2: Health Info (Replaced Contact) */}
                                {step === 2 && (
                                    <div className="space-y-4">
                                        <FormField
                                            control={control}
                                            name="genotype"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Genotype</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select your genotype" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {genotypes.map((type) => (
                                                                <SelectItem key={type} value={type}>
                                                                    {type}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={control}
                                            name="blood_group"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Blood Group</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select your blood group" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {bloodGroups.map((group) => (
                                                                <SelectItem key={group} value={group}>
                                                                    {group}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={control}
                                            name="specific_ailment"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Any Specific Ailment? (Optional)</FormLabel>
                                                    <FormControl>
                                                        <Textarea placeholder="e.g., Asthma, Allergy to..." {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={control}
                                            name="hospital"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Preferred Hospital (Optional)</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Name of hospital" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField
                                                control={control}
                                                name="doctorName"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Family Doctor Name (Optional)</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Dr. Name" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={control}
                                                name="doctorPhone"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Doctor Phone (Optional)</FormLabel>
                                                        <FormControl>
                                                            <Input type="tel" placeholder="Doctor's Phone" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Step 3: Professional */}
                                {step === 3 && (
                                    <div className="space-y-4">
                                        <FormField
                                            control={control}
                                            name="qualification"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Highest Qualification</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select your highest qualification" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {qualifications.map((qual) => (
                                                                <SelectItem key={qual} value={qual}>
                                                                    {qual}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={control}
                                            name="occupation"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Occupation</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select your occupation" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {occupations.map((occ) => (
                                                                <SelectItem key={occ} value={occ}>
                                                                    {occ}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={control}
                                            name="specialization"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Area of Specialization</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="e.g., Frontend Development" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={control}
                                            name="years_of_experience"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Years of Experience</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" placeholder="5" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={control}
                                            name="membership_duration"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Membership Duration (Years)</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" placeholder="1" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="space-y-4 border-t pt-4 mt-6">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-medium">Education History</h3>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => append({ institution: "", course: "", degreeClass: "", yearAdmitted: new Date().getFullYear(), yearGraduated: new Date().getFullYear() })}
                                                >
                                                    <Plus className="w-4 h-4 mr-2" /> Add School
                                                </Button>
                                            </div>

                                            {fields.length === 0 && (
                                                <p className="text-sm text-muted-foreground text-center py-4 bg-muted/50 rounded-md">
                                                    No education history added yet.
                                                </p>
                                            )}

                                            {fields.map((field, index) => (
                                                <div key={field.id} className="p-4 border rounded-md relative bg-card animate-in fade-in slide-in-from-top-2">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                                                        onClick={() => remove(index)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>

                                                    <div className="grid gap-4">
                                                        <FormField
                                                            control={control}
                                                            name={`educationHistory.${index}.institution`}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Institution Name</FormLabel>
                                                                    <FormControl>
                                                                        <Input placeholder="University of Lagos" {...field} />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <FormField
                                                            control={control}
                                                            name={`educationHistory.${index}.course`}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Course of Study</FormLabel>
                                                                    <FormControl>
                                                                        <Input placeholder="e.g. Computer Science" {...field} />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <FormField
                                                            control={control}
                                                            name={`educationHistory.${index}.degreeClass`}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Class of Degree</FormLabel>
                                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                        <FormControl>
                                                                            <SelectTrigger>
                                                                                <SelectValue placeholder="Select class" />
                                                                            </SelectTrigger>
                                                                        </FormControl>
                                                                        <SelectContent>
                                                                            <SelectItem value="First Class">First Class</SelectItem>
                                                                            <SelectItem value="Second Class Upper">Second Class Upper</SelectItem>
                                                                            <SelectItem value="Second Class Lower">Second Class Lower</SelectItem>
                                                                            <SelectItem value="Third Class">Third Class</SelectItem>
                                                                            <SelectItem value="Distinction">Distinction</SelectItem>
                                                                            <SelectItem value="Upper Credit">Upper Credit</SelectItem>
                                                                            <SelectItem value="Lower Credit">Lower Credit</SelectItem>
                                                                            <SelectItem value="Pass">Pass</SelectItem>
                                                                            <SelectItem value="Other">Other</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <FormField
                                                                control={control}
                                                                name={`educationHistory.${index}.yearAdmitted`}
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel>Year Admitted</FormLabel>
                                                                        <FormControl>
                                                                            <Input type="number" {...field} />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                            <FormField
                                                                control={control}
                                                                name={`educationHistory.${index}.yearGraduated`}
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel>Year Graduated</FormLabel>
                                                                        <FormControl>
                                                                            <Input type="number" {...field} />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Step 4: Review */}
                                {step === 4 && (
                                    <div className="space-y-4 text-sm">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="col-span-2 border-b pb-2 mb-2 font-medium text-primary">Personal & Contact</div>
                                            <div>
                                                <span className="text-muted-foreground block">Full Name</span>
                                                <span className="font-medium">{getValues("fullName")}</span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground block">Phone</span>
                                                <span className="font-medium">{getValues("phone")}</span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground block">Emergency Contact</span>
                                                <span className="font-medium">{getValues("emergencyContactName")} ({getValues("emergencyContactPhone")})</span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground block">Next of Kin</span>
                                                <span className="font-medium">{getValues("nextOfKinName")} ({getValues("nextOfKinPhone")})</span>
                                                <span className="text-xs text-muted-foreground block">{getValues("nextOfKinAddress")}</span>
                                            </div>

                                            <div className="col-span-2 border-b pb-2 mb-2 font-medium text-primary mt-4">Location</div>
                                            <div className="col-span-2">
                                                <span className="text-muted-foreground block">Address</span>
                                                <span className="font-medium">{getValues("branch")}, {getValues("local_government_area")}, {getValues("state")}, {getValues("country")}</span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground block">State of Origin</span>
                                                <span className="font-medium">{getValues("state_of_origin")} ({getValues("lga_of_origin")})</span>
                                            </div>

                                            <div className="col-span-2 border-b pb-2 mb-2 font-medium text-primary mt-4">Health</div>
                                            <div>
                                                <span className="text-muted-foreground block">Genotype / Blood Group</span>
                                                <span className="font-medium">{getValues("genotype")} / {getValues("blood_group")}</span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground block">Ailments / Hospital</span>
                                                <span className="font-medium">{getValues("specific_ailment") || "None"} / {getValues("hospital") || "None"}</span>
                                            </div>

                                            <div className="col-span-2 border-b pb-2 mb-2 font-medium text-primary mt-4">Professional</div>
                                            <div>
                                                <span className="text-muted-foreground block">Qualification</span>
                                                <span className="font-medium">{getValues("qualification")}</span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground block">Occupation</span>
                                                <span className="font-medium">{getValues("occupation")}</span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground block">Specialization</span>
                                                <span className="font-medium">{getValues("specialization")}</span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground block">Experience / Membership</span>
                                                <span className="font-medium text-xs">{getValues("years_of_experience")} yrs exp / {getValues("membership_duration")} yrs member</span>
                                            </div>

                                            {(getValues("educationHistory")?.length ?? 0) > 0 && (
                                                <div className="col-span-2 mt-2">
                                                    <span className="text-muted-foreground block mb-1">Education History</span>
                                                    <div className="bg-muted/50 rounded-md p-2 space-y-2">
                                                        {getValues("educationHistory")?.map((edu, i) => (
                                                            <div key={i} className="text-sm">
                                                                <span className="font-medium">{edu.institution}</span>
                                                                <span className="text-muted-foreground ml-2">({edu.yearAdmitted} - {edu.yearGraduated})</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 text-xs">
                                            <p className="font-semibold mb-1">Declaration</p>
                                            <p>By clicking submit, I attest that the information provided is accurate and I agree to abide by the rules and regulations of the Muslim Congress.</p>
                                        </div>
                                    </div>
                                )}

                            </CardContent>
                            <CardFooter className="flex justify-between">
                                {step > 1 ? (
                                    <Button type="button" variant="outline" onClick={prevStep} disabled={isLoading}>
                                        <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                                    </Button>
                                ) : (
                                    <Button type="button" variant="ghost" disabled className="invisible">Previous</Button>
                                )}

                                {step < 4 ? (
                                    <Button type="button" onClick={nextStep} className="bg-green-600 hover:bg-green-700 text-white">
                                        Next <ChevronRight className="ml-2 h-4 w-4" />
                                    </Button>
                                ) : (
                                    <Button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700 text-white">
                                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Submit Application
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    </form>
                </Form>
            </div>
        </DashboardLayout>
    )
}
