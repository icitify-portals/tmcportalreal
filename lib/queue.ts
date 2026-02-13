import { Queue } from 'bullmq';
import { connection } from './redis';

export const emailQueue = new Queue('email-queue', { connection });
export const notificationQueue = new Queue('notification-queue', { connection });

export type EmailJobData = {
    to: string;
    subject: string;
    html: string;
    text?: string;
};

export type NotificationJobData = {
    userId: string;
    message: string;
    type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
};
