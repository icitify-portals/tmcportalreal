
import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
import path from 'path'

// Explicitly load .env
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const prisma = new PrismaClient()

async function seed() {
    console.log("Starting Navigation Seed...")

    // 1. Get Organization
    const org = await prisma.organization.findUnique({
        where: { code: 'TMC-NAT' }
    })

    if (!org) {
        console.error("❌ Critical: TMC-NAT organization not found. Run global seed first.")
        process.exit(1)
    }

    console.log(`Using Organization: ${org.name} (${org.id})`)

    // 2. Define Items
    const MENU_ITEMS = [
        { label: "Home", path: "/", order: 0, type: "link" },
        { label: "Dashboard", path: "/dashboard", order: 1, type: "link" },
        { label: "Constitution", path: "/constitution", order: 2, type: "link" },
        { label: "Adhkar Centres", path: "/adhkar", order: 3, type: "link" },
        { label: "Teskiyah Centres", path: "/teskiyah", order: 4, type: "link" },
        { label: "Connect", path: "/connect", order: 5, type: "link" },
        { label: "Events", path: "/programmes", order: 6, type: "link" },
        { label: "Donate", path: "/donate", order: 7, type: "link" },
        { label: "Media Library", path: "/media", order: 8, type: "link" },
    ]

    // 3. Insert Items
    for (const item of MENU_ITEMS) {
        try {
            const existing = await prisma.navigationItem.findFirst({
                where: {
                    label: item.label,
                    organizationId: org.id
                }
            })

            if (!existing) {
                await prisma.navigationItem.create({
                    data: {
                        label: item.label,
                        path: item.path,
                        order: item.order,
                        type: item.type as any,
                        isActive: true,
                        organizationId: org.id
                    }
                })
                console.log(`+ Created: ${item.label}`)
            } else {
                console.log(`= Exists: ${item.label}`)
            }
        } catch (err) {
            console.error(`❌ Failed to create ${item.label}:`, err)
        }
    }

    console.log("Navigation Seed Completed.")
}

seed()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
