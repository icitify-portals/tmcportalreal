import { createPool } from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local' });

import fs from 'fs';
const log = (msg: any, ...args: any[]) => {
    console.log(msg, ...args);
    fs.appendFileSync('db-debug.log', [msg, ...args].join(' ') + '\n');
};

async function checkConnection() {
    log("Checking database connection...");
    // const url = process.env.DATABASE_URL;
    const url = "mysql://root@localhost:3306/";
    log("Connecting to base MySQL to create DB...");

    try {
        const pool = createPool({ uri: url });
        await pool.query('CREATE DATABASE IF NOT EXISTS tmcportal');
        log("Database 'tmcportal' created or already exists.");
        await pool.end();
    } catch (error) {
        log("Failed to create DB:", error);
    }
}

checkConnection();
