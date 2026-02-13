
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
dotenv.config();

module.exports = {
    schema: './lib/db/schema.ts',
    out: './drizzle',
    dialect: 'mysql',
    dbCredentials: {
        url: process.env.DATABASE_URL,
    },
};
