"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

const assignSchema = z.object({
    roleId: z.string().min(1, "Please select a role"),
    organizationId: z.string().optional(),
}).refine((data) => {
    // We can't easily validate conditional requirement here without knowing the role details inside the schema refinement context or passing the roles list to the schema generator.
    // simpler to refine later or leave optional and validate on server/UI.
    // Ideally, if role is selected and needs org, org should be selected.
    return true;
})

interface jobProps {
    id: string
    name: string
    level: string
}

interface AssignRoleFormProps {
    userId: string
    roles: { id: string; name: string; jurisdictionLevel: string }[]
    organizations: { id: string; name: string; level: string }[]
}

export function AssignRoleForm({ userId, roles, organizations }: AssignRoleFormProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [selectedRole, setSelectedRole] = useState<{ id: string; name: string; jurisdictionLevel: string } | null>(null)

    const form = useForm<z.infer<typeof assignSchema>>({
        resolver: zodResolver(assignSchema),
        defaultValues: {
            roleId: "",
            organizationId: "",
        },
    })

    // Filter organizations based on selected role
    const filteredOrgs = selectedRole
        ? organizations.filter(org => org.level === selectedRole.jurisdictionLevel)
        : []

    async function onSubmit(values: z.infer<typeof assignSchema>) {
        setIsLoading(true)
        try {
            const response = await fetch(`/api/users/${userId}/roles`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to assign role")
            }

            toast.success("Role assigned successfully")
            form.reset()
            router.refresh()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="roleId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Role</FormLabel>
                            <Select
                                onValueChange={(val) => {
                                    field.onChange(val)
                                    const role = roles.find(r => r.id === val) || null
                                    setSelectedRole(role)
                                    form.setValue("organizationId", "") // Reset org when role changes
                                }}
                                defaultValue={field.value}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {roles.length === 0 ? (
                                        <div className="p-2 text-sm text-muted-foreground">No roles available</div>
                                    ) : (
                                        roles.map((role) => (
                                            <SelectItem key={role.id} value={role.id}>
                                                {role.name} <span className="text-xs text-muted-foreground">({role.jurisdictionLevel})</span>
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                            <FormDescription>
                                Select the role to grant to this user.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {selectedRole && selectedRole.jurisdictionLevel !== "SYSTEM" && (
                    <FormField
                        control={form.control}
                        name="organizationId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Jurisdiction / Organization</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={`Select ${selectedRole.jurisdictionLevel.toLowerCase().replace('_', ' ')}`} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {filteredOrgs.length === 0 ? (
                                            <div className="p-2 text-sm text-muted-foreground">No organizations found for this level.</div>
                                        ) : (
                                            filteredOrgs.map((org) => (
                                                <SelectItem key={org.id} value={org.id}>
                                                    {org.name}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                                <FormDescription>
                                    Select the specific organization for this role.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Assign Role
                </Button>
            </form>
        </Form>
    )
}
