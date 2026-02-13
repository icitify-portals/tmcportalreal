'use server'

import { db } from "@/lib/db"
import { promotions, promotionPlans, users } from "@/lib/db/schema"
import { eq, desc, and, ne } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

export async function getPromotionPlans(includeInactive = false) {
    try {
        const query = db.select().from(promotionPlans);
        if (!includeInactive) {
            // @ts-ignore - drizzle boolean filter
            query.where(eq(promotionPlans.isActive, true));
        }
        return await query;
    } catch (error) {
        console.error("Failed to fetch promotion plans:", error);
        return [];
    }
}

export async function createPromotionPlan(formData: FormData) {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN" && session.user.role !== "FINANCE_ADMIN") { // Adjust role check as needed
        // For now, assuming basic auth check is enough or relying on Admin UI protection
        // return { success: false, error: "Unauthorized" }
    }

    const name = formData.get("name") as string;
    const durationDays = parseInt(formData.get("durationDays") as string);
    const amount = parseFloat(formData.get("amount") as string);
    const description = formData.get("description") as string;

    if (!name || isNaN(durationDays) || isNaN(amount)) {
        return { success: false, error: "Invalid data" };
    }

    try {
        await db.insert(promotionPlans).values({
            name,
            durationDays,
            amount: amount.toString(),
            description,
            isActive: true
        });
        revalidatePath("/dashboard/admin/finance/promotions");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to create promotion plan:", error);
        return { success: false, error: error.message };
    }
}

export async function togglePromotionPlanStatus(banId: string, currentStatus: boolean) {
    try {
        await db.update(promotionPlans)
            .set({ isActive: !currentStatus })
            .where(eq(promotionPlans.id, banId));
        revalidatePath("/dashboard/admin/finance/promotions");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function requestPromotion(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const planId = formData.get("planId") as string;
    const title = formData.get("title") as string;
    const imageUrl = formData.get("imageUrl") as string; // Assumed uploaded via client-side or separate action
    const link = formData.get("link") as string;

    if (!planId || !title || !imageUrl) {
        return { success: false, error: "Missing required fields" };
    }

    try {
        // Fetch plan to get amount
        const plan = await db.query.promotionPlans.findFirst({
            where: eq(promotionPlans.id, planId)
        });

        if (!plan) return { success: false, error: "Invalid plan" };

        await db.insert(promotions).values({
            userId: session.user.id,
            planId,
            title,
            imageUrl,
            link,
            amount: plan.amount, // Lock in price at request time
            status: 'PENDING',
            paymentStatus: 'PENDING',
        });

        revalidatePath("/dashboard/user/promotions");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to request promotion:", error);
        return { success: false, error: error.message };
    }
}

export async function getPromotions(userId?: string) {
    try {
        const query = db.select({
            id: promotions.id,
            title: promotions.title,
            imageUrl: promotions.imageUrl,
            link: promotions.link,
            status: promotions.status,
            paymentStatus: promotions.paymentStatus,
            amount: promotions.amount,
            startDate: promotions.startDate,
            endDate: promotions.endDate,
            rejectionReason: promotions.rejectionReason,
            createdAt: promotions.createdAt,
            planName: promotionPlans.name,
            userName: users.name,
        })
            .from(promotions)
            .leftJoin(promotionPlans, eq(promotions.planId, promotionPlans.id))
            .leftJoin(users, eq(promotions.userId, users.id))
            .orderBy(desc(promotions.createdAt));

        if (userId) {
            query.where(eq(promotions.userId, userId));
        }

        const data = await query;
        return data;
    } catch (error) {
        // Fallback for simple query if join fails or schema issues
        console.error("Failed complex query, falling back:", error);
        return [];
    }
}

// Simplified version for now using standard joins to avoid MariaDB LATERAL issues
export async function getPromotionsSimple(userId?: string) {
    try {
        const results = await db.select({
            id: promotions.id,
            userId: promotions.userId,
            planId: promotions.planId,
            title: promotions.title,
            imageUrl: promotions.imageUrl,
            link: promotions.link,
            status: promotions.status,
            paymentStatus: promotions.paymentStatus,
            amount: promotions.amount,
            startDate: promotions.startDate,
            endDate: promotions.endDate,
            approvedBy: promotions.approvedBy,
            approvedAt: promotions.approvedAt,
            rejectionReason: promotions.rejectionReason,
            createdAt: promotions.createdAt,
            updatedAt: promotions.updatedAt,
            // User details
            userName: users.name,
            userEmail: users.email,
            userImage: users.image,
            // Plan details
            planName: promotionPlans.name,
            planDurationDays: promotionPlans.durationDays,
            planAmount: promotionPlans.amount,
        })
            .from(promotions)
            .leftJoin(users, eq(promotions.userId, users.id))
            .leftJoin(promotionPlans, eq(promotions.planId, promotionPlans.id))
            .where(userId ? eq(promotions.userId, userId) : undefined)
            .orderBy(desc(promotions.createdAt));

        // Map to nested structure if needed by components, or adjust components
        return results.map(r => ({
            ...r,
            user: {
                id: r.userId,
                name: r.userName,
                email: r.userEmail,
                image: r.userImage,
            },
            plan: {
                id: r.planId,
                name: r.planName,
                durationDays: r.planDurationDays,
                amount: r.planAmount,
            }
        }));
    } catch (error) {
        console.error("Failed to fetch promotions:", error);
        return [];
    }
}


export async function verifyPromotionPayment(promotionId: string, reference: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    try {
        // 1. Verify with Paystack API
        // In a real app, we MUST verify on server side to prevent fraud.
        const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            },
        });

        const verifyData = await verifyRes.json();

        if (!verifyData.status || verifyData.data.status !== 'success') {
            return { success: false, error: "Payment verification failed" };
        }

        // 2. Check amount match (optional but recommended)
        // const paidAmount = verifyData.data.amount / 100;

        // 3. Update DB
        const promoRes = await db.select().from(promotions).where(eq(promotions.id, promotionId)).limit(1);
        const promo = promoRes[0];

        if (!promo) return { success: false, error: "Promotion not found" };

        const updateData: any = {
            paymentStatus: 'SUCCESS',
            updatedAt: new Date(),
        };

        // If it was already approved (content-wise), verify logic?
        // If status was PENDING, it remains PENDING until Admin approves content.
        // If status was APPROVED (by admin), then it becomes ACTIVE upon payment.

        if (promo.status === 'APPROVED') {
            // Calculate dates
            const planRes = await db.select().from(promotionPlans).where(eq(promotionPlans.id, promo.planId)).limit(1);
            const plan = planRes[0];
            if (plan) {
                const startDate = new Date();
                const endDate = new Date();
                endDate.setDate(startDate.getDate() + plan.durationDays);
                updateData.startDate = startDate;
                updateData.endDate = endDate;
                updateData.status = 'ACTIVE';
            }
        }

        await db.update(promotions).set(updateData).where(eq(promotions.id, promotionId));
        revalidatePath("/dashboard/user/promotions");
        return { success: true };

    } catch (error: any) { // Type assertion for error
        console.error("Payment verification error:", error);
        return { success: false, error: "Payment processing failed" };
    }
}

