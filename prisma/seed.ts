import 'dotenv/config';
import { PrismaClient, JurisdictionLevel, OrgLevel } from '@prisma/client'

const prisma = new PrismaClient()

console.log(`DATABASE_URL Status: ${process.env.DATABASE_URL ? 'Loaded' : 'Missing'}`);
async function main() {
  console.log('🌱 Seeding database...')
  console.log('Checking DB connection...');
  try {
    const userCount = await prisma.user.count();
    console.log(`Connection successful. User count: ${userCount}`);
  } catch (err) {
    console.error("Connection check failed:", err);
    throw err;
  }

  console.log('Creating permissions...')

  // Create default permissions
  const permissions = [
    // Members
    { code: 'members:create', name: 'Create Members', category: 'members', description: 'Create new member accounts' },
    { code: 'members:read', name: 'View Members', category: 'members', description: 'View member information' },
    { code: 'members:update', name: 'Update Members', category: 'members', description: 'Update member information' },
    { code: 'members:delete', name: 'Delete Members', category: 'members', description: 'Delete member accounts' },
    { code: 'members:approve', name: 'Approve Members', category: 'members', description: 'Approve pending member applications' },

    // Officials
    { code: 'officials:create', name: 'Create Officials', category: 'officials', description: 'Create official positions' },
    { code: 'officials:read', name: 'View Officials', category: 'officials', description: 'View official information' },
    { code: 'officials:update', name: 'Update Officials', category: 'officials', description: 'Update official information' },
    { code: 'officials:delete', name: 'Delete Officials', category: 'officials', description: 'Remove officials' },

    // Roles & Permissions
    { code: 'roles:create', name: 'Create Roles', category: 'roles', description: 'Create new roles' },
    { code: 'roles:read', name: 'View Roles', category: 'roles', description: 'View roles and permissions' },
    { code: 'roles:update', name: 'Update Roles', category: 'roles', description: 'Update role information' },
    { code: 'roles:delete', name: 'Delete Roles', category: 'roles', description: 'Delete roles' },
    { code: 'roles:assign', name: 'Assign Roles', category: 'roles', description: 'Assign roles to users' },
    { code: 'permissions:manage', name: 'Manage Permissions', category: 'roles', description: 'Manage role permissions' },

    // Organizations
    { code: 'organizations:create', name: 'Create Organizations', category: 'organizations', description: 'Create new organizations' },
    { code: 'organizations:read', name: 'View Organizations', category: 'organizations', description: 'View organization information' },
    { code: 'organizations:update', name: 'Update Organizations', category: 'organizations', description: 'Update organization information' },
    { code: 'organizations:delete', name: 'Delete Organizations', category: 'organizations', description: 'Delete organizations' },

    // Payments
    { code: 'payments:create', name: 'Create Payments', category: 'payments', description: 'Create payment records' },
    { code: 'payments:read', name: 'View Payments', category: 'payments', description: 'View payment information' },
    { code: 'payments:update', name: 'Update Payments', category: 'payments', description: 'Update payment records' },
    { code: 'payments:refund', name: 'Refund Payments', category: 'payments', description: 'Process refunds' },

    // Documents
    { code: 'documents:create', name: 'Upload Documents', category: 'documents', description: 'Upload documents' },
    { code: 'documents:read', name: 'View Documents', category: 'documents', description: 'View documents' },
    { code: 'documents:update', name: 'Update Documents', category: 'documents', description: 'Update document information' },
    { code: 'documents:delete', name: 'Delete Documents', category: 'documents', description: 'Delete documents' },

    // Audit & Reports
    { code: 'audit:read', name: 'View Audit Logs', category: 'audit', description: 'View system audit logs' },
    { code: 'reports:read', name: 'View Reports', category: 'reports', description: 'View reports' },
    { code: 'reports:generate', name: 'Generate Reports', category: 'reports', description: 'Generate new reports' },

    // Users
    { code: 'users:create', name: 'Create Users', category: 'users', description: 'Create user accounts' },
    { code: 'users:read', name: 'View Users', category: 'users', description: 'View user information' },
    { code: 'users:update', name: 'Update Users', category: 'users', description: 'Update user accounts' },
    { code: 'users:delete', name: 'Delete Users', category: 'users', description: 'Delete user accounts' },
  ]

  console.log('Creating permissions...')
  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: perm,
      create: perm,
    })
  }
  console.log(`✅ Created ${permissions.length} permissions`)

  // Create National Organization
  const nationalOrg = await prisma.organization.upsert({
    where: { code: 'TMC-NAT' },
    update: {},
    create: {
      name: 'The Muslim Congress (National)',
      code: 'TMC-NAT',
      level: OrgLevel.NATIONAL,
      description: 'National Headquarters',
      country: 'Nigeria',
      isActive: true,
      welcomeMessage: 'Welcome to TMC Portal',
      welcomeImageUrl: '/images/logo.png'
    },
  })
  console.log('✅ Created National Organization')

  // Create default roles
  const roles = [
    {
      name: 'Super Admin',
      code: 'SUPER_ADMIN',
      description: 'Full system access with no jurisdiction limits',
      jurisdictionLevel: JurisdictionLevel.SYSTEM,
      isSystem: true,
      permissions: permissions.map(p => p.code), // All permissions
    },
    {
      name: 'National Admin',
      code: 'NATIONAL_ADMIN',
      description: 'National level administrator with full access to national jurisdiction',
      jurisdictionLevel: JurisdictionLevel.NATIONAL,
      isSystem: true,
      permissions: [
        'members:create', 'members:read', 'members:update', 'members:approve',
        'officials:create', 'officials:read', 'officials:update',
        'organizations:read', 'organizations:update',
        'payments:create', 'payments:read', 'payments:update',
        'documents:create', 'documents:read', 'documents:update',
        'audit:read', 'reports:read', 'reports:generate',
        'roles:read', 'roles:assign',
      ],
    },
    {
      name: 'State Admin',
      code: 'STATE_ADMIN',
      description: 'State level administrator with full access to state jurisdiction',
      jurisdictionLevel: JurisdictionLevel.STATE,
      isSystem: true,
      permissions: [
        'members:create', 'members:read', 'members:update', 'members:approve',
        'officials:read',
        'organizations:read',
        'payments:create', 'payments:read', 'payments:update',
        'documents:create', 'documents:read', 'documents:update',
        'reports:read',
      ],
    },
    {
      name: 'Local Government Admin',
      code: 'LOCAL_GOVERNMENT_ADMIN',
      description: 'Local Government level administrator',
      jurisdictionLevel: JurisdictionLevel.LOCAL_GOVERNMENT,
      isSystem: true,
      permissions: [
        'members:create', 'members:read', 'members:update',
        'payments:create', 'payments:read',
        'documents:create', 'documents:read', 'documents:update',
      ],
    },
    {
      name: 'Branch Admin',
      code: 'BRANCH_ADMIN',
      description: 'Branch level administrator',
      jurisdictionLevel: JurisdictionLevel.BRANCH,
      isSystem: true,
      permissions: [
        'members:create', 'members:read', 'members:update',
        'payments:create', 'payments:read',
        'documents:create', 'documents:read',
      ],
    },
    {
      name: 'Official',
      code: 'OFFICIAL',
      description: 'Organization official with jurisdiction-based access',
      jurisdictionLevel: JurisdictionLevel.BRANCH,
      isSystem: true,
      permissions: [
        'members:read',
        'payments:read',
        'documents:read',
        'reports:read',
      ],
    },
    {
      name: 'Member',
      code: 'MEMBER',
      description: 'Regular member with limited access',
      jurisdictionLevel: JurisdictionLevel.BRANCH,
      isSystem: true,
      permissions: [
        'members:read', // Own profile
        'payments:read', // Own payments
        'documents:read', // Own documents
      ],
    },
  ]

  console.log('Creating roles...')
  for (const roleData of roles) {
    const { permissions: rolePerms, ...roleInfo } = roleData
    const role = await prisma.role.upsert({
      where: { code: roleInfo.code },
      update: roleInfo,
      create: roleInfo,
    })

    // Assign permissions to role
    for (const permCode of rolePerms) {
      const permission = await prisma.permission.findUnique({
        where: { code: permCode },
      })
      if (permission) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permission.id,
            },
          },
          update: { granted: true },
          create: {
            roleId: role.id,
            permissionId: permission.id,
            granted: true,
          },
        })
      }
    }
  }
  console.log(`✅ Created ${roles.length} roles with permissions`)

  console.log('✅ Created roles with permissions')

  console.log('Seeding navigation items...')

  const nationalOrgForNav = await prisma.organization.findUnique({
    where: { code: 'TMC-NAT' }
  })

  if (nationalOrgForNav) {
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

    for (const item of MENU_ITEMS) {
      const existing = await prisma.navigationItem.findFirst({
        where: {
          label: item.label,
          organizationId: nationalOrgForNav.id
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
            organizationId: nationalOrgForNav.id
          }
        })
        console.log(`+ Added: ${item.label}`)
      } else {
        console.log(`= Skipped: ${item.label}`)
      }
    }
    console.log('✅ Navigation items seeded')
  } else {
    console.error('❌ Could not find National Organization for navigation seeding')
  }

  console.log('✅ Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

