const mysql = require('/app/node_modules/mysql2/promise');

(async () => {
    const url = process.env.DATABASE_URL;
    if (!url) {
        console.error('DATABASE_URL not set');
        process.exit(1);
    }
    const db = await mysql.createConnection(url);

    // Create table if not exists
    await db.execute(`
    CREATE TABLE IF NOT EXISTS \`organs\` (
      \`id\` varchar(255) NOT NULL,
      \`name\` varchar(255) NOT NULL,
      \`description\` text,
      \`websiteUrl\` varchar(500),
      \`logoUrl\` varchar(500),
      \`category\` varchar(100),
      \`order\` int DEFAULT 0,
      \`isActive\` tinyint(1) DEFAULT 1,
      \`createdAt\` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
      \`updatedAt\` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`)
    )
  `);
    console.log('Table ready');

    const [[row]] = await db.execute('SELECT COUNT(*) as count FROM `organs`');
    const count = row.count;
    console.log('Existing rows:', count);

    if (count === 0) {
        const organs = [
            ['Al-Barakah Microfinance Bank', 'A leading microfinance bank providing ethical and accessible financial services.', 'https://albarakahmfb.com/', null, 'Finance', 1],
            ['Zakat and Sadaqat Foundation', 'An organization dedicated to the collection and distribution of Zakat and Sadaqat to empower the needy.', 'https://zakatandsadaqat.org.ng/', null, 'Humanitarian', 2],
            ['Human Concern Foundation International', 'A non-governmental organization focused on humanitarian aid and sustainable development projects.', 'https://hcfing.org', null, 'Humanitarian', 3],
            ['Centre for Global Peace Initiative', 'An initiative committed to promoting peace, dialogue, and understanding across communities.', 'https://cgpi.org.ng', null, 'Peace & Dialogue', 4],
            ['Hajj Mabrur', 'Providing comprehensive services for Hajj and Umrah pilgrims to ensure a blessed journey.', 'https://www.hajjmabrurumrah.com', null, 'Pilgrimage', 5],
            ['Halal Certification Authority', 'The official body for Halal certification, ensuring products and services meet Islamic standards.', 'https://halalcert.com.ng', null, 'Certification', 6],
            ['Al-Khair Foods', 'Provider of quality and wholesome Halal food products.', null, null, 'Food & Nutrition', 7],
        ];

        for (const [name, description, websiteUrl, logoUrl, category, order] of organs) {
            const id = require('crypto').randomUUID();
            await db.execute(
                'INSERT INTO `organs` (`id`, `name`, `description`, `websiteUrl`, `logoUrl`, `category`, `order`, `isActive`) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
                [id, name, description, websiteUrl, logoUrl, category, order]
            );
            console.log('Inserted:', name);
        }
        console.log('Seeded 7 organs.');
    } else {
        console.log('Already seeded, skipping.');
    }

    await db.end();
    process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
