import mysql from 'mysql2/promise';

async function main() {
    const conn = await mysql.createConnection(process.env.DATABASE_URL);
    const userId = '42ddbb53-e487-4b9f-a167-65787afb1d54';

    // 1. Test official query from auth.ts
    const [officialProfileData] = await conn.query(
        `SELECT o.id, o.organizationId, o.positionLevel, org.state 
         FROM officials o 
         LEFT JOIN organizations org ON o.organizationId = org.id 
         WHERE o.userId = ? 
         LIMIT 1`,
        [userId]
    );
    console.log('OFFICIAL PROFILE DATA QUERY:', officialProfileData);

    // 2. Test user_roles and roles
    const [roles] = await conn.query(
        `SELECT r.jurisdictionLevel, r.code 
         FROM user_roles ur 
         JOIN roles r ON ur.roleId = r.id 
         WHERE ur.userId = ?`,
        [userId]
    );
    console.log('USER ROLES QUERY:', roles);

    // 3. Test member profile data
    const [memberProfileData] = await conn.query(
        `SELECT id, organizationId, status FROM members WHERE userId = ? LIMIT 1`,
        [userId]
    );
    console.log('MEMBER PROFILE DATA QUERY:', memberProfileData);

    await conn.end();
}

main().catch(console.error);
