"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

// Schema
const roleSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    code: z.string().min(2, "Code must be at least 2 characters").regex(/^[A-Z_]+$/, "Code must be uppercase with underscores (e.g., BRANCH_MANAGER)"),
    description: z.string().optional(),
    jurisdictionLevel: z.enum(["SYSTEM", "NATIONAL", "STATE", "LOCAL_GOVERNMENT", "BRANCH"]),
    permissionIds: z.array(z.string()),
})

type RoleFormValues = z.infer<typeof roleSchema>

interface RoleFormProps {
    initialData?: any | null
    permissions: any[]
    groupedPermissions: Record<string, any[]>
}

export function RoleForm({ initialData, permissions, groupedPermissions }: RoleFormProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<RoleFormValues>({
        resolver: zodResolver(roleSchema),
        defaultValues: initialData ? {
            name: initialData.name,
            code: initialData.code,
            description: initialData.description || "",
            jurisdictionLevel: initialData.jurisdictionLevel,
            permissionIds: initialData.rolePermissions.map((rp: any) => rp.permissionId),
        } : {
            name: "",
            code: "",
            description: "",
            jurisdictionLevel: "BRANCH",
            permissionIds: [],
        },
    })

    // Group categories for rendering
    const categories = Object.keys(groupedPermissions).sort()

    async function onSubmit(data: RoleFormValues) {
        setIsLoading(true)
        try {
            // If editing (initialData exists), we might PUT, else POST
            // For simplification, I'll assume we creating new logic here for simplicity first step
            // But actually [id] means strict edit vs create.

            const url = initialData ? `/api/roles/${initialData.id}` : `/api/roles`
            const method = initialData ? "PATCH" : "POST"

            const response = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Something went wrong")
            }

            toast.success(initialData ? "Role updated" : "Role created")
            router.push("/dashboard/admin/roles")
            router.refresh()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    // Handle "Check All" per category
    const toggleCategory = (category: string, checked: boolean) => {
        const current = new Set(form.getValues("permissionIds"))
        const catPerms = groupedPermissions[category].map(p => p.id)

        if (checked) {
            catPerms.forEach(id => current.add(id))
        } else {
            catPerms.forEach(id => current.delete(id))
        }

        form.setValue("permissionIds", Array.from(current))
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Role Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Branch Manager" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Role Code</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="BRANCH_MANAGER"
                                        {...field}
                                        disabled={!!initialData} // Lock code on edit usually good practice
                                        onChange={(e) => field.onChange(e.target.value.toUpperCase().replace(/\s+/g, '_'))}
                                    />
                                </FormControl>
                                <FormDescription>Unique uppercase identifier.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="jurisdictionLevel"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Jurisdiction Level</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a level" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="SYSTEM">System (Super Admin)</SelectItem>
                                        <SelectItem value="NATIONAL">National</SelectItem>
                                        <SelectItem value="STATE">State</SelectItem>
                                        <SelectItem value="LOCAL_GOVERNMENT">Local Government</SelectItem>
                                        <SelectItem value="BRANCH">Branch</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormDescription>
                                    Determines the scope of data access.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Describe the role's responsibilities..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Permissions</h3>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {categories.map((category) => (
                            <Card key={category}>
                                <CardHeader className="p-4 pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base cursor-pointer hover:underline" onClick={() => {
                                            // Toggle logic helper
                                            const allSelected = groupedPermissions[category].every(p =>
                                                form.getValues("permissionIds")?.includes(p.id)
                                            )
                                            toggleCategory(category, !allSelected)
                                        }}>{category}</CardTitle>
                                        {/* Need a checkbox for category? */}
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 pt-2">
                                    <div className="space-y-2">
                                        {groupedPermissions[category].map((perm) => (
                                            <FormField
                                                key={perm.id}
                                                control={form.control}
                                                name="permissionIds"
                                                render={({ field }) => {
                                                    return (
                                                        <FormItem
                                                            key={perm.id}
                                                            className="flex flex-row items-start space-x-2 space-y-0"
                                                        >
                                                            <FormControl>
                                                                <Checkbox
                                                                    checked={field.value?.includes(perm.id)}
                                                                    onCheckedChange={(checked) => {
                                                                        return checked
                                                                            ? field.onChange([...field.value, perm.id])
                                                                            : field.onChange(
                                                                                field.value?.filter(
                                                                                    (value) => value !== perm.id
                                                                                )
                                                                            )
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <div className="space-y-1 leading-none">
                                                                <FormLabel className="text-sm font-normal cursor-pointer">
                                                                    {perm.description || perm.name}
                                                                </FormLabel>
                                                            </div>
                                                        </FormItem>
                                                    )
                                                }}
                                            />
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {initialData ? "Save Changes" : "Create Role"}
                </Button>
            </form>
        </Form>
    )
}
