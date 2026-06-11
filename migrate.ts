import { migrate } from 'drizzle-orm/mysql2/migrator';
import { db } from './lib/db';
migrate(db, { migrationsFolder: './drizzle' }).then(() => {
  console.log('Complete');
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
