import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Shared connection for BullMQ
export const connection = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null, // Required for BullMQ
});
