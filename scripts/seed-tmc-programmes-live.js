const mysql = require('/app/node_modules/mysql2/promise');

(async () => {
    const url = process.env.DATABASE_URL;
    if (!url) { console.error('DATABASE_URL not set'); process.exit(1); }
    const db = await mysql.createConnection(url);

    // Create table if not exists
    await db.execute(`
    CREATE TABLE IF NOT EXISTS \`tmc_programmes\` (
      \`id\` varchar(255) NOT NULL,
      \`title\` varchar(255) NOT NULL,
      \`description\` text,
      \`iconName\` varchar(100),
      \`category\` varchar(100),
      \`order\` int DEFAULT 0,
      \`isActive\` tinyint(1) DEFAULT 1,
      \`createdAt\` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
      \`updatedAt\` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`)
    )
  `);
    console.log('Table ready');

    const [[row]] = await db.execute('SELECT COUNT(*) as count FROM `tmc_programmes`');
    if (row.count > 0) {
        console.log(`Already seeded (${row.count} rows). Skipping.`);
        await db.end();
        process.exit(0);
    }

    const programmes = [
        ['ADHKAR', 'A programme of remembrance and supplication to Allah. People are taught the art of supplication in line with the Qur\'an and Sunnah.', 'Moon', 'Spiritual', 1],
        ['TAZKIYYAH', 'Designed to reform the soul by tackling perverted thoughts and knowledge. Features weekly lectures on Tafsir, Fiqh, Islamic History, etc., across Nigeria.', 'BookOpen', 'Spiritual', 2],
        ['ISLAMIC TRAINING PROGRAMME (ITP)', 'An annual camping programme designed to harness Muslims\' spiritual, social, and economic resources for collective good under the banner of Qur\'an and Sunnah.', 'GraduationCap', 'Spiritual', 3],
        ['MUHARRAM GET-TOGETHER', 'An annual enlightenment and get-together programme at the start of the Hijrah year to foster brotherhood and generate developmental ideas for the Ummah.', 'Users', 'Social', 4],
        ['KHURUJ FISABILILLAH', 'An outreach programme for rural areas, providing enlightenment and nourishment with Islamic teachings over weekends.', 'Globe', 'Spiritual', 5],
        ['MEDICAL CARAVAN', 'Using Muslim medical volunteers, this project provides free medical consultation and services in rural areas to Muslims and non-Muslims alike.', 'Heart', 'Health', 6],
        ['GUIDANCE AND COUNSELLING', 'A forum within the monthly Adhkar programme where scholars listen to individual problems and provide counselling based on the Qur\'an and Sunnah.', 'Lightbulb', 'Spiritual', 7],
        ['RAM BUSINESS', 'A project to help Muslims purchase rams for Eid-ul-Adha at affordable prices, sourced directly from the North and sold through a shareholder model.', 'Star', 'Economic', 8],
        ['HUMAN CONCERN FOUNDATION INTERNATIONAL (HCFI)', 'A body devoted to providing relief to people encountering disasters like floods, accidents, or war, offering everything from medical aid to feeding.', 'Shield', 'Humanitarian', 9],
        ['IFTAR SAIM', 'During Ramadhan, The Muslim Congress organises the feeding of thousands of fasting Muslims at selected centres and prisons across the country.', 'Leaf', 'Social', 10],
        ['CENTRE FOR GLOBAL PEACE INITIATIVES (CGPI)', 'Established to address contemporary issues like human rights and HIV/AIDS from an Islamic perspective, promoting morality and chastity.', 'Sun', 'Social', 11],
        ['TRAFFIC CONTROL', 'Utilising the Congress Guard, TMC assists traffic wardens in major cities to ensure smooth traffic flow and bring relief to road users.', 'Zap', 'Social', 12],
    ];

    for (const [title, description, iconName, category, order] of programmes) {
        const id = require('crypto').randomUUID();
        await db.execute(
            'INSERT INTO `tmc_programmes` (`id`, `title`, `description`, `iconName`, `category`, `order`, `isActive`) VALUES (?, ?, ?, ?, ?, ?, 1)',
            [id, title, description, iconName, category, order]
        );
        console.log('Inserted:', title);
    }
    console.log('✓ Seeded 12 TMC Programmes.');
    await db.end();
    process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
