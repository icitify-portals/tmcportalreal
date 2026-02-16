module.exports = {
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations",
    },
    datasource: {
        url: process.env.DATABASE_URL || "mysql://tmc_user:Tmcportal123%23@172.17.0.1:3306/tmc_portal",
    },
};
