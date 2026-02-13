
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables explicitly from root
const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envPath = path.resolve(process.cwd(), '.env');

dotenv.config({ path: envLocalPath });
dotenv.config({ path: envPath });

console.log("Current working directory:", process.cwd());
console.log("Env path resolved to:", envPath);
console.log("DATABASE_URL present:", !!process.env.DATABASE_URL);


console.log("Current working directory:", process.cwd());
console.log("Env path resolved to:", envPath);
console.log("DATABASE_URL present:", !!process.env.DATABASE_URL);

// Dynamic import to ensure env vars are loaded first
// import { db } from "../lib/db"
// import { pages } from "../lib/db/schema"
import { eq } from "drizzle-orm"

const PROGRAMMES_CONTENT = `
<h2>A holistic approach to individual reformation, physical well-being, and societal harmony.</h2>

<h3>ADHKAR</h3>
<p>A programme of remembrance and supplication to Allah. People are taught the art of supplication in line with the Qur'an and Sunnah.</p>

<h3>TAZKIYYAH</h3>
<p>Designed to reform the soul by tackling perverted thoughts and knowledge. Features weekly lectures on Tafsir, Fiqh, Islamic History, etc., across Nigeria.</p>

<h3>ISLAMIC TRAINING PROGRAMME (ITP)</h3>
<p>An annual camping programme designed to harness Muslims' spiritual, social, and economic resources for collective good under the banner of Qur’an and Sunnah.</p>

<h3>MUHARRAM GET-TOGETHER</h3>
<p>An annual enlightenment and get-together programme at the start of the Hijrah year to foster brotherhood and generate developmental ideas for the Ummah.</p>

<h3>KHURUJ FISABILILLAH</h3>
<p>An outreach programme for rural areas, providing enlightenment and nourishment with Islamic teachings over weekends.</p>

<h3>MEDICAL CARAVAN</h3>
<p>Using Muslim medical volunteers, this project provides free medical consultation and services in rural areas to Muslims and non-Muslims alike.</p>

<h3>GUIDANCE AND COUNSELLING</h3>
<p>A forum within the monthly Adhkar programme where scholars listen to individual problems and provide counselling based on the Qur’an and Sunnah.</p>

<h3>RAM BUSINESS</h3>
<p>A project to help Muslims purchase rams for Eid-ul-Adha at affordable prices, sourced directly from the North and sold through a shareholder model.</p>

<h3>HUMAN CONCERN FOUNDATION INTERNATIONAL (HCFI)</h3>
<p>A body devoted to providing relief to people encountering disasters like floods, accidents, or war, offering everything from medical aid to feeding.</p>

<h3>IFTAR SAIM</h3>
<p>During Ramadhan, The Muslim Congress organises the feeding of thousands of fasting Muslims at selected centres and prisons across the country.</p>

<h3>CENTRE FOR GLOBAL PEACE INITIATIVES (CGPI)</h3>
<p>Established to address contemporary issues like human rights and HIV/AIDS from an Islamic perspective, promoting morality and chastity.</p>

<h3>TRAFFIC CONTROL</h3>
<p>Utilising the Congress Guard, TMC assists traffic wardens in major cities to ensure smooth traffic flow and bring relief to road users.</p>
`

async function seedPages() {
    console.log("Seeding pages...")
    // Dynamic import
    const { db } = await import("../lib/db");
    const { pages } = await import("../lib/db/schema");

    try {
        const existing = await db.query.pages.findFirst({
            where: eq(pages.slug, "programmes")
        })

        if (existing) {
            console.log("Updating existing Programmes page...")
            await db.update(pages).set({
                title: "Our Programmes",
                content: PROGRAMMES_CONTENT,
                isPublished: true,
                updatedAt: new Date()
            }).where(eq(pages.slug, "programmes"))
        } else {
            console.log("Creating Programmes page...")
            await db.insert(pages).values({
                slug: "programmes",
                title: "Our Programmes",
                content: PROGRAMMES_CONTENT,
                isPublished: true
            })
        }

        console.log("Pages seeded successfully.")
    } catch (e) {
        console.error("Seeding pages failed:", e)
        process.exit(1)
    }
    process.exit(0)
}

seedPages()
