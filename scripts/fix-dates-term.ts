
import { execSync } from 'child_process';

const url = process.env.DATABASE_URL;

if (!url) {
    console.error("DATABASE_URL missing");
    process.exit(1);
}

try {
    const u = new URL(url);
    const host = u.hostname;
    const user = u.username;
    const pass = u.password;
    const db = u.pathname.substring(1);
    const port = u.port || '3306';

    const tables = ['system_settings', 'users', 'jurisdiction_codes', 'member_id_sequences', 'members', 'organizations'];

    for (const table of tables) {
        try {
            console.log(`Fixing ${table}...`);
            const query = `UPDATE ${table} SET updatedAt = NOW() WHERE CAST(updatedAt AS CHAR) LIKE '0000%' OR updatedAt IS NULL`;

            // Use env for password to avoid shell escaping issues
            const cmd = `mysql -h ${host} -P ${port} -u ${user} ${db} -e "${query}"`;

            execSync(cmd, {
                stdio: 'inherit',
                env: { ...process.env, MYSQL_PWD: pass }
            });
            console.log(`Success ${table}`);
        } catch (e: any) {
            // Ignore if table doesn't exist or other error
            console.log(`Failed/Skipped ${table}: (Error code ${e.status})`);
        }
    }
} catch (e) {
    console.error(e);
}
