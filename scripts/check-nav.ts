
import path from "path"
import dotenv from "dotenv"
const envPath = path.resolve(process.cwd(), ".env");
dotenv.config({ path: envPath });

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function check() {
    try {
        const count = await prisma.navigationItem.count()
        console.log(`Navigation Items Count: ${count}`)
        const items = await prisma.navigationItem.findMany({
            select: { label: true, path: true }
        })
        console.log(JSON.stringify(items, null, 2))
    } catch (e) {
        console.error(e)
    } finally {
        await prisma.$disconnect()
    }
}

check()
