
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });
dotenv.config();

async function repair() {
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    console.log('Connected.');

    try {
        // Fix navigation_items
        try {
            await connection.query('ALTER TABLE navigation_items ADD COLUMN organizationId varchar(255)');
            console.log('Added organizationId to navigation_items');
        } catch (e) {
            console.log('navigation_items.organizationId might exist or error:', e.message);
        }

        try {
            await connection.query('ALTER TABLE navigation_items ADD CONSTRAINT navigation_items_organizationId_organizations_id_fk FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE');
            console.log('Added constraint to navigation_items');
        } catch (e) {
            console.log('Constraint error:', e.message);
        }

        // Fix pages
        try {
            await connection.query('ALTER TABLE pages ADD COLUMN organizationId varchar(255)');
            console.log('Added organizationId to pages');
        } catch (e) {
            console.log('pages.organizationId might exist or error:', e.message);
        }

        try {
            await connection.query('ALTER TABLE pages ADD CONSTRAINT pages_organizationId_organizations_id_fk FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE');
            console.log('Added constraint to pages');
        } catch (e) {
            console.log('Constraint error:', e.message);
        }

        // Fix pages slug index
        try {
            await connection.query('ALTER TABLE pages DROP INDEX slug');
            console.log('Dropped old slug index');
        } catch (e) {
            console.log('Drop index error:', e.message);
        }

        try {
            await connection.query('ALTER TABLE pages ADD UNIQUE INDEX org_slug_idx (organizationId, slug)');
            console.log('Added composite index to pages');
        } catch (e) {
            console.log('Index error:', e.message);
        }

    } catch (error) {
        console.error('Connection error:', error);
    } finally {
        await connection.end();
    }
}

repair();
