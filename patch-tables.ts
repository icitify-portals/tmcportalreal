import { db } from './lib/db';

async function main() {
    try {
        await db.execute('ALTER TABLE offices ADD COLUMN managedSpecialCategories json DEFAULT NULL;');
        console.log('Added managedSpecialCategories to offices table');
    } catch (e: any) {
        console.error('Failed to add column:', e.message);
    }
}

main().catch(console.error);
