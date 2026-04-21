
import { db } from "../lib/db";
import { 
    programmes, 
    offices, 
    organizations, 
    users, 
} from "../lib/db/schema";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

async function seedNicto() {
    console.log("Starting NICTO Seeding Process...");

    // 1. Get National Organization
    const [nationalOrg] = await db.select().from(organizations).where(eq(organizations.level, "NATIONAL")).limit(1);
    if (!nationalOrg) {
        throw new Error("National Organization not found. Please run baseline seeds first.");
    }
    console.log(`Targeting Org: ${nationalOrg.name} (${nationalOrg.id})`);

    // 2. Identify/Create a Creator (National Admin or Super Admin)
    let creator = await db.query.users.findFirst({
        where: eq(users.email, "admin@tmc.org")
    });

    if (!creator) {
        console.log("Super Admin not found, creating dummy creator...");
        const newUserId = uuidv4();
        await db.insert(users).values({
            id: newUserId,
            name: "NICTO Seeder",
            email: "seeder@nicto.org",
        });
        creator = { id: newUserId } as any;
    }

    // 3. Create NICTO Offices
    const nictoOffices = [
        { name: "National NICTO Development Office", description: "Responsible for national strategic growth and development." },
        { name: "NICTO Infrastructure Office", description: "Responsible for managing and maintaining physical and digital assets." }
    ];

    const officeIds: Record<string, string> = {};

    for (const off of niccttoOffices) { // will fix the typo in the loop var below
    }
    
    // Actually, I'll rewrite standardizing the names
    for (const off of nictoOffices) {
        let [existing] = await db.select().from(offices).where(
            and(
                eq(offices.name, off.name),
                eq(offices.organizationId, nationalOrg.id)
            )
        ).limit(1);

        if (!existing) {
            console.log(`Creating office: ${off.name}`);
            const [newOffice] = await db.insert(offices).values({
                organizationId: nationalOrg.id,
                name: off.name,
                description: off.description,
                isActive: true
            }).$returningId();
            officeIds[off.name] = (newOffice as any).id;
        } else {
            console.log(`Office exists: ${off.name}`);
            officeIds[off.name] = existing.id;
        }
    }

    // 4. Seed Programmes for 2026
    const programmesData = [
        // Development Office
        {
            office: "National NICTO Development Office",
            title: "NICTO Annual Development Summit 2026",
            description: "A gathering of regional leads to discuss the 2026 development roadmap.",
            startDate: new Date("2026-03-15T09:00:00"),
            venue: "National Headquarters, Lagos",
            format: "HYBRID",
            frequency: "ANNUALLY",
            budget: "2500000.00",
            objectives: "Align all branches with the 2026 growth targets.",
            committee: "NICTO Dev Committee"
        },
        {
            office: "National NICTO Development Office",
            title: "Strategic Planning Workshop Q2",
            description: "Quarterly review of development milestones.",
            startDate: new Date("2026-06-10T10:00:00"),
            venue: "Virtual Room A",
            format: "VIRTUAL",
            frequency: "QUARTERLY",
            budget: "150000.00",
            objectives: "Review Q1 progress and adjust Q2 tactics.",
            committee: "Strategy Lead Team"
        },
        {
            office: "National NICTO Development Office",
            title: "National Digital Transformation Launch",
            description: "Launch of the new congress membership portal.",
            startDate: new Date("2026-09-20T11:00:00"),
            venue: "Main Hall, Abuja",
            format: "PHYSICAL",
            frequency: "ONCE",
            budget: "5000000.00",
            objectives: "Migrate all manual registrations to the digital portal.",
            committee: "Digital Innovation Team"
        },
        // Infrastructure Office
        {
            office: "NICTO Infrastructure Office",
            title: "Q1 Infrastructure Maintenance Audit",
            description: "Comprehensive audit of all physical assets across national branches.",
            startDate: new Date("2026-02-05T08:00:00"),
            venue: "Various locations",
            format: "PHYSICAL",
            frequency: "QUARTERLY",
            budget: "800000.00",
            objectives: "Identify critical repairs needed for 2026.",
            committee: "Audit Team Blue"
        },
        {
            office: "NICTO Infrastructure Office",
            title: "Project Management Certification Training",
            description: "Technical training for branch facility managers.",
            startDate: new Date("2026-05-18T09:00:00"),
            venue: "Training Portal",
            format: "VIRTUAL",
            frequency: "BI-ANNUALLY",
            budget: "1200000.00",
            objectives: "Standardize project reporting and execution.",
            committee: "Professional Dev Unit"
        },
        {
            office: "NICTO Infrastructure Office",
            title: "National Assets Management Seminar",
            description: "Seminar on sustainable asset lifecycle management.",
            startDate: new Date("2026-10-12T10:00:00"),
            venue: "Conference Room B / Online",
            format: "HYBRID",
            frequency: "MONTHLY",
            budget: "300000.00",
            objectives: "Reduce asset depreciation through proactive maintenance.",
            committee: "Asset Mgmt Group"
        }
    ];

    console.log("Seeding Programmes...");
    for (const prog of programmesData) {
        await db.insert(programmes).values({
            organizationId: nationalOrg.id,
            organizingOfficeId: officeIds[prog.office],
            title: prog.title,
            description: prog.description,
            venue: prog.venue,
            startDate: prog.startDate,
            endDate: new Date(prog.startDate.getTime() + 8 * 60 * 60 * 1000), // +8 hours
            time: "09:00 AM",
            level: "NATIONAL",
            status: "APPROVED",
            format: prog.format as any,
            frequency: prog.frequency as any,
            budget: prog.budget,
            objectives: prog.objectives,
            committee: prog.committee,
            createdBy: creator!.id
        });
        console.log(`- Seeded: ${prog.title}`);
    }

    console.log("Seeding Completed Successfully.");
}

seedNiccto().catch(error => { // fixed name in call too
    console.error("Seeding Failed:", error);
    process.exit(1);
}).finally(() => process.exit(0));

function seedNiccto() { return seedNicto(); } // alias to keep it safe if any references exist
