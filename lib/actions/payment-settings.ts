"use server"

import { db } from "@/lib/db"
import { organizations } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { createPaystackSubaccount, listBanks } from "@/lib/payments"
import { getServerSession } from "@/lib/session"

export async function getBanks() {
    return await listBanks()
}

export async function updateOrganizationBankDetails(
    orgId: string,
    data: {
        bankName: string
        bankCode: string
        accountNumber: string
    }
) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        // Optional: Check if user is superadmin
        // For now, we trust the caller is superadmin as per UI restriction

        await db.update(organizations)
            .set({
                bankName: data.bankName,
                bankCode: data.bankCode,
                accountNumber: data.accountNumber,
            })
            .where(eq(organizations.id, orgId))

        revalidatePath("/dashboard/admin/settings/payments")
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function syncSubaccount(orgId: string) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        const org = await db.query.organizations.findFirst({
            where: eq(organizations.id, orgId)
        })

        if (!org || !org.bankCode || !org.accountNumber) {
            return { success: false, error: "Incomplete bank details" }
        }

        const result = await createPaystackSubaccount({
            business_name: org.name,
            settlement_bank: org.bankCode,
            account_number: org.accountNumber,
            percentage_charge: 0, // Admin can adjust this if needed
            description: `Subaccount for ${org.name}`
        })

        if (result.success) {
            await db.update(organizations)
                .set({
                    paystackSubaccountCode: result.data.subaccount_code
                })
                .where(eq(organizations.id, orgId))

            revalidatePath("/dashboard/admin/settings/payments")
            return { success: true, subaccountCode: result.data.subaccount_code }
        }

        return { success: false, error: result.error }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
