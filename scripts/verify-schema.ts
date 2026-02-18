
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Verifying schema...');

    // 1. Check if OccasionType table exists and can be queried
    try {
        const occasionTypesCount = await prisma.occasionType.count();
        console.log(`Successfully queried OccasionType table. Count: ${occasionTypesCount}`);
    } catch (error) {
        console.error('Error querying OccasionType table:', error);
    }

    // 2. Check if Official table has image field
    try {
        // We try to select the image field. If it doesn't exist, Prisma might throw or just return undefined if we don't select it explicitly but here we use findFirst
        const official = await prisma.official.findFirst({
            select: {
                id: true,
                image: true,
            },
        });
        console.log('Successfully queried Official table with image field.');
    } catch (error) {
        console.error('Error querying Official table for image field:', error);
    }

    // 3. Check if Meeting table exists
    try {
        const meetingsCount = await prisma.meeting.count();
        console.log(`Successfully queried Meeting table. Count: ${meetingsCount}`);
    } catch (error) {
        console.error('Error querying Meeting table:', error);
    }

    console.log('Verification complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
