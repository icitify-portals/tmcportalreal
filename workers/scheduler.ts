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

    // Schedule: Every Day at 9:00 AM for Continuous Reminders (3 days out)
    cron.schedule('0 9 * * *', async () => {
        console.log('Running Daily Event Reminders...');
        await processDailyContinuousReminders();
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
                    actionUrl: "/dashboard/programmes",
                    createdAt: new Date(),
                    updatedAt: new Date()
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
                actionUrl: "/programmes",
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }

        console.log('Weekly Notification processing complete.');

    } catch (error) {
        console.error('Error in Weekly Scheduler:', error);
    }
}

async function processDailyContinuousReminders() {
    try {
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Start of today

        // Calculate thresholds: 1, 2, and 3 days from now
        const daysToCheck = [1, 2, 3];

        for (const daysAway of daysToCheck) {
            const targetDateStart = new Date(now);
            targetDateStart.setDate(now.getDate() + daysAway);
            const targetDateEnd = new Date(targetDateStart);
            targetDateEnd.setHours(23, 59, 59, 999);

            // Fetch Programmes
            const upcomingProgrammes = await db.select()
                .from(programmes)
                .where(
                    and(
                        eq(programmes.status, 'APPROVED'),
                        gte(programmes.startDate, targetDateStart),
                        lte(programmes.startDate, targetDateEnd)
                    )
                );

            for (const prog of upcomingProgrammes) {
                // Get all registered users
                const { programmeRegistrations } = await import('@/lib/db/schema');
                const registrations = await db.select({
                    userId: programmeRegistrations.userId,
                }).from(programmeRegistrations).where(eq(programmeRegistrations.programmeId, prog.id));

                for (const reg of registrations) {
                    if (!reg.userId) continue;
                    
                    const user = await db.query.users.findFirst({
                        where: eq(users.id, reg.userId),
                        columns: { email: true, name: true }
                    });

                    if (user && user.email) {
                        // Queue Email
                        await emailQueue.add('event-reminder', {
                            to: user.email,
                            subject: `Reminder: ${prog.title} is ${daysAway} day${daysAway > 1 ? 's' : ''} away!`,
                            html: `
                                <h2>Event Reminder</h2>
                                <p>Dear ${user.name || 'Member'},</p>
                                <p>This is a continuous reminder that <strong>${prog.title}</strong> is happening in ${daysAway} day${daysAway > 1 ? 's' : ''} on ${prog.startDate.toDateString()}.</p>
                                <p><strong>Venue:</strong> ${prog.venue || 'Online'}</p>
                                <p>Looking forward to seeing you there!</p>
                            `,
                            text: `Reminder: ${prog.title} is happening in ${daysAway} day(s) on ${prog.startDate.toDateString()}. Venue: ${prog.venue || 'Online'}`
                        });

                        // Add In-App Notification
                        await db.insert(notifications).values({
                            userId: reg.userId,
                            title: "Event Approaching!",
                            message: `${prog.title} is happening in ${daysAway} day(s)!`,
                            type: "INFO",
                            actionUrl: `/programmes`,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        });
                    }
                }
            }

            // Could do the same for meetings if required
        }
        console.log('Daily Continuous Reminders processed successfully.');
    } catch (err) {
        console.error('Error processing daily continuous reminders:', err);
    }
}
