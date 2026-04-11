
import * as dotenv from "dotenv";
import path from "path";
import mysql from "mysql2/promise";
import { v4 as uuidv4 } from 'uuid';

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

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
        const [nationalRows] = await connection.execute('SELECT id FROM organizations WHERE level = ?', ['NATIONAL']);
        const nationalOrgs = nationalRows as any[];

        if (nationalOrgs.length === 0) {
            console.error("National Organization not found. Please run seed-national.ts first.");
            process.exit(1);
        }

        const nationalId = nationalOrgs[0].id;
        console.log(`Found National Org ID: ${nationalId}`);

        const locationData = {
  Lagos: {
    lgas: [
      { name: "Agbado / Oke-Odo", branches: ["Ajasa","Alagbado","Meiran","Oke Odo","Oke-Odo"] },
      { name: "Agege", branches: ["Apata","Dopemu","Oko-Oba","Orile","Sarumi"] },
      { name: "Ajeromi / Ifelodun", branches: ["Boundary","Ijora Badia","Ligali Alaba"] },
      { name: "Alimosho", branches: ["Akowonjo","Alimosho","Egbeda","Ipaja","Ishefun"] },
      { name: "Ayobo / Ipaja", branches: ["Alhaji Hassan","Ipaja","Isefun Olounda"] },
      { name: "Badagry", branches: ["Aradagun","Badagry","Topo","Vlekete"] },
      { name: "Bariga", branches: ["Bariga","Gbagada Lad-Lak","Ilaje","Olohunkemi"] },
      { name: "Coker / Aguda", branches: ["Aguda","Orile"] },
      { name: "Ejigbo", branches: ["Agodo","Daleko","Ikunna","Isheri Osun","Jakande","Niyi","Ori-Oke","Orilowo"] },
      { name: "Epe", branches: ["Iraye","Oke-Balogun","Oke-Magba","Pobo","Sade"] },
      { name: "Eredo", branches: ["Oke-Magba","Pobo"] },
      { name: "Eti Osa", branches: ["Addo","Ajah","Ajah Jakande","Oke-Imale","Oke-Imale / Sangotedo","Oribanwa"] },
      { name: "Ibeju / Lekki", branches: ["Debojo","Eleko","Lakowe","Lekki","Orimedu"] },
      { name: "Ifako / Ijaye", branches: ["Abule Egba","Ifako","Iju","Ojokoro"] },
      { name: "Igando / Ikotun", branches: ["Community Rd","Egan","Idimu","Ijegun","Ikotun","Ikotun Ikotun"] },
      { name: "Igbogbo / Bayeku", branches: ["Igbe Lara","Igbogbo"] },
      { name: "Ikeja", branches: ["Ibafo","Ibafo/Mowe","Keke","Magboro","Mowe","Ogba","Ojodu"] },
      { name: "Ikosi / Isheri", branches: ["Agiliti","Ajegunle","Alapere","Ketu","Mile 12"] },
      { name: "Ikorodu", branches: ["Adamo","Agbala","Agbede","Agbele","Ota-Ona","Owutu"] },
      { name: "Ikorodu North", branches: ["Igbo Ogijo","Odo Kekere","Odogunyan","Ogijo Central","Phoenix"] },
      { name: "Isolo", branches: ["Ago-Okota","Idunnu-Oluwa","Isale Onikanga","Ishagatedo","Isolo","Oke Ilasa","Oke-Ilasa"] },
      { name: "Itire / Ikate", branches: ["Airways","Ijesha","Itire","Olayinka","Oluwakemi","Pako"] },
      { name: "Lagos Island", branches: ["Enuowa","Isale-Eko","Okepopo","Tokunbo"] },
      { name: "Kosofe", branches: ["Araromi","Ekore Oworo","Ifako","L & K Oworo"] },
      { name: "Lagos Mainland", branches: ["Apapa Road","Ebute Meta","Ilogbo","Iwaya","Makoko","Oko Baba"] },
      { name: "Mushin", branches: ["Alakija","Atewolara","Ayetoro","Kekere-Owo","Megbon","Olorunishola","Papa Ajao","Wuraola"] },
      { name: "Odi-Olowo", branches: ["Alakara","Ilupeju","OdiOlowo"] },
      { name: "Ojo", branches: ["Barrack","Morogbo","Okokomaiko"] },
      { name: "Oshodi / Isolo", branches: ["Ayegbesin","Ifelodun","Mulikudeen"] },
      { name: "Shomolu", branches: ["Akoka","Morocco","Onipanu","Pedro"] },
      { name: "Surulere", branches: ["Aguda","Ijesha","Itire","Oju-Randle","Ojuelegba","Olayinka","Oluwakemi","Orile","Pako","Randle"] },
    ],
  },
  Oyo: {
    lgas: [
      { name: "Akinyele", branches: ["Akingbile Branch","Bagadaje Branch","FATOKUN","IDI OSE","Idi-Ose Branch","OJOO","Omilabu Branch","SAWMILL","Tose Branch"] },
      { name: "Atiba", branches: ["AGBAAKIN","AJEGUNLE","ISALE OYO","NIRESA","SABO"] },
      { name: "Atisbo", branches: [] },
      { name: "Egbeda", branches: ["AROLU","IYANA CHURCH","KUELU","MOLADE","OKE-OMI","OKI"] },
      { name: "Ibadan North", branches: ["ABA APATA","AJETUNMOBI","AKOROUNFAYO","ALARAPE","Aba-Apata Branch","Akingbola Branch","Akoronfayo Branch","Akowo Branch","Alaro Branch","BOLA","Bodija Branch","Boro Branch","Fijabi Branch","ILE-ADU","ILUPEJU","IRORUN-OLUWA","Ile Adu Branch","Irorun Oluwa Branch","Jakan Branch","Kube Branch","Mokola Branch","ODO-BAALE","OKE-ARE","OKE-AREMO","OLORUNGBEBE","OMO SHEU","Odo Baale Branch","Oju-Irin Branch","Oke Are Branch","Oke Aremo Branch","Olohungbebe Branch","SANGO OJU IRIN","Water Branch","YEMETU/KUBE"] },
      { name: "Ibadan North-East", branches: ["AREMO","ARISEKOLA","BASHORUN","GATE/ISO","IDI OBI","OKA-ADU","OLOROMBO"] },
      { name: "Ibadan North-West", branches: ["Alagutan Branch","Arometa Branch","Ayegun Branch","ELEYELE","INALENDE","Idi-Oro Branch","Oganla Branch","RAILWAY"] },
      { name: "Ibadan South-East", branches: ["Boluwaji Branch","Felele Branch","ILUPEJU","Muslim Branch","ODO-OBA","OSUNGBADE","Odo Oba Branch","Owode Branch"] },
      { name: "Ibadan South-West", branches: ["ALEXANDER","APATA","CHALLENGE","ILUPEEJU","KUOLA","OMI ADIO","WIRE AND CABLE"] },
      { name: "Ibarapa Central", branches: [] },
      { name: "Ibarapa East", branches: [] },
      { name: "Ibarapa North", branches: [] },
      { name: "Ido", branches: ["Agbaje Branch","Awotan Branch","GBOPA","Ido Branch","Lakoto Branch","Ologuneru Branch"] },
      { name: "Irepo", branches: [] },
      { name: "Iseyin", branches: ["BOLAJOKO","ORELOPE","SALAUDEEN"] },
      { name: "Itesiwaju", branches: [] },
      { name: "Iwajowa", branches: [] },
      { name: "Kajola", branches: [] },
      { name: "Lagelu", branches: ["ATARI","Alegongo Branch","Idi-Ape Branch","Lalupon/Ejioku Branch","Monatan Branch","Olodo Branch","Olorundaba Branch"] },
      { name: "Ogbomosho North", branches: [] },
      { name: "Ogbomosho South", branches: [] },
      { name: "Ogo Oluwa", branches: [] },
      { name: "Olorunsogo", branches: [] },
      { name: "Oluyole", branches: ["ABA ODE","Aba-Ode Branch","Aba-Orioke Branch","Jogbin Branch","OLUNDE","Odo-Ona Branch","Oke-Ode Branch","Olomi Branch","Papa Branch","SOKA","Sanyo Branch","Shagari Branch","Titilope Branch"] },
      { name: "Ona Ara", branches: ["1ST JABAH","AROWONA","ELEWE","JAGUN","KEHINSI","KEYIN - SI","OLOHUNLASIN","OLOHUNSOGO","OLORUNLANSIN","OLORUNSOGO"] },
      { name: "Orelope", branches: [] },
      { name: "Ori Ire", branches: [] },
      { name: "Oyo East", branches: ["AGBOGAN-GAN","APAARA","APINNI","BNL","FOLA TYRES","MABOLAJE","OKE APO","OLUSANMI"] },
      { name: "Oyo West", branches: ["ALU SUNNAH","AYETORO SCHEM","Ahlusunah Branch","Aseeke Branch","Ayetoro Branch","Enuoranoba Branch","Gold and rock Branch","IKAOSUNWON","ISOKUN","Ikakosunwon Branch","Isokun Agba Branch","Isokun titun Branch","MOGBA FOLUWA","Mogbafoluwa Branch","OLOHUNSOLA","ONA ISOKUN","Olorunsola Branch","Onikeke Branch","Yahyah Branch"] },
      { name: "Saki East", branches: [] },
      { name: "Saki West", branches: [] },
      { name: "Surulere", branches: [] },
      { name: "AFIJIO", branches: ["BINTINLAYE","IWAARE","ONIREKE","PAKOYI"] },
      { name: "OGBMOSHO", branches: ["ALARANSE-ESIN","ALFATEDO","AROWOMOLE","AYEDOGBON","OWODE"] },
      { name: "OGBOMOSO NORTH", branches: [] },
      { name: "OGBOMOSO SOUTH", branches: ["Arowomole"] },
      { name: "OORELOPE", branches: [] },
      { name: "SHAKI/IGBOHO", branches: ["AGO-ARE","ERO OMO SAKI","IGBOHO","IGBORO","MOKOLA"] },
    ],
  },
  Osun: {
    lgas: [
      { name: "Ayedire", branches: ["AYEDIRE","Jore Center"] },
      { name: "Ede", branches: ["EDE","Ededimeji Area","Iso Osu Area","OWODE","Oke Gada Area"] },
      { name: "Ife", branches: ["IDI OMOH AREA","Idi - Omoh, Ilare","ODI OLOKUN QUARTERS"] },
      { name: "Ifelodun", branches: ["Anu Oluwapo"] },
      { name: "Ilesa East", branches: ["HOSPITAL AREA","ISALE GENERAL","OKE OLA AREA","OKERO AREA","Oke - Iro","Oke - Iyanu","Rubicon Estate"] },
      { name: "Ilesa West", branches: ["Sale General Area"] },
      { name: "Osogbo", branches: ["AGUNBELEWO","Alekuwodo","Allahu Lateef Area","Better Life Area","GBODOFON AREA","KOSEMANI/GBONGAN ROAD","Ode Oga","Oke Baale Area","Okinni Area","Owode Ede","Testing Ground Area"] },
      { name: "Iwo", branches: ["Ile Osin","LAWYER ATANDA AREA","Lawyer Atanda Estate","Oke Odo"] },
      { name: "IIOBU", branches: ["ILOBU"] },
      { name: "IKIRUN", branches: ["IDI ARABA"] },
      { name: "ILA", branches: ["ILA"] },
    ],
  },
  Niger: {
    lgas: [
      { name: "Suleja", branches: ["Cosco Branch","Gauraka Branch","Kwankwashe Branch","SULEJA"] },
      { name: "Gurara", branches: ["Kwamba Branch","Lambata Branch","Maje Branch"] },
      { name: "Chanchaga", branches: ["Chanchaga Branch"] },
      { name: "LAMBATA", branches: ["LAMBATA"] },
    ],
  },
  Kwara: {
    lgas: [
      { name: "Ilorin East", branches: ["AGAKA","APALARA","Basin Branch","Fate Branch","ITA OLOGBIN","OLOJOKU","Osere Branch","SANI OKIN"] },
      { name: "Ilorin South", branches: ["AL-HARAMAIN","Apalara Branch","Asa-Dam Branch","BASIN","GBIGBA ADUA","Irewolede Branch","OSE OLOHUN"] },
      { name: "Ilorin West", branches: ["Adewole Branch","Agaka Branch","OSERE"] },
    ],
  },
  Edo: {
    lgas: [
      { name: "Akoko-Edo", branches: ["Akoko-Edo Branch"] },
      { name: "Egor", branches: ["Egor Branch"] },
      { name: "Esan Central", branches: ["Esan Central Branch"] },
      { name: "Esan North-East", branches: ["Esan North-East Branch"] },
      { name: "Esan South-East", branches: ["Esan South-East Branch"] },
      { name: "Etsako Central", branches: ["Etsako Central Branch"] },
      { name: "Etsako East", branches: ["Etsako East Branch"] },
      { name: "Benin", branches: ["Auchi Branch","Benin Main Branch","Ekpoma Branch"] },
    ],
  },
  Ekiti: {
    lgas: [
      { name: "Ado-Ekiti", branches: ["Ado-Ekiti Branch"] },
      { name: "Ikere", branches: ["Ikere Branch"] },
      { name: "Oye", branches: ["Oye Branch"] },
      { name: "Ikole", branches: ["Ikole Branch"] },
      { name: "Ijero", branches: ["Ijero Branch"] },
      { name: "Ido-Osi", branches: ["Ido-Osi Branch"] },
      { name: "Efon", branches: ["Efon Branch"] },
    ],
  },
  FCT: {
    lgas: [
      { name: "Amac", branches: ["Amac","JIKWOYI 1","JIKWOYI 2","Jikwoyi","LUGBE","MARARABA"] },
      { name: "Bwari", branches: ["Bwari","DUTSE ALHAJI MOSQUE","JULIUS BERGER MOSQUE"] },
      { name: "Gwagwalada", branches: ["Gwagwalada"] },
      { name: "Kuje", branches: ["Dutse","KUJE MOSQUE","Kubwa","Kuje","Mbape"] },
    ],
  },
  Ogun: {
    lgas: [
      { name: "Abeokuta North", branches: ["ALUBARIKA MOSQUE","Ijaiye","Kugba","Sabo"] },
      { name: "Abeokuta South", branches: ["IJAYE","KUGBA"] },
      { name: "Ado Odo Ota", branches: ["ATELE","Aparadija","Atan","IFO","IYANA-OYESI","Ijoko","Iyana Iyesi","OTA II","Ota","Owode","Sango"] },
      { name: "Ifo", branches: ["Ifo Branch"] },
      { name: "Ijebu North", branches: ["AGO IWOYE","Ago-Iwoye","Ijebu Igbo","Mamu","ORU-AWA-ILAPORU II","Oru-Awa-Ilaporu"] },
      { name: "Ijebu North East", branches: ["Igbeba","Ilese"] },
      { name: "Ijebu Ode", branches: ["Ayesan","IGBEBA","ISIWO","Imepe","Imupa","ODO EGBO","ODOSENGOLU","OWODE JIHAD","TEMIDIRE","Temidere","Wulemotu"] },
      { name: "Ikenne", branches: ["Ayegbami","Ikenne","Iperu","Sabo","Station"] },
      { name: "Sagamu", branches: ["AYEGBAMI","Agura","IKENNE","IPERU","SABO","STATION"] },
      { name: "Yewa North", branches: ["AYETORO EEMADO C/MOSQUE","Ayetoro","Imasayi"] },
      { name: "Yewa South", branches: ["Ilaro","Owode"] },
      { name: "Benin Republic", branches: ["Pobe"] },
    ],
  },
  Ondo: {
    lgas: [
      { name: "Akoko North-East", branches: ["Akoko North-East Branch"] },
      { name: "Akoko North-West", branches: ["Akoko North-West Branch"] },
      { name: "Akoko South-West", branches: ["Akoko South-West Branch"] },
      { name: "Akure North", branches: ["Akure North Branch"] },
      { name: "Akure South", branches: ["Akure Main Branch"] },
      { name: "Ese Odo", branches: ["Ese Odo Branch"] },
      { name: "Owo", branches: ["Owo Branch"] },
      { name: "Okitipupa", branches: ["Okitipupa Branch"] },
    ],
  },
};

        for (const [stateName, data] of Object.entries(locationData)) {
            const stateData = data as any;
            const stateCode = stateName.substring(0, 3).toUpperCase();

            console.log(`Processing State: ${stateName}`);

            let stateId = genId();
            const [existingState] = await connection.execute('SELECT id FROM organizations WHERE name = ? AND level = ?', [stateName, 'STATE']);

            if ((existingState as any[]).length > 0) {
                stateId = (existingState as any[])[0].id;
                console.log(`- State ${stateName} exists, using ID: ${stateId}`);
            } else {
                await connection.execute(`
                    INSERT INTO organizations (id, name, level, code, parentId, country, createdAt, updatedAt)
                    VALUES (?, ?, 'STATE', ?, ?, 'Nigeria', NOW(), NOW())
                `, [stateId, stateName, stateCode, nationalId]);
                console.log(`- Created State: ${stateName}`);
            }

            for (const lga of stateData.lgas) {
                const lgaName = lga.name;
                const cleanLgaName = lgaName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                const lgaCode = `${stateCode}-${cleanLgaName.substring(0, 10)}`;

                let lgaId = genId();
                const [existingLga] = await connection.execute('SELECT id FROM organizations WHERE name = ? AND level = ? AND parentId = ?', [lgaName, 'LOCAL_GOVERNMENT', stateId]);

                if ((existingLga as any[]).length > 0) {
                    lgaId = (existingLga as any[])[0].id;
                } else {
                    try {
                        await connection.execute(`
                            INSERT INTO organizations (id, name, level, code, parentId, country, createdAt, updatedAt)
                            VALUES (?, ?, 'LOCAL_GOVERNMENT', ?, ?, 'Nigeria', NOW(), NOW())
                        `, [lgaId, lgaName, lgaCode, stateId]);
                    } catch (e: any) {
                        if (e.code === 'ER_DUP_ENTRY') {
                            const fallbackCode = `${lgaCode}-${Math.floor(Math.random() * 1000)}`;
                            await connection.execute(`
                                    INSERT INTO organizations (id, name, level, code, parentId, country, createdAt, updatedAt)
                                    VALUES (?, ?, 'LOCAL_GOVERNMENT', ?, ?, 'Nigeria', NOW(), NOW())
                                `, [lgaId, lgaName, fallbackCode, stateId]);
                        } else {
                            throw e;
                        }
                    }
                }

                for (const branchName of lga.branches) {
                    const cleanBranchName = branchName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                    const branchCode = `${lgaCode}-${cleanBranchName.substring(0, 10)}`;

                    const [existingBranch] = await connection.execute('SELECT id FROM organizations WHERE name = ? AND level = ? AND parentId = ?', [branchName, 'BRANCH', lgaId]);

                    if ((existingBranch as any[]).length === 0) {
                        try {
                            await connection.execute(`
                                INSERT INTO organizations (id, name, level, code, parentId, country, createdAt, updatedAt)
                                VALUES (?, ?, 'BRANCH', ?, ?, 'Nigeria', NOW(), NOW())
                            `, [genId(), branchName, branchCode, lgaId]);
                        } catch (e: any) {
                            if (e.code === 'ER_DUP_ENTRY') {
                                const fallbackCode = `${branchCode}-${Math.floor(Math.random() * 1000)}`;
                                await connection.execute(`
                                    INSERT INTO organizations (id, name, level, code, parentId, country, createdAt, updatedAt)
                                    VALUES (?, ?, 'BRANCH', ?, ?, 'Nigeria', NOW(), NOW())
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
