import "dotenv/config";
import mysql from 'mysql2/promise';

const missingProgrammesCols = [
    { name: 'format', type: "VARCHAR(255) DEFAULT 'PHYSICAL'" },
    { name: 'meetingUrl', type: "VARCHAR(500)" },
    { name: 'frequency', type: "VARCHAR(255) DEFAULT 'ONCE'" },
    { name: 'objectives', type: "TEXT" },
    { name: 'budget', type: "DECIMAL(15,2) DEFAULT '0.00'" },
    { name: 'committee', type: "VARCHAR(255)" },
    { name: 'additionalInfo', type: "TEXT" },
    { name: 'rruleString', type: "VARCHAR(500)" },
    { name: 'isLateSubmission', type: "BOOLEAN DEFAULT FALSE" },
    { name: 'paymentRequired', type: "BOOLEAN DEFAULT FALSE" },
    { name: 'allowInstallments', type: "BOOLEAN DEFAULT FALSE" },
    { name: 'minInstallmentAmount', type: "DECIMAL(10,2) DEFAULT '0.00'" },
    { name: 'hasCertificate', type: "BOOLEAN DEFAULT FALSE" },
    { name: 'certTemplateType', type: "VARCHAR(255) DEFAULT 'DEFAULT'" },
    { name: 'certTmcSignature', type: "VARCHAR(500)" },
    { name: 'certTmcSignatory', type: "VARCHAR(255)" },
    { name: 'certPartnerName', type: "VARCHAR(255)" },
    { name: 'certPartnerLogo', type: "VARCHAR(500)" },
    { name: 'certPartnerSignature', type: "VARCHAR(500)" },
    { name: 'certPartnerSignatory', type: "VARCHAR(255)" },
    { name: 'rejectionReason', type: "TEXT" },
    { name: 'staticAttendanceToken', type: "VARCHAR(255)" },
    { name: 'attendanceWindow', type: "INT DEFAULT 30" },
    { name: 'waiverCode', type: "VARCHAR(100)" },
    { name: 'feedbackFields', type: "JSON" },
];

const missingRegCols = [
    { name: 'certificateUrl', type: "VARCHAR(500)" },
    { name: 'certificateIssuedAt', type: "DATETIME(3)" },
    { name: 'country', type: "VARCHAR(255)" },
    { name: 'state', type: "VARCHAR(255)" },
    { name: 'lga', type: "VARCHAR(255)" },
    { name: 'branch', type: "VARCHAR(255)" },
    { name: 'checkInTime', type: "DATETIME(3)" },
    { name: 'checkOutTime', type: "DATETIME(3)" },
    { name: 'checkInBy', type: "VARCHAR(255)" },
    { name: 'checkOutBy', type: "VARCHAR(255)" },
    { name: 'checkInWaiver', type: "BOOLEAN DEFAULT FALSE" }
];

async function run() {
    try {
        const connection = await mysql.createConnection(process.env.DATABASE_URL as string);
        const dbName = process.env.DATABASE_URL?.split('/').pop()?.split('?')[0];

        // Process programmes
        const [progCols] = await connection.execute<any>(`SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'programmes'`, [dbName]);
        const progExisting = new Set(progCols.map((r: any) => r.COLUMN_NAME));

        for (const col of missingProgrammesCols) {
            if (!progExisting.has(col.name)) {
                console.log(`Adding ${col.name} to programmes...`);
                await connection.execute(`ALTER TABLE programmes ADD COLUMN ${col.name} ${col.type}`);
            }
        }

        // Process programme_registrations
        const [regCols] = await connection.execute<any>(`SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'programme_registrations'`, [dbName]);
        const regExisting = new Set(regCols.map((r: any) => r.COLUMN_NAME));

        for (const col of missingRegCols) {
            if (!regExisting.has(col.name)) {
                console.log(`Adding ${col.name} to programme_registrations...`);
                await connection.execute(`ALTER TABLE programme_registrations ADD COLUMN ${col.name} ${col.type}`);
            }
        }

        await connection.end();
        console.log("All missing columns added successfully.");
    } catch (err: any) {
        console.error("Migration error:", err);
    }
    process.exit(0);
}
run();
