import "dotenv/config";
import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import { payments, feeAssignments, fees } from '../lib/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

async function run() {
    const connection = await mysql.createConnection(process.env.DATABASE_URL as string);
    const db = drizzle(connection);

    try {
        const assignmentId = "c2a391dc-80f1-4703-a9cc-44132cf92e6f";
        const amount = 5000;
        const paystackRef = "T106138372582091";

        const [assignment] = await db.select({
            assignment: feeAssignments,
            fee: fees
        })
            .from(feeAssignments)
            .innerJoin(fees, eq(feeAssignments.feeId, fees.id))
            .where(eq(feeAssignments.id, assignmentId));

        if (!assignment) {
            console.error("Assignment not found");
            process.exit(1);
        }

        await db.transaction(async (tx) => {
            const paymentId = crypto.randomUUID();
            await tx.insert(payments).values({
                id: paymentId,
                userId: assignment.assignment.userId,
                organizationId: assignment.fee.organizationId,
                amount: amount.toString(),
                status: 'SUCCESS',
                paymentType: 'LEVY',
                paystackRef,
                description: `Payment for ${assignment.fee.title}`,
                paidAt: new Date(),
            });

            await tx.update(feeAssignments).set({
                status: 'PAID',
                amountPaid: amount.toString(),
                paidAt: new Date(),
                paymentId: paymentId,
            }).where(eq(feeAssignments.id, assignmentId));
        });

        // Insert into finance_transactions since the sync webhook might not catch it or we can just run the sync webhook afterwards
        
        console.log("Successfully recorded missing payment!");

    } catch(e) {
        console.error("Error inserting:", e);
    }
    await connection.end();
    process.exit(0);
}
run();
