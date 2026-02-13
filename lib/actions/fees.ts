"use server"

import { db } from "@/lib/db"
import {
    fees, feeAssignments, organizations, members, officials, users,
    feeTargetEnum, payments
} from "@/lib/db/schema"
import { eq, and, or, inArray, sql, desc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getServerSession } from "@/lib/session"
import { generateInvoicePDF, generateReceiptPDF } from "@/lib/invoice-generator"
import { sendEmail } from "@/lib/email"

const FeeSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    amount: z.number().positive("Amount must be positive"),
    targetType: z.enum(['ALL_MEMBERS', 'OFFICIALS']),
    dueDate: z.date().optional(),
})

async function getDescendantOrgIds(parentId: string): Promise<string[]> {
    const orgIds = [parentId];
    const children = await db.select({ id: organizations.id })
        .from(organizations)
        .where(eq(organizations.parentId, parentId));

    for (const child of children) {
        const descendantIds = await getDescendantOrgIds(child.id);
        orgIds.push(...descendantIds);
    }

    return orgIds;
}

export async function createFee(data: z.infer<typeof FeeSchema>, organizationId: string) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        const validData = FeeSchema.parse(data)

        const [newFee] = await db.insert(fees).values({
            organizationId,
            title: validData.title,
            description: validData.description,
            amount: validData.amount.toString(),
            targetType: validData.targetType,
            dueDate: validData.dueDate,
        }).$returningId()

        if (!newFee?.id) throw new Error("Failed to create fee")

        // Trigger assignment logic
        await assignFee(newFee.id)

        revalidatePath("/dashboard/admin/finance/fees")
        return { success: true, feeId: newFee.id }
    } catch (error: any) {
        console.error("Create Fee Error:", error)
        return { success: false, error: error.message || "Failed to create fee" }
    }
}

export async function assignFee(feeId: string) {
    try {
        const [fee] = await db.select().from(fees).where(eq(fees.id, feeId))
        if (!fee) throw new Error("Fee not found")

        const [org] = await db.select().from(organizations).where(eq(organizations.id, fee.organizationId))
        if (!org) throw new Error("Organization not found")

        // 1. Find all sub-organizations (including self)
        // For simplicity in this implementation, we'll fetch members belonging to this org or its descendants.
        // A full recursive CTE would be best, but let's start with a simpler approach for now:
        // If National, target all. If State, target all in that state.

        let targetUserIds: string[] = []

        if (fee.targetType === 'ALL_MEMBERS') {
            const memberQuery = db.select({ userId: members.userId }).from(members)

            if (org.level !== 'NATIONAL') {
                const orgIds = await getDescendantOrgIds(org.id)
                memberQuery.where(inArray(members.organizationId, orgIds))
            }

            const results = await memberQuery
            targetUserIds = results.map(r => r.userId)
        } else if (fee.targetType === 'OFFICIALS') {
            const officialQuery = db.select({ userId: officials.userId }).from(officials)

            if (org.level !== 'NATIONAL') {
                const orgIds = await getDescendantOrgIds(org.id)
                officialQuery.where(inArray(officials.organizationId, orgIds))
            }

            const results = await officialQuery
            targetUserIds = results.map(r => r.userId)
        }

        // 2. Batch insert assignments
        if (targetUserIds.length > 0) {
            const values = targetUserIds.map(uid => ({
                feeId: fee.id,
                userId: uid,
                status: 'PENDING' as const,
            }))

            // Insert in chunks to avoid blowing up DB
            const chunkSize = 100
            for (let i = 0; i < values.length; i += chunkSize) {
                await db.insert(feeAssignments).values(values.slice(i, i + chunkSize))
            }

            // 3. Send Emails with Invoices
            // Fetch user emails and org details
            const usersToEmail = await db.select({
                name: users.name,
                email: users.email,
                id: users.id
            }).from(users).where(inArray(users.id, targetUserIds))

            for (const user of usersToEmail) {
                if (user.email) {
                    const pdfBuffer = await generateInvoicePDF({
                        invoiceNumber: `INV-${fee.id.slice(0, 8)}-${user.id.slice(0, 4)}`,
                        date: new Date(),
                        dueDate: fee.dueDate || undefined,
                        organizationName: org.name,
                        organizationAddress: org.address || undefined,
                        organizationEmail: org.email || undefined,
                        memberName: user.name || "Member",
                        memberId: user.id,
                        items: [{
                            description: fee.title,
                            amount: parseFloat(fee.amount.toString())
                        }],
                        totalAmount: parseFloat(fee.amount.toString())
                    });

                    await sendEmail({
                        to: user.email,
                        subject: `New Fee Assigned: ${fee.title}`,
                        html: `<p>Dear ${user.name},</p><p>A new fee has been assigned to you. Please find the invoice attached.</p>`,
                        attachments: [{
                            filename: `invoice-${fee.id.slice(0, 8)}.pdf`,
                            content: pdfBuffer
                        }]
                    });
                }
            }
        }

        return { success: true, count: targetUserIds.length }
    } catch (error: any) {
        console.error("Assign Fee Error:", error)
        return { success: false, error: error.message }
    }
}

