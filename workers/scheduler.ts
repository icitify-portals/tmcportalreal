import cron from 'node-cron';
import { db } from '@/lib/db';
import { programmes, users, organizations, notifications } from '@/lib/db/schema';
import { and, eq, gte, lte, sql } from 'drizzle-orm';
import { emailQueue } from '@/lib/queue';
import { emailTemplates } from '@/lib/email';

// Schedule: Every Monday at 8:00 AM
// Cron syntax: 0 8 * * 1
const SCHEDULE_EXPRESSION = '0 8 * * 1';

export function startScheduler() {
    console.log(`Resource Scheduler initiated. Schedule: ${SCHEDULE_EXPRESSION}`);

    cron.schedule(SCHEDULE_EXPRESSION, async () => {
        console.log('Running Weekly Programme Scheduler...');
        await processWeeklyNotifications();
    });
}

async function processWeeklyNotifications() {
    try {
        const now = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(now.getDate() + 7);

        // 1. Fetch Approved Programmes for the upcoming week
        const upcomingProgrammes = await db.select({
            id: programmes.id,
            title: programmes.title,
            venue: programmes.venue,
            startDate: programmes.startDate,
            organizationId: programmes.organizationId,
            createdBy: programmes.createdBy,
            status: programmes.status,
            paymentRequired: programmes.paymentRequired,
            amount: programmes.amount,
            time: programmes.time,
        })
            .from(programmes)
            .where(
                and(
                    eq(programmes.status, 'APPROVED'),
                    gte(programmes.startDate, now),
                    lte(programmes.startDate, nextWeek)
                )
            );

        if (upcomingProgrammes.length === 0) {
            console.log('No upcoming programmes found for this week.');
            return;
        }

        console.log(`Found ${upcomingProgrammes.length} upcoming programmes.`);

        // 2. Notify Officers (Creators of the programmes)
        for (const prog of upcomingProgrammes) {
            // Fetch creator details
            const creator = await db.query.users.findFirst({
                where: eq(users.id, prog.createdBy),
                columns: {
                    name: true,
                    email: true
                }
            });

            if (creator && creator.email) {
                const template = emailTemplates.officerReminder(
                    creator.name || 'Officer',
                    prog.title,
                    prog.startDate.toDateString(),
                    prog.status || 'APPROVED'
                );


                // Add to email queue
                await emailQueue.add('officer-reminder', {
                    to: creator.email,
                    subject: template.subject,
                    html: template.html,
                    text: template.text
                });

                // Add to In-App Notifications
                await db.insert(notifications).values({
                    userId: prog.createdBy,
                    title: "Programme Reminder",
                    message: `Reminder: ${prog.title} is coming up on ${prog.startDate.toDateString()}.`,
                    type: "INFO",
                    actionUrl: "/dashboard/programmes"
                });

                console.log(`Queued reminder for officer: ${creator.email}`);
            }
        }

        // 3. Weekly Digest for All Users
        // Prepare digest data
        const digestEvents = upcomingProgrammes.map(p => ({
            title: p.title,
            date: p.startDate.toDateString() + (p.time ? ` at ${p.time}` : ''),
            venue: p.venue
        }));

        // Fetch all active users (batching might be needed for thousands, keeping simple for now)
        const allUsers = await db.select({
            id: users.id,
            email: users.email,
            name: users.name
        }).from(users);

        console.log(`Queueing Weekly Digest for ${allUsers.length} users...`);

        for (const user of allUsers) {
            if (!user.email) continue;

            const template = emailTemplates.weeklyDigest(
                user.name || 'Member',
                digestEvents
            );

            await emailQueue.add('weekly-digest', {
                to: user.email,
                subject: template.subject,
                html: template.html,
                text: template.text
            }, {
                removeOnComplete: true,
                removeOnFail: true, // Keep queue clean
                attempts: 3
            });

            // Add to In-App Notifications
            await db.insert(notifications).values({
                userId: user.id,
                title: "Weekly Programme Digest",
                message: `There are ${digestEvents.length} upcoming events this week. Check them out!`,
                type: "INFO",
                actionUrl: "/programmes"
            });
        }

        console.log('Weekly Notification processing complete.');

    } catch (error) {
        console.error('Error in Weekly Scheduler:', error);
    }
}
