"use server"

import { db } from "@/lib/db"
import { programmes, offices, organizations, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function seedYearPlanner() {
    // 1. Get/Create Organization (National)
    // For seeding, we might need a specific user or org.
    // Let's assume we insert for the first 'NATIONAL' org we find.

    const [org] = await db.select().from(organizations).where(eq(organizations.level, 'NATIONAL')).limit(1)
    if (!org) {
        console.error("No National Organization found")
        return
    }

    // 2. Define Data from Image
    const data = [
        {
            office: "HCFI",
            title: "Seminar;Medical Caravan;Prison Project",
            format: "VIRTUAL",
            frequency: "QUARTERLY",
            objectives: "To increase awareness",
            additionalInfo: "",
            date: new Date("2025-02-16T10:00:00"),
            time: "10:00",
            venue: "HCFI office Anthony",
            budget: "1200000.00",
            committee: "HCFI committee"
        },
        {
            office: "NABO",
            title: "Meeting;TCIC Annual General Meeting",
            format: "VIRTUAL",
            frequency: "BI-ANNUALLY",
            objectives: "Annual General Meeting is purposely to give account of clubs finance positions and declare of dividend to the subscribers.",
            additionalInfo: "No applicable",
            date: new Date("2025-04-20T10:09:00"),
            time: "10:09",
            venue: "Virtual",
            budget: "100000.00",
            committee: "Adisa Adam Agboola Abdul Rasaq and Tajudeen Olusesi"
        },
        {
            office: "HDRU",
            title: "OTHERS",
            format: "VIRTUAL",
            frequency: "WEEKLY",
            objectives: "1.Islamic Propagation 2. Reformation of Aqiiqah (Creed) 3. Teaching of Practical acts of Worship 4. Teaching of Islamic Moral Values",
            additionalInfo: "Social Media Engagement on a Program named: Al-Hujjatu'l-Baalighah or The Perfect Proof (TPP) of (TMC). It can graduate into a weekly radio program like ONA-OLA RADIO PROGRAM owned by National Headquarters",
            date: new Date("2025-07-01T21:00:00"),
            time: "21:00",
            venue: "Social Media e.g Facebook, WhatsApp, Radio etc",
            budget: "1000000.00",
            committee: "As decided"
        },
        {
            office: "NAPO",
            title: "Meeting;TMC Facility Maintenance and Upgrade;International Muslim Cemetary (IMC);Usage of International Muslim Cemetary (IMC);TMC Landed Properties Data Update;Facility Maintenance;Sale of Estate Land;Prototype Design of Congress Masjid;Inventory and Congress Assets Tagging",
            format: "HYBRID", // Physical & Virtual
            frequency: "QUARTERLY",
            objectives: "Uniformity and availability of design options for mosque development, availability of ready and accessible data of Congress assets, tracking progress of project development by state Congresses, etc",
            additionalInfo: "The objectives stated cover for more than one programme",
            date: new Date("2025-07-01T10:00:00"),
            time: "10:00",
            venue: "Various",
            budget: "50000000.00",
            committee: "Napo family committee"
        },
        {
            office: "CGPI",
            title: "Meeting",
            format: "VIRTUAL",
            frequency: "MONTHLY",
            objectives: "1. To set the agenda for the CGPI. 2. To design the programs from the agendas. 3. To plan and fine tune the contents of each program. 4. To execute each of the programs. 5. To evaluate and review each of the programs.",
            additionalInfo: "NIL",
            date: new Date("2025-07-05T10:00:00"),
            time: "10:00",
            venue: "ONLINE",
            budget: "10000.00",
            committee: "PROGRAM MEETING COMMITTEE"
        },
        {
            office: "NADMIN",
            title: "Program Management Meeting",
            format: "VIRTUAL",
            frequency: "MONTHLY",
            objectives: "Monitor and review all programs",
            additionalInfo: "Program management",
            date: new Date("2025-07-05T10:00:00"),
            time: "10:00",
            venue: "Virtual",
            budget: "10000.00",
            committee: "Program management Committee"
        }
    ]

    let count = 0;

    // 3. Loop and Insert
    for (const item of data) {
        // Upsert Office
        let officeId;
        const [existingOffice] = await db.select().from(offices).where(
            // Assuming unique name per org
            eq(offices.name, item.office) // Ideally check orgId too
        ).limit(1)

        if (existingOffice) {
            officeId = existingOffice.id
        } else {
            const [newOffice] = await db.insert(offices).values({
                organizationId: org.id,
                name: item.office,
                description: "Seeded Office"
            }).$returningId()
            officeId = newOffice.id
        }

        // Get a valid user for 'createdBy'
        const [user] = await db.select().from(users).limit(1)
        if (!user) {
            console.error("No users found to set as creator")
            return { success: false, error: "No user found" }
        }

        // Insert Programme
        await db.insert(programmes).values({
            organizationId: org.id,
            title: item.title,
            description: item.objectives || item.title,
            level: org.level,
            status: 'APPROVED',
            venue: item.venue,
            startDate: item.date,
            time: item.time,
            budget: item.budget,
            organizingOfficeId: officeId,
            format: item.format as any,
            frequency: item.frequency as any,
            objectives: item.objectives,
            additionalInfo: item.additionalInfo,
            committee: item.committee,
            createdBy: user.id
        })
        count++
    }

    return { success: true, count }
}
