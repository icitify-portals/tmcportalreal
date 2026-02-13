import "dotenv/config"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

const email = process.argv[2] || "aa.adelopo2@gmail.com" // Default to the email seen in the screenshot/logs if possible, or asking user. 
// User provided screenshot shows "aa.adelopo2@gmail.com" in the corner.

async function main() {
    if (!email) {
        console.error("Please provide an email address")
        process.exit(1)
    }

    console.log(`Verifying user: ${email}...`)

    const user = await db.query.users.findFirst({
        where: eq(users.email, email),
    })

    if (!user) {
        console.error("User not found")
        process.exit(1)
    }

    await db.update(users)
        .set({ emailVerified: new Date() })
        .where(eq(users.id, user.id))

    console.log("User verified successfully")
}

main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err)
        process.exit(1)
    })
