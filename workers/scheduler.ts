import cron from 'node-cron';
import { db } from '@/lib/db';
import { programmes, users, organizations, notifications, reports, offices, officials } from '@/lib/db/schema';
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

    // Schedule: Monthly office report reminder — 1st of month 09:00
    cron.schedule('0 9 1 * *', async () => {
        console.log('Running Monthly Office Report Reminders...');
        await processMonthlyOfficeReportReminders();
    });

    // Also check on 5th: nudge missing reports
    cron.schedule('0 9 5 * *', async () => {
        console.log('Running Monthly Office Report Nudge (missing)...');
        await processMonthlyOfficeReportReminders(true);
    });
}

async function processWeeklyNotifications() {
    try {
        const now = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(now.getDate() + 7);

        // 1. Fetch Approved Programmes for the upcoming week (with organizing level)
        const upcomingProgrammes = await db.select({
            id: programmes.id,
            title: programmes.title,
            venue: programmes.venue,
            startDate: programmes.startDate,
            organizationId: programmes.organizationId,
            orgName: organizations.name,
            level: programmes.level,
            createdBy: programmes.createdBy,
            status: programmes.status,
            paymentRequired: programmes.paymentRequired,
            amount: programmes.amount,
            time: programmes.time,
        })
            .from(programmes)
            .leftJoin(organizations, eq(programmes.organizationId, organizations.id))
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
                const lvlForEmail = (prog as any).level ? String((prog as any).level).replace(/_/g, " ") : "GENERAL";
                const orgForEmail = (prog as any).orgName ? `${(prog as any).orgName} (${lvlForEmail})` : lvlForEmail;
                const titledWithLevel = `${prog.title} — ${orgForEmail}`;
                const template = emailTemplates.officerReminder(
                    creator.name || 'Officer',
                    titledWithLevel,
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

                // Add to In-App Notifications — include organizing level to avoid confusion
                const levelLabelW = (prog.level ? String(prog.level).replace(/_/g, " ") : "GENERAL");
                const orgLabelW = prog.orgName ? `${prog.orgName} (${levelLabelW})` : levelLabelW;
                await db.insert(notifications).values({
                    userId: prog.createdBy,
                    title: `Programme Reminder [${levelLabelW}]`,
                    message: `Reminder: "${prog.title}" organized by ${orgLabelW} is coming up on ${prog.startDate.toDateString()} at ${prog.venue || "TBD"}.`,
                    type: "INFO",
                    actionUrl: "/dashboard/programmes",
                    createdAt: new Date(),
                    updatedAt: new Date()
                });

                console.log(`Queued reminder for officer: ${creator.email}`);
            }
        }

        // 3. Weekly Digest for All Users
        // Prepare digest data — include organizing level to avoid confusion
        const digestEvents = upcomingProgrammes.map(p => {
            const lvl = (p as any).level ? String((p as any).level).replace(/_/g, " ") : "";
            const org = (p as any).orgName || "";
            const suffix = org ? ` — ${org} (${lvl})` : (lvl ? ` [${lvl}]` : "");
            return {
                title: `${p.title}${suffix}`,
                date: p.startDate.toDateString() + (p.time ? ` at ${p.time}` : ''),
                venue: p.venue
            };
        });

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

            // Fetch Programmes with organizing level
            const upcomingProgrammes = await db.select({
                id: programmes.id,
                title: programmes.title,
                venue: programmes.venue,
                startDate: programmes.startDate,
                level: programmes.level,
                orgName: organizations.name,
            })
                .from(programmes)
                .leftJoin(organizations, eq(programmes.organizationId, organizations.id))
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
                        const lvl = (prog as any).level ? String((prog as any).level).replace(/_/g, " ") : "GENERAL";
                        const orgNm = (prog as any).orgName || "";
                        const orgLbl = orgNm ? `${orgNm} (${lvl})` : lvl;
                        // Queue Email — include organizing level
                        await emailQueue.add('event-reminder', {
                            to: user.email,
                            subject: `[${lvl}] Reminder: ${prog.title} is ${daysAway} day${daysAway > 1 ? 's' : ''} away!`,
                            html: `
                                <h2>Event Reminder [${lvl}]</h2>
                                <p>Dear ${user.name || 'Member'},</p>
                                <p>This is a continuous reminder that <strong>${prog.title}</strong> organized by <strong>${orgLbl}</strong> is happening in ${daysAway} day${daysAway > 1 ? 's' : ''} on ${prog.startDate.toDateString()}.</p>
                                <p><strong>Venue:</strong> ${prog.venue || 'Online'}</p>
                                <p>Looking forward to seeing you there!</p>
                            `,
                            text: `Reminder [${lvl}]: ${prog.title} organized by ${orgLbl} is happening in ${daysAway} day(s) on ${prog.startDate.toDateString()}. Venue: ${prog.venue || 'Online'}`
                        });

                        // Add In-App Notification — include level
                        await db.insert(notifications).values({
                            userId: reg.userId,
                            title: `Event Approaching! [${lvl}]`,
                            message: `"${prog.title}" organized by ${orgLbl} is happening in ${daysAway} day(s) on ${prog.startDate.toDateString()}!`,
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

async function processMonthlyOfficeReportReminders(nudgeMissing = false) {
    try {
        const now = new Date();
        const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const period = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth()+1).padStart(2,'0')}`;
        const currentPeriod = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
        const targetPeriod = nudgeMissing ? period : currentPeriod;

        const allOffices = await db.select({ id: offices.id, name: offices.name, organizationId: offices.organizationId }).from(offices);
        const allOfficials = await db.select({ userId: officials.userId, officeId: officials.officeId }).from(officials).where(sql`${officials.officeId} IS NOT NULL`);

        for (const off of allOffices) {
            const officeOfficials = allOfficials.filter(o => o.officeId === off.id);
            if (officeOfficials.length === 0) continue;

            if (nudgeMissing) {
                const [existing] = await db.select({ id: reports.id }).from(reports).where(and(
                    eq(reports.officeId, off.id),
                    eq(reports.period, targetPeriod),
                    eq(reports.type, 'MONTHLY_ACTIVITY')
                )).limit(1);
                if (existing) continue; // already submitted, no nudge
            }

            for (const oo of officeOfficials) {
                const user = await db.query.users.findFirst({ where: eq(users.id, oo.userId), columns: { email: true, name: true } });
                if (!user?.email) continue;
                const subject = nudgeMissing
                    ? `Action Required: Monthly report missing for ${off.name} — ${targetPeriod}`
                    : `Reminder: Submit monthly report for ${off.name} — ${targetPeriod}`;
                const html = nudgeMissing
                    ? `<p>Dear ${user.name || 'Officer'},</p><p>Your office <b>${off.name}</b> has not yet submitted its monthly activity report for <b>${targetPeriod}</b> to executives at your jurisdiction. Please submit via portal: <a href="/dashboard/admin/reports?period=${targetPeriod}">Submit Report</a></p>`
                    : `<p>Dear ${user.name || 'Officer'},</p><p>Please submit your office <b>${off.name}</b> monthly report for <b>${targetPeriod}</b> by the 5th.</p>`;
                await emailQueue.add('office-monthly-reminder', { to: user.email, subject, html, text: subject });
                await db.insert(notifications).values({
                    userId: oo.userId,
                    title: nudgeMissing ? "Monthly Report Missing" : "Monthly Report Due",
                    message: subject,
                    type: nudgeMissing ? "WARNING" : "INFO",
                    actionUrl: `/dashboard/admin/reports?period=${targetPeriod}`,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }
        }
        console.log(`Monthly office report reminders processed for ${targetPeriod} (nudge=${nudgeMissing})`);
    } catch (e) {
        console.error('Monthly office reminder error', e);
    }
}
