import { db } from "./lib/db";
import { users, userRoles, roles, organizations, officials } from "./lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const email = "imocomm@yahoo.com";
  console.log(`Checking user: ${email}`);

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    console.log("User not found");
    return;
  }
  console.log("User:", user.id, user.name);

  const uRoles = await db.select({
    roleId: roles.id,
    roleName: roles.name,
    jurisdictionLevel: roles.jurisdictionLevel,
    orgId: userRoles.organizationId,
    orgName: organizations.name,
  })
  .from(userRoles)
  .innerJoin(roles, eq(userRoles.roleId, roles.id))
  .leftJoin(organizations, eq(userRoles.organizationId, organizations.id))
  .where(eq(userRoles.userId, user.id));

  console.log("Roles:", uRoles);

  const off = await db.select({
    id: officials.id,
    level: officials.positionLevel,
    orgId: officials.organizationId,
    orgName: organizations.name,
  })
  .from(officials)
  .leftJoin(organizations, eq(officials.organizationId, organizations.id))
  .where(eq(officials.userId, user.id));

  console.log("Official Profile:", off);
  
  process.exit(0);
}

main().catch(console.error);
