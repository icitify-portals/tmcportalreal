module.exports = {
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations",
    },
    datasource: {
        url: process.env.DATABASE_URL || "mysql://root@127.0.0.1:3306/tmc_portal",
    },
};
