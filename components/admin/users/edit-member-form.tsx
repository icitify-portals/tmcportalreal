"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateMemberDetails } from "@/lib/actions/users"
import { toast } from "sonner"
import { Loader2, Save } from "lucide-react"
import { locationData } from "@/lib/location-data"

const formSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z.string().optional(),
    memberId: z.string().optional(),
    occupation: z.string().optional(),
    address: z.string().optional(),
    gender: z.enum(["MALE", "FEMALE"]).optional(),
    state: z.string().optional(),
    lga: z.string().optional(),
    branch: z.string().optional(),
})

interface EditMemberFormProps {
    userId: string
    initialData: z.infer<typeof formSchema>
}

export function EditMemberForm({ userId, initialData }: EditMemberFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [selectedState, setSelectedState] = useState<string | undefined>(initialData.state)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: initialData,
    })

    const states = Object.keys(locationData)
    const lgas = selectedState ? (locationData as any)[selectedState]?.lgas || [] : []
    
    // Find the currently selected LGA object to get its branches
    const currentLgaName = form.watch("lga")
    const branches = lgas.find((l: any) => l.name === currentLgaName)?.branches || []

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)
        try {
            const res = await updateMemberDetails(userId, values as any)
            if (res.success) {
                toast.success("Member details updated successfully")
            } else {
                toast.error(res.error || "Failed to update member details")
            }
        } catch (error) {
            toast.error("An unexpected error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                    <Input {...field} className="text-black font-medium" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email Address</FormLabel>
                                <FormControl>
                                    <Input {...field} className="text-black font-medium" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Phone Number</FormLabel>
                                <FormControl>
                                    <Input {...field} className="text-black font-medium" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="memberId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Membership ID</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="TMC/XX/202X/XXX" className="text-black font-medium placeholder:text-gray-400" />
                                </FormControl>
                                <FormDescription>Official TMC ID format</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Gender</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="text-black font-medium">
                                            <SelectValue placeholder="Select Gender" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="MALE">Male</SelectItem>
                                        <SelectItem value="FEMALE">Female</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="occupation"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Occupation</FormLabel>
                                <FormControl>
                                    <Input {...field} className="text-black font-medium" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>State</FormLabel>
                                <Select 
                                    onValueChange={(val) => {
                                        field.onChange(val)
                                        setSelectedState(val)
                                        form.setValue("lga", "") // Reset LGA
                                    }} 
                                    defaultValue={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger className="text-black font-medium">
                                            <SelectValue placeholder="Select State" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {states.map(s => (
                                            <SelectItem key={s} value={s}>{s}</SelectItem>
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
                        control={form.control}
                        name="lga"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>LGA</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value} disabled={!selectedState}>
                                    <FormControl>
                                        <SelectTrigger className="text-black font-medium">
                                            <SelectValue placeholder="Select LGA" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {lgas.map((l: any) => (
                                            <SelectItem key={l.name} value={l.name}>{l.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="branch"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Branch</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value} disabled={!currentLgaName}>
                                    <FormControl>
                                        <SelectTrigger className="text-black font-medium">
                                            <SelectValue placeholder="Select Branch" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {branches.map((b: string) => (
                                            <SelectItem key={b} value={b}>{b}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Residential Address</FormLabel>
                            <FormControl>
                                <Input {...field} className="text-black font-medium" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" className="w-full bg-green-700 hover:bg-green-800" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                </Button>
            </form>
        </Form>
    )
}
