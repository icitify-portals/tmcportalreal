# Setup Guide - Muslim Congress Portal

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL`: Your application URL (e.g., `http://localhost:3000`)
- `RESEND_API_KEY`: Your Resend API key for emails
- `PAYSTACK_SECRET_KEY`: Your Paystack secret key
- `PAYSTACK_PUBLIC_KEY`: Your Paystack public key

### 3. Set Up Database
```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Open Prisma Studio to view database
npx prisma studio
```

### 4. Create Initial Data

You'll need to create:
1. **Organizations**: National, State, and Local organizations
2. **Super Admin**: First admin user with SUPER_ADMIN level
3. **Users**: Members, Officials, and Admins

You can do this through:
- Prisma Studio: `npx prisma studio`
- Database directly
- API endpoints (after creating first admin)

### 5. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` and sign in with your admin credentials.

## Creating Your First Admin

### Option 1: Using Prisma Studio
1. Run `npx prisma studio`
2. Create a User in the `User` table
3. Hash the password using bcrypt (you can use an online tool or Node.js)
4. Create an Admin record linked to that user

### Option 2: Using SQL
```sql
-- Create user (password: 'admin123' - CHANGE THIS!)
INSERT INTO users (id, email, password, name, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@muslimcongress.org',
  '$2a$10$YourHashedPasswordHere', -- Use bcrypt to hash
  'Super Admin',
  NOW(),
  NOW()
);

-- Create admin profile
INSERT INTO admins (id, "userId", "adminLevel", permissions, "isActive", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  (SELECT id FROM users WHERE email = 'admin@muslimcongress.org'),
  'SUPER_ADMIN',
  ARRAY[]::text[],
  true,
  NOW(),
  NOW()
);
```

### Option 3: Create a Seed Script
Create `prisma/seed.ts`:
```typescript
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create organization
  const org = await prisma.organization.create({
    data: {
      name: 'Muslim Congress Nigeria',
      level: 'NATIONAL',
      code: 'NG',
      country: 'Nigeria',
    },
  })

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const user = await prisma.user.create({
    data: {
      email: 'admin@muslimcongress.org',
      password: hashedPassword,
      name: 'Super Admin',
      adminProfile: {
        create: {
          adminLevel: 'SUPER_ADMIN',
          permissions: [],
          organizationId: org.id,
        },
      },
    },
  })

  console.log('Created admin:', user.email)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

Then run: `npx tsx prisma/seed.ts`

## Organization Structure

The system supports a hierarchical structure:
- **National**: Top-level organization (e.g., "Muslim Congress Nigeria")
- **State**: State-level organizations (e.g., "Lagos State")
- **Local**: Local chapters (e.g., "Lagos Central")

Each organization can have:
- Members
- Officials
- Admins (at their level or below)

## User Roles

1. **Super Admin**: Full system access
2. **National Admin**: Manage national level
3. **State Admin**: Manage state level
4. **Local Admin**: Manage local level
5. **Officials**: Organization officials
6. **Members**: Regular members

## Next Steps

1. Create organizations (National, State, Local)
2. Create admin users at each level
3. Set up member registration
4. Configure payment settings
5. Set up email templates
6. Customize UI and branding

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Check database exists

### Authentication Issues
- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your domain
- Ensure user has correct role assignments

### Payment Issues
- Verify Paystack keys are correct
- Check callback URL is configured
- Ensure webhook endpoints are accessible

### Email Issues
- Verify Resend API key
- Check email templates
- Review email logs in database