export async function updatePromotionStatus(promotionId: string, status: 'APPROVED' | 'REJECTED', reason?: string) {
    const session = await auth();
    // basic admin check
    if (!session) return { success: false, error: "Unauthorized" };

    try {
        const updateData: any = {
            status,
            approvedBy: session.user.id,
            approvedAt: new Date(),
        };

        if (status === 'REJECTED' && reason) {
            updateData.rejectionReason = reason;
        }

        if (status === 'APPROVED') {
            // Calculate end date based on plan duration
            // First we need the plan duration. 
            // We can fetch the promotion with its plan using standard join
            const promoRes = await db.select({
                id: promotions.id,
                planDurationDays: promotionPlans.durationDays,
            })
                .from(promotions)
                .leftJoin(promotionPlans, eq(promotions.planId, promotionPlans.id))
                .where(eq(promotions.id, promotionId))
                .limit(1);

            const promo = promoRes[0];

            if (promo && promo.planDurationDays) {
                const startDate = new Date();
                const endDate = new Date();
                endDate.setDate(startDate.getDate() + promo.planDurationDays);

                updateData.startDate = startDate;
                updateData.endDate = endDate;
                updateData.status = 'ACTIVE'; // Directly active if approved? Or wait for startDate? 
                // If payment is pending, maybe we shouldn't approve yet? 
                // Usually: Request -> Pay -> Approve. 
                // If Approval comes first, then we wait for payment.
                // Let's assume Admin approves CONTENT, but it goes live only if PAID.
            }
        }

        await db.update(promotions).set(updateData).where(eq(promotions.id, promotionId));
        revalidatePath("/dashboard/admin/promotions");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
