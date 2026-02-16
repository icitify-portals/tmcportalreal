import "dotenv/config";
import { defineConfig } from "prisma/config";

console.log("DEBUG: Loading prisma.config.ts");
console.log("DEBUG: process.env.DATABASE_URL:", process.env.DATABASE_URL ? "Present" : "Missing");
if (process.env.DATABASE_URL) {
    console.log("DEBUG: partial URL:", process.env.DATABASE_URL.substring(0, 20) + "...");
}

export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations",
    },
    datasource: {
        url: process.env.DATABASE_URL || "mysql://tmc_user:Tmcportal123%23@172.17.0.1:3306/tmc_portal",
    },
});
