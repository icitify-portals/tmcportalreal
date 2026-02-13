
import * as dotenv from "dotenv";
import path from "path";
import mysql from "mysql2/promise";
import { v4 as uuidv4 } from 'uuid'; // We might need this if we don't depend on MySQL's UUID() effectively for return values

// Load .env from project root
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// Helper to generate IDs if needed, or rely on SQL
const genId = () => uuidv4();

async function main() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error("DATABASE_URL is not defined in .env");
        process.exit(1);
    }

    const connection = await mysql.createConnection({
        uri: connectionString
    });

    console.log("Seeding Community Data...");

    try {
        // 1. Get National Org ID
        const [nationalRows] = await connection.execute('SELECT id FROM organizations WHERE level = ?', ['NATIONAL']);
        const nationalOrgs = nationalRows as any[];

        if (nationalOrgs.length === 0) {
            console.error("National Organization not found. Please run seed-national.ts first.");
            process.exit(1);
        }

        const nationalId = nationalOrgs[0].id;
        console.log(`Found National Org ID: ${nationalId}`);

        // 2. Define Data Hierarchy
        // 2. Define Data Hierarchy
        // Embedding data directly to avoid ESM/CommonJS import issues in seed script
        const locationData = {
            Lagos: {
                lgas: [
                    { name: "Agbado / Oke-Odo", branches: ["Ajasa", "Alagbado", "Oke-Odo", "Meiran"] },
                    { name: "Agege", branches: ["Oko-Oba", "Orile", "Sarumi", "Dopemu"] },
                    { name: "Ajeromi / Ifelodun", branches: ["Boundary", "Ijora Badia", "Ligali Alaba"] },
                    { name: "Alimosho", branches: ["Akowonjo", "Alimosho", "Egbeda"] },
                    { name: "Ayobo / Ipaja", branches: ["Alhaji Hassan", "Ipaja", "Isefun Olounda"] },
                    { name: "Badagry", branches: ["Aradagun", "Topo", "Vlekete"] },
                    { name: "Bariga", branches: ["Bariga", "Gbagada Lad-Lak", "Ilaje", "Olohunkemi"] },
                    { name: "Coker / Aguda", branches: ["Orile", "Aguda"] },
                    { name: "Ejigbo", branches: ["Daleko", "Jakande", "Orilowo", "Ori-Oke", "Isheri Osun", "Agodo", "Ikunna", "Niyi"] },
                    { name: "Epe", branches: ["Iraye", "Oke-Balogun", "Sade"] },
                    { name: "Eredo", branches: ["Oke-Magba", "Pobo"] },
                    { name: "Eti Osa", branches: ["Ajah", "Addo", "Oke-Imale / Sangotedo"] },
                    { name: "Ibeju / Lekki", branches: ["Lakowe", "Eleko"] },
                    { name: "Ifako / Ijaye", branches: ["Ifako", "Ojokoro", "Abule Egba", "Iju"] },
                    { name: "Igando / Ikotun", branches: ["Idimu", "Ikotun", "Ijegun", "Egan", "Community Rd"] },
                    { name: "Igbogbo / Bayeku", branches: ["Igbogbo", "Igbe Lara"] },
                    { name: "Ikeja", branches: ["Ogba", "Ojodu", "Ibafo", "Mowe", "Magboro", "Keke"] },
                    { name: "Ikosi / Isheri", branches: ["Alapere", "Ajegunle", "Agiliti", "Ketu", "Mile 12"] },
                    { name: "Ikorodu", branches: ["Adamo", "Agbala", "Agbede", "Agbele", "Ota-Ona", "Owutu"] },
                    { name: "Ikorodu North", branches: ["Ogijo Central", "Igbo Ogijo", "Phoenix", "Odogunyan", "Odo Kekere"] },
                    { name: "Isolo", branches: ["Ago-Okota", "Isale Onikanga", "Ishagatedo", "Isolo", "Oke Ilasa"] },
                    { name: "Itire / Ikate", branches: ["Ijesha", "Oluwakemi", "Olayinka", "Itire", "Pako", "Airways"] },
                    { name: "Lagos Island", branches: ["Enuowa", "Okepopo"] },
                    { name: "Kosofe", branches: ["Ekore Oworo", "L & K Oworo", "Araromi", "Ifako"] },
                    { name: "Lagos Mainland", branches: ["Iwaya", "Makoko", "Ebute Meta", "Apapa Road", "Oko Baba"] },
                    { name: "Mushin", branches: ["Alakija", "Atewolara", "Ayetoro", "Kekere-Owo", "Olorunishola", "Megbon", "Papa Ajao", "Wuraola"] },
                    { name: "Odi-Olowo", branches: ["Alakara", "Ilupeju", "OdiOlowo"] },
                    { name: "Ojo", branches: ["Barrack", "Okokomaiko", "Morogbo"] },
                    { name: "Oshodi / Isolo", branches: ["Ayegbesin", "Ifelodun", "Mulikudeen"] },
                    { name: "Shomolu", branches: ["Akoka", "Morocco", "Onipanu", "Pedro"] },
                    { name: "Surulere", branches: ["Ojuelegba", "Randle"] },
                ],
            },
            Oyo: {
                lgas: [
                    { name: "Akinyele", branches: ["Bagadaje Branch", "Idi-Ose Branch", "Akingbile Branch", "Omilabu Branch", "Tose Branch"] },
                    { name: "Atiba", branches: [] },
                    { name: "Atisbo", branches: [] },
                    { name: "Egbeda", branches: [] },
                    { name: "Ibadan North", branches: ["Olohungbebe Branch", "Bodija Branch", "Water Branch", "Jakan Branch", "Aba-Apata Branch", "Akoronfayo Branch", "Irorun Oluwa Branch", "Odo Baale Branch", "Oju-Irin Branch", "Fijabi Branch", "Alaro Branch", "Mokola Branch", "Ile Adu Branch", "Akowo Branch", "Kube Branch", "Oke Are Branch", "Oke Aremo Branch", "Akingbola Branch", "Boro Branch"] },
                    { name: "Ibadan North-East", branches: [] },
                    { name: "Ibadan North-West", branches: ["Alagutan Branch", "Ayegun Branch", "Idi-Oro Branch", "Oganla Branch", "Arometa Branch"] },
                    { name: "Ibadan South-East", branches: ["Muslim Branch", "Odo Oba Branch", "Owode Branch", "Felele Branch", "Boluwaji Branch"] },
                    { name: "Ibadan South-West", branches: [] },
                    { name: "Ibarapa Central", branches: [] },
                    { name: "Ibarapa East", branches: [] },
                    { name: "Ibarapa North", branches: [] },
                    { name: "Ido", branches: ["Lakoto Branch", "Awotan Branch", "Ido Branch", "Agbaje Branch", "Ologuneru Branch"] },
                    { name: "Irepo", branches: [] },
                    { name: "Iseyin", branches: [] },
                    { name: "Itesiwaju", branches: [] },
                    { name: "Iwajowa", branches: [] },
                    { name: "Kajola", branches: [] },
                    { name: "Lagelu", branches: ["Idi-Ape Branch", "Alegongo Branch", "Olorundaba Branch", "Monatan Branch", "Lalupon/Ejioku Branch", "Olodo Branch"] },
                    { name: "Ogbomosho North", branches: [] },
                    { name: "Ogbomosho South", branches: [] },
                    { name: "Ogo Oluwa", branches: [] },
                    { name: "Olorunsogo", branches: [] },
                    { name: "Oluyole", branches: ["Shagari Branch", "Titilope Branch", "Olomi Branch", "Oke-Ode Branch", "Jogbin Branch", "Aba-Ode Branch", "Aba-Orioke Branch", "Odo-Ona Branch", "Sanyo Branch", "Papa Branch"] },
                    { name: "Ona Ara", branches: [] },
                    { name: "Orelope", branches: [] },
                    { name: "Ori Ire", branches: [] },
                    { name: "Oyo East", branches: [] },
                    { name: "Oyo West", branches: ["Olorunsola Branch", "Aseeke Branch", "Enuoranoba Branch", "Mogbafoluwa Branch", "Ahlusunah Branch", "Ikakosunwon Branch", "Isokun titun Branch", "Isokun Agba Branch", "Yahyah Branch", "Onikeke Branch", "Gold and rock Branch", "Ayetoro Branch"] },
                    { name: "Saki East", branches: [] },
                    { name: "Saki West", branches: [] },
                    { name: "Surulere", branches: [] },
                ],
            },
            Osun: {
                lgas: [
                    { name: "Ayedire", branches: ["Jore Center"] },
                    { name: "Ede", branches: ["Ededimeji Area", "Oke Gada Area", "Iso Osu Area"] },
                    { name: "Ife", branches: ["Idi - Omoh, Ilare"] },
                    { name: "Ifelodun", branches: ["Anu Oluwapo"] },
                    { name: "Ilesa East", branches: ["Rubicon Estate", "Oke - Iyanu", "Oke - Iro"] },
                    { name: "Ilesa West", branches: ["Sale General Area"] },
                    { name: "Osogbo", branches: ["Alekuwodo", "Oke Baale Area", "Better Life Area", "Okinni Area", "Owode Ede", "Ode Oga", "Allahu Lateef Area", "Testing Ground Area"] },
                    { name: "Iwo", branches: ["Ile Osin", "Oke Odo", "Lawyer Atanda Estate"] },
                ],
            },
            Niger: {
                lgas: [
                    { name: "Suleja", branches: ["Cosco Branch", "Gauraka Branch", "Kwankwashe Branch"] },
                    { name: "Gurara", branches: ["Maje Branch", "Kwamba Branch", "Lambata Branch"] },
                    { name: "Chanchaga", branches: ["Chanchaga Branch"] },
                ],
            },
            Kwara: {
                lgas: [
                    { name: "Ilorin East", branches: ["Fate Branch", "Basin Branch", "Osere Branch"] },
                    { name: "Ilorin South", branches: ["Irewolede Branch", "Asa-Dam Branch", "Apalara Branch"] },
                    { name: "Ilorin West", branches: ["Adewole Branch", "Agaka Branch"] },
                ],
            },
            Edo: {
                lgas: [
                    { name: "Akoko-Edo", branches: [] },
                    { name: "Egor", branches: [] },
                    { name: "Esan Central", branches: [] },
                    { name: "Esan North-East", branches: [] },
                    { name: "Esan South-East", branches: [] },
                    { name: "Etsako Central", branches: [] },
                    { name: "Etsako East", branches: [] },
                    { name: "Benin", branches: ["Benin Main Branch", "Auchi Branch", "Ekpoma Branch"] },
                ],
            },
            Ekiti: {
                lgas: [
                    { name: "Ado-Ekiti", branches: ["Ado-Ekiti Branch"] },
                    { name: "Ikere", branches: ["Ikere Branch"] },
                    { name: "Oye", branches: ["Oye Branch"] },
                    { name: "Ikole", branches: [] },
                    { name: "Ijero", branches: [] },
                    { name: "Ido-Osi", branches: [] },
                    { name: "Efon", branches: [] },
                ],
            },
            FCT: {
                lgas: [
                    { name: "Amac", branches: ["Amac", "Jikwoyi"] },
                    { name: "Bwari", branches: ["Bwari"] },
                    { name: "Gwagwalada", branches: ["Gwagwalada"] },
                    { name: "Kuje", branches: ["Dutse", "Kubwa", "Mbape", "Kuje"] },
                ],
            },
            Ogun: {
                lgas: [
                    { name: "Abeokuta North", branches: ["Sabo", "Kugba", "Ijaiye"] },
                    { name: "Abeokuta South", branches: [] },
                    { name: "Ado Odo Ota", branches: ["Sango", "Ijoko", "Owode", "Ota", "Iyana Iyesi", "Atan", "Aparadija"] },
                    { name: "Ifo", branches: [] },
                    { name: "Ijebu North", branches: ["Ijebu Igbo", "Ago-Iwoye", "Oru-Awa-Ilaporu", "Mamu"] },
                    { name: "Ijebu North East", branches: ["Ilese", "Igbeba"] },
                    { name: "Ijebu Ode", branches: ["Imepe", "Temidere", "Ayesan", "Imupa", "Wulemotu"] },
                    { name: "Ikenne", branches: ["Ikenne", "Iperu", "Sabo", "Ayegbami", "Station"] },
                    { name: "Sagamu", branches: ["Agura"] },
                    { name: "Yewa North", branches: ["Ayetoro", "Imasayi"] },
                    { name: "Yewa South", branches: ["Ilaro", "Owode"] },
                    { name: "Benin Republic", branches: ["Pobe"] },
                ],
            },
            Ondo: {
                lgas: [
                    { name: "Akoko North-East", branches: [] },
                    { name: "Akoko North-West", branches: [] },
                    { name: "Akoko South-West", branches: [] },
                    { name: "Akure North", branches: [] },
                    { name: "Akure South", branches: ["Akure Main Branch"] },
                    { name: "Ese Odo", branches: [] },
                    { name: "Owo", branches: ["Owo Branch"] },
                    { name: "Okitipupa", branches: ["Okitipupa Branch"] },
                ],
            },
        };

        // 3. Insert Data
        for (const [stateName, data] of Object.entries(locationData)) {
            const stateData = data as any;
            const stateCode = stateName.substring(0, 3).toUpperCase();

            console.log(`Processing State: ${stateName}`);

            // Check if State exists
            let stateId = genId();
            const [existingState] = await connection.execute('SELECT id FROM organizations WHERE name = ? AND level = ?', [stateName, 'STATE']);

            if ((existingState as any[]).length > 0) {
                stateId = (existingState as any[])[0].id;
                console.log(`- State ${stateName} exists, using ID: ${stateId}`);
            } else {
                await connection.execute(`
                    INSERT INTO organizations (id, name, level, code, parentId, country, createdAt)
                    VALUES (?, ?, 'STATE', ?, ?, 'Nigeria', NOW())
                `, [stateId, stateName, stateCode, nationalId]);
                console.log(`- Created State: ${stateName}`);
            }

            for (const lga of stateData.lgas) {
                const lgaName = lga.name;
                // Generate a safer slug-based code to avoid collisions (e.g. LAG-IKO vs LAG-IKO)
                const cleanLgaName = lgaName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                const lgaCode = `${stateCode}-${cleanLgaName.substring(0, 10)}`;

                let lgaId = genId();
                const [existingLga] = await connection.execute('SELECT id FROM organizations WHERE name = ? AND level = ? AND parentId = ?', [lgaName, 'LOCAL_GOVERNMENT', stateId]);

                if ((existingLga as any[]).length > 0) {
                    lgaId = (existingLga as any[])[0].id;
                } else {
                    try {
                        await connection.execute(`
                            INSERT INTO organizations (id, name, level, code, parentId, country, createdAt)
                            VALUES (?, ?, 'LOCAL_GOVERNMENT', ?, ?, 'Nigeria', NOW())
                        `, [lgaId, lgaName, lgaCode, stateId]);
                    } catch (e: any) {
                        if (e.code === 'ER_DUP_ENTRY') {
                            // Fallback for LGA code collision
                            const fallbackCode = `${lgaCode}-${Math.floor(Math.random() * 1000)}`;
                            await connection.execute(`
                                    INSERT INTO organizations (id, name, level, code, parentId, country, createdAt)
                                    VALUES (?, ?, 'LOCAL_GOVERNMENT', ?, ?, 'Nigeria', NOW())
                                `, [lgaId, lgaName, fallbackCode, stateId]);
                        } else {
                            throw e;
                        }
                    }
                }

                for (const branchName of lga.branches) {
                    // Generate a safer slug-based code to avoid collisions (e.g. ORI vs ORI)
                    const cleanBranchName = branchName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                    // Use shortened LGA code + full branch name slug to ensure uniqueness
                    const branchCode = `${lgaCode}-${cleanBranchName.substring(0, 10)}`;

                    // Check existence
                    const [existingBranch] = await connection.execute('SELECT id FROM organizations WHERE name = ? AND level = ? AND parentId = ?', [branchName, 'BRANCH', lgaId]);

                    if ((existingBranch as any[]).length === 0) {
                        try {
                            await connection.execute(`
                                INSERT INTO organizations (id, name, level, code, parentId, country, createdAt)
                                VALUES (?, ?, 'BRANCH', ?, ?, 'Nigeria', NOW())
                            `, [genId(), branchName, branchCode, lgaId]);
                        } catch (e: any) {
                            if (e.code === 'ER_DUP_ENTRY') {
                                // Fallback with random suffix if STILL duplicate (rare but possible if truncated same)
                                const fallbackCode = `${branchCode}-${Math.floor(Math.random() * 1000)}`;
                                await connection.execute(`
                                    INSERT INTO organizations (id, name, level, code, parentId, country, createdAt)
                                    VALUES (?, ?, 'BRANCH', ?, ?, 'Nigeria', NOW())
                                `, [genId(), branchName, fallbackCode, lgaId]);
                            } else {
                                throw e;
                            }
                        }
                    }
                }
            }
        }

        console.log("Community Data Seeded Successfully.");

    } catch (error) {
        console.error("Seeding failed:", error);
    } finally {
        await connection.end();
    }
}

main();
