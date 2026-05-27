const mysql = require('mysql2/promise');

async function main() {
    const conn = await mysql.createConnection({uri: process.env.DATABASE_URL});
    const queries = [
        "ALTER TABLE `meetings` ADD `programmeId` varchar(255);",
        "ALTER TABLE `meetings` ADD `staticAttendanceToken` varchar(255);",
        "ALTER TABLE `meetings` ADD `attendanceWindow` int DEFAULT 30;",
        "ALTER TABLE `meetings` ADD `meetingTargetAudience` enum('OFFICIALS_ONLY','ALL_MEMBERS_JURISDICTION','ALL_MEMBERS_GLOBAL') DEFAULT 'ALL_MEMBERS_JURISDICTION';",
        "ALTER TABLE `meetings` ADD `shareCode` varchar(100);",
        "ALTER TABLE `meetings` ADD `recordingShareCode` varchar(100);",
        "ALTER TABLE `meetings` ADD `egressId` varchar(255);",
        "ALTER TABLE `meetings` ADD CONSTRAINT `meetings_shareCode_unique` UNIQUE(`shareCode`);",
        "ALTER TABLE `meetings` ADD CONSTRAINT `meetings_recordingShareCode_unique` UNIQUE(`recordingShareCode`);"
    ];

    for (const query of queries) {
        try {
            await conn.query(query);
            console.log("Success:", query);
        } catch (err) {
            console.log("Skipped (probably already exists):", query, err.message);
        }
    }
    await conn.end();
}

main().catch(console.error);
