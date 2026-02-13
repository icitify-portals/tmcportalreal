import { Worker } from 'bullmq';
import { connection } from '../lib/redis';
import { sendEmail } from '../lib/email'; // Assuming this exists or will be created
import { EmailJobData } from '../lib/queue';

const worker = new Worker<EmailJobData>('email-queue', async (job) => {
    console.log(`Processing email job ${job.id} to ${job.data.to}`);
    try {
        await sendEmail({
            to: job.data.to,
            subject: job.data.subject,
            html: job.data.html,
            text: job.data.text
        });
        console.log(`Email sent to ${job.data.to}`);
    } catch (error) {
        console.error(`Failed to send email to ${job.data.to}:`, error);
        throw error;
    }
}, { connection });

console.log('Worker started for email-queue');

// Graceful shutdown
process.on('SIGTERM', async () => {
    await worker.close();
});