export async function getMemberFees(userId: string) {
    try {
        const results = await db.select({
            assignment: feeAssignments,
            fee: fees
        })
            .from(feeAssignments)
            .innerJoin(fees, eq(feeAssignments.feeId, fees.id))
            .where(eq(feeAssignments.userId, userId))
            .orderBy(sql`${fees.dueDate} ASC`)

        return results
    } catch (error) {
        console.error("Get Member Fees Error:", error)
        return []
    }
}

export async function recordFeePayment(assignmentId: string, amount: number, paystackRef: string) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        // 1. Fetch assignment and fee
        const [assignment] = await db.select({
            assignment: feeAssignments,
            fee: fees
        })
            .from(feeAssignments)
            .innerJoin(fees, eq(feeAssignments.feeId, fees.id))
            .where(eq(feeAssignments.id, assignmentId))

        if (!assignment) return { success: false, error: "Assignment not found" }

        const stipulatedAmount = parseFloat(assignment.fee.amount.toString())
        if (amount < stipulatedAmount) {
            return { success: false, error: `Minimum payment amount is NGN ${stipulatedAmount}` }
        }

        // 2. Start transaction
        await db.transaction(async (tx) => {
            // Create payment record
            const [payment] = await tx.insert(payments).values({
                userId: session.user.id,
                organizationId: assignment.fee.organizationId,
                amount: amount.toString(),
                status: 'SUCCESS',
                paymentType: 'LEVY',
                paystackRef,
                description: `Payment for ${assignment.fee.title}`,
                paidAt: new Date(),
            }).$returningId()

            // Update assignment
            await tx.update(feeAssignments).set({
                status: 'PAID',
                amountPaid: amount.toString(),
                paidAt: new Date(),
                paymentId: payment.id,
            }).where(eq(feeAssignments.id, assignmentId))
        })

        // 3. Send Receipt Email
        const user = await db.query.users.findFirst({
            where: eq(users.id, session.user.id)
        });

        const [org] = await db.select().from(organizations).where(eq(organizations.id, assignment.fee.organizationId));

        if (user?.email) {
            const receiptBuffer = await generateReceiptPDF({
                receiptNumber: `RCP-${paystackRef.slice(0, 8)}`,
                paymentMethod: "Paystack",
                paymentDate: new Date(),
                organizationName: org.name,
                organizationAddress: org.address || undefined,
                organizationEmail: org.email || undefined,
                memberName: user.name || "Member",
                memberId: user.id,
                items: [{
                    description: `Payment for ${assignment.fee.title}`,
                    amount: amount
                }],
                totalAmount: amount
            });

            await sendEmail({
                to: user.email,
                subject: `Payment Receipt: ${assignment.fee.title}`,
                html: `<p>Dear ${user.name},</p><p>Thank you for your payment. Please find your receipt attached.</p>`,
                attachments: [{
                    filename: `receipt-${paystackRef.slice(0, 8)}.pdf`,
                    content: receiptBuffer
                }]
            });
        }

        revalidatePath("/dashboard/finance")
        return { success: true }
    } catch (error: any) {
        console.error("Record Fee Payment Error:", error)
        return { success: false, error: error.message }
    }
}

export async function getOrganizationFees(organizationId: string) {
    try {
        const results = await db.select().from(fees)
            .where(eq(fees.organizationId, organizationId))
            .orderBy(desc(fees.createdAt))
        return results
    } catch (error) {
        return []
    }
}
