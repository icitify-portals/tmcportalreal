
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const offices = await prisma.office.findMany({
        include: { organization: true }
    });
    console.log('Total Offices:', offices.length);
    const grouped = offices.reduce((acc, office) => {
        const orgName = office.organization.name;
        acc[orgName] = (acc[orgName] || 0) + 1;
        return acc;
    }, {});
    console.log('Offices per Organization:', grouped);
}

main().catch(console.error).finally(() => prisma.$disconnect());
